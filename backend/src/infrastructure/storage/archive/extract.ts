import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const EXECUTION_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_BUFFER_BYTES = 10 * 1024 * 1024;

const SCRIPT_PATH = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../../scripts/archive/extract_archive.py",
);

export interface ExtractArchiveOptions {
    archivePath: string;
    outputDir: string;
}

export interface ExtractArchiveResult {
    success: true;
}

export async function extractArchiveWithPython({
    archivePath,
    outputDir,
}: ExtractArchiveOptions): Promise<ExtractArchiveResult> {
    const pythonCommand =
        process.env.PYTHON_BIN ||
        (process.platform === "win32" ? "python" : "python3");

    let stdout: string;

    try {
        ({ stdout } = await execFileAsync(
            pythonCommand,
            [SCRIPT_PATH, archivePath, outputDir],
            {
                timeout: EXECUTION_TIMEOUT_MS,
                maxBuffer: MAX_BUFFER_BYTES,
                windowsHide: true,
                encoding: "utf8",
            },
        ));
    } catch (error) {
        const details = error as NodeJS.ErrnoException & {
            code?: string | number;
            stderr?: string;
            killed?: boolean;
            signal?: string;
        };

        if (details.code === "ENOENT") {
            throw new Error(
                `Python executable or extraction script not found. ` +
                    `PYTHON_BIN=${pythonCommand}, script=${SCRIPT_PATH}`,
                { cause: error },
            );
        }

        if (details.killed) {
            throw new Error(
                `Archive extraction process timed out or was terminated: ` +
                    `${archivePath}`,
                { cause: error },
            );
        }

        const stderr = details.stderr?.trim();
        const exitCode = details.code ?? "unknown";

        throw new Error(
            [
                `Archive extraction failed.`,
                `Archive: ${archivePath}`,
                `Exit code: ${exitCode}`,
                stderr ? `stderr: ${stderr}` : undefined,
            ]
                .filter(Boolean)
                .join("\n"),
            { cause: error },
        );
    }

    let result: unknown;

    try {
        result = JSON.parse(stdout);
    } catch (error) {
        throw new Error("Python extraction script returned invalid JSON.", {
            cause: error,
        });
    }

    if (
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
    ) {
        throw new Error(
            "Python extraction script returned an unexpected result.",
        );
    }

    return { success: true };
}
