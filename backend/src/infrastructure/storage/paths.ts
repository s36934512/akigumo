import path from "node:path";

import { env } from "#app/config/env.js";

export const STORAGE = path.resolve(env.storage.path);
export const TMP = path.resolve(env.storage.tmpPath);

export const TMP_UPLOADS = path.join(TMP, "uploads");
export const TMP_PROCESS = path.join(TMP, "process");
export const TMP_ERRORS = path.join(TMP, "errors");
export const TMP_TUS = path.join(TMP, "tus-uploads");

export const STORAGE_ORIGINALS = path.join(STORAGE, "originals");
export const STORAGE_THUMBNAILS = path.join(STORAGE, "thumbnails");
export const STORAGE_RECORD = path.join(STORAGE, "tus-record");

const pathConstants = {
    STORAGE,
    TMP,
    TMP_UPLOADS,
    TMP_PROCESS,
    TMP_ERRORS,
    TMP_TUS,
    STORAGE_ORIGINALS,
    STORAGE_THUMBNAILS,
    STORAGE_RECORD,
} as const;

export namespace Paths {
    export type PathKeys = keyof typeof pathConstants;
}

function resolveArg(arg: Paths.PathKeys | string): string {
    if (arg in pathConstants) {
        return pathConstants[arg as Paths.PathKeys];
    }

    return arg;
}

export function concat(...args: (Paths.PathKeys | string)[]): string {
    return path.join(...args.map(resolveArg));
}

export function relative(to: string, from: string = STORAGE): string {
    const rel = path.relative(from, to);
    return rel.startsWith(".") ? rel : `/${rel}`;
}

export function basename(filePath: string, withExt = true): string {
    return withExt
        ? path.basename(filePath)
        : path.basename(filePath, path.extname(filePath));
}

export function ext(filePath: string): string {
    return path.extname(filePath).slice(1).toLowerCase();
}

export function sanitize(name: string): string {
    return name.replace(/[<>:"/\\|?*\0\n\r\t]/g, "_");
}

export function renameFilename(filePath: string, newBaseName: string): string {
    const dir = path.dirname(filePath);
    const extname = path.extname(filePath);
    const safeName = sanitize(newBaseName);

    return path.join(dir, `${safeName}${extname}`);
}

export function changeExt(filePath: string, newExt: string): string {
    const dir = path.dirname(filePath);
    const nameWithoutExt = basename(filePath, false);
    const formattedExt = newExt.startsWith(".") ? newExt : `.${newExt}`;

    return path.join(dir, `${nameWithoutExt}${formattedExt}`);
}
