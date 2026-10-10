from __future__ import annotations

import argparse
import os
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

import rarfile


MAX_MEMBERS = 10_000
MAX_TOTAL_SIZE = 10 * 1024**3       # 10 GiB
MAX_FILE_SIZE = 2 * 1024**3         # 2 GiB
CHUNK_SIZE = 1024 * 1024            # 1 MiB


class ArchiveError(Exception):
    """Expected archive validation or extraction failure."""


def fail(message: str) -> None:
    raise ArchiveError(message)


def normalize_member_name(name: str) -> tuple[str, bool]:
    """Validate an archive member name and return (relative_path, is_dir)."""
    if not name or "\x00" in name:
        fail("Archive contains an empty or invalid member name")

    # Archive paths should use POSIX separators. Reject backslashes rather
    # than allowing different path interpretations on Windows and Linux.
    if "\\" in name:
        fail(f"Backslash in archive member path: {name!r}")

    if name.startswith("/") or name.startswith("//"):
        fail(f"Absolute archive path is not allowed: {name!r}")

    is_dir = name.endswith("/")
    normalized = name[:-1] if is_dir else name

    if not normalized:
        fail(f"Invalid archive member path: {name!r}")

    path = PurePosixPath(normalized)

    if path.is_absolute() or path.anchor:
        fail(f"Absolute archive path is not allowed: {name!r}")

    parts = normalized.split("/")

    if any(part in ("", ".", "..") for part in parts):
        fail(f"Unsafe archive member path: {name!r}")

    # Reject Windows drive prefixes and alternate data stream syntax.
    if any(":" in part for part in parts):
        fail(f"Colon in archive member path is not allowed: {name!r}")

    return "/".join(parts), is_dir


def validate_zip_member(info: zipfile.ZipInfo) -> tuple[str, bool, int]:
    relative_path, is_dir = normalize_member_name(info.filename)

    if info.flag_bits & 0x1:
        fail(f"Encrypted ZIP members are not supported: {info.filename!r}")

    if info.file_size < 0:
        fail(f"Invalid ZIP member size: {info.filename!r}")

    unix_mode = info.external_attr >> 16
    file_type = stat.S_IFMT(unix_mode)

    # ZIP entries can encode Unix symlinks and special files in their
    # external attributes. Permit regular files, directories, or no type.
    if file_type == stat.S_IFLNK:
        fail(f"Symbolic links are not allowed: {info.filename!r}")

    if file_type not in (0, stat.S_IFREG, stat.S_IFDIR):
        fail(f"Special files are not allowed: {info.filename!r}")

    if file_type == stat.S_IFDIR:
        is_dir = True

    if is_dir and info.file_size != 0:
        fail(f"Directory entry has a non-zero size: {info.filename!r}")

    if not is_dir and file_type == stat.S_IFDIR:
        fail(f"Invalid ZIP directory entry: {info.filename!r}")

    return relative_path, is_dir, info.file_size


def validate_rar_member(info: rarfile.RarInfo) -> tuple[str, bool, int]:
    relative_path, is_dir = normalize_member_name(info.filename)

    if info.file_size < 0:
        fail(f"Invalid RAR member size: {info.filename!r}")

    # RarInfo.is_symlink() is available in modern rarfile releases.
    # file_redir additionally describes RAR5 links and redirects.
    if info.is_symlink() or getattr(info, "file_redir", None) is not None:
        fail(
            f"Links and redirected entries are not allowed: {info.filename!r}")

    if info.is_dir():
        is_dir = True
    elif info.is_file():
        if is_dir:
            fail(f"Conflicting RAR member type: {info.filename!r}")
    else:
        fail(f"Unsupported RAR member type: {info.filename!r}")

    if is_dir and info.file_size != 0:
        fail(f"Directory entry has a non-zero size: {info.filename!r}")

    return relative_path, is_dir, info.file_size


def prepare_members(archive, archive_type: str):
    if archive_type == ".zip":
        raw_members = archive.infolist()
        validate_member = validate_zip_member
    else:
        raw_members = archive.infolist()
        validate_member = validate_rar_member

    if len(raw_members) > MAX_MEMBERS:
        fail(f"Archive has too many members: {len(raw_members)}")

    member_list = []
    seen_paths: dict[str, bool] = {}
    declared_total = 0

    for info in raw_members:
        relative_path, is_dir, file_size = validate_member(info)

        # Case-insensitive collision checks also prevent common Windows
        # filename collisions. This is intentionally conservative.
        collision_key = relative_path.casefold()

        if collision_key in seen_paths:
            fail(f"Duplicate or conflicting member path: {relative_path!r}")

        seen_paths[collision_key] = is_dir

        if file_size > MAX_FILE_SIZE:
            fail(f"Member exceeds the file size limit: {relative_path!r}")

        if not is_dir:
            declared_total += file_size

        if declared_total > MAX_TOTAL_SIZE:
            fail("Archive exceeds the total uncompressed size limit")

        member_list.append((info, relative_path, is_dir, file_size))

    # Reject file/directory prefix conflicts, e.g. a file named "a"
    # alongside another member named "a/b.txt".
    for _, relative_path, is_dir, _ in member_list:
        parts = relative_path.split("/")

        for index in range(1, len(parts)):
            parent_key = "/".join(parts[:index]).casefold()

            if seen_paths.get(parent_key) is False:
                fail(f"File is used as a parent directory: {relative_path!r}")

        if not is_dir:
            child_prefix = relative_path.casefold() + "/"

            if any(key.startswith(child_prefix) for key in seen_paths):
                fail(f"File conflicts with a directory: {relative_path!r}")

    return member_list


def extract_members(archive, member_list, output_dir: Path) -> None:
    output_root = output_dir.resolve()
    actual_total = 0

    for info, relative_path, is_dir, declared_size in member_list:
        target = output_dir.joinpath(*relative_path.split("/"))

        # Lexical validation is performed before joining; this additional
        # check protects against unexpected path interpretation.
        resolved_target = target.resolve(strict=False)

        if not resolved_target.is_relative_to(output_root):
            fail(f"Member escapes output directory: {relative_path!r}")

        if is_dir:
            target.mkdir(parents=True, exist_ok=True)
            continue

        target.parent.mkdir(parents=True, exist_ok=True)

        # Exclusive creation prevents overwriting an existing file.
        # The output directory must be empty before extraction begins.
        with archive.open(info, "r") as source, target.open("xb") as dest:
            actual_file_size = 0

            while True:
                chunk = source.read(CHUNK_SIZE)

                if not chunk:
                    break

                chunk_size = len(chunk)
                actual_file_size += chunk_size
                actual_total += chunk_size

                if actual_file_size > MAX_FILE_SIZE:
                    fail(f"Actual file size exceeds limit: {relative_path!r}")

                if actual_total > MAX_TOTAL_SIZE:
                    fail("Actual extracted size exceeds total limit")

                dest.write(chunk)

            if actual_file_size != declared_size:
                fail(
                    f"Size mismatch for {relative_path!r}: "
                    f"expected {declared_size}, got {actual_file_size}"
                )


def extract_archive(archive_path: Path, output_dir: Path) -> None:
    archive_path = archive_path.resolve(strict=True)
    output_dir = output_dir.resolve(strict=False)

    if not archive_path.is_file():
        fail("Archive path is not a regular file")

    if archive_path == output_dir or archive_path.is_relative_to(output_dir):
        fail("Archive must not be inside the extraction output directory")

    extension = archive_path.suffix.lower()

    if extension not in (".zip", ".rar"):
        fail(f"Unsupported archive type: {extension or 'unknown'}")

    if output_dir.exists():
        if output_dir.is_symlink() or not output_dir.is_dir():
            fail("Output path must be a regular directory")

        if any(output_dir.iterdir()):
            fail("Output directory must be empty")
    else:
        output_dir.mkdir(parents=True, exist_ok=False)

    try:
        if extension == ".zip":
            with zipfile.ZipFile(archive_path, "r") as archive:
                member_list = prepare_members(archive, extension)
                extract_members(archive, member_list, output_dir)
        else:
            with rarfile.RarFile(archive_path, "r") as archive:
                member_list = prepare_members(archive, extension)
                extract_members(archive, member_list, output_dir)

    except Exception:
        # The caller must provide a dedicated output directory.
        # Since it was empty before this run, remove partial output.
        shutil.rmtree(output_dir, ignore_errors=True)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Safely extract ZIP or RAR archives."
    )
    parser.add_argument("archive_path", type=Path)
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()

    try:
        extract_archive(args.archive_path, args.output_dir)
        print('{"success": true}')
        return 0

    except Exception as error:
        print(
            f"Archive extraction failed: {error}",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
