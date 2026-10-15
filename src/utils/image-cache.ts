const STORAGE_KEY = 'book-cover-cache-v1';
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 64;
const MAX_FILE_BYTES = 1024 * 1024;

interface CachedImage {
    source: string;
    version: string;
    path: string;
    size: number;
    usedAt: number;
}

let entries: CachedImage[] | undefined;
const pending = new Map<string, Promise<string>>();
let writes = Promise.resolve();

function index(): CachedImage[] {
    if (!entries) {
        try {
            const stored = uni.getStorageSync(STORAGE_KEY);
            entries = Array.isArray(stored)
                ? stored.filter(
                      (entry) =>
                          entry &&
                          typeof entry.source === 'string' &&
                          typeof entry.version === 'string' &&
                          typeof entry.path === 'string' &&
                          entry.path &&
                          Number.isSafeInteger(entry.size) &&
                          entry.size > 0 &&
                          entry.size <= MAX_FILE_BYTES &&
                          Number.isFinite(entry.usedAt)
                  )
                : [];
        } catch {
            entries = [];
        }
    }
    return entries;
}

async function remove(entry: CachedImage): Promise<void> {
    await new Promise<void>((resolve, reject) =>
        uni.removeSavedFile({ filePath: entry.path, success: () => resolve(), fail: reject })
    );
    entries = index().filter((item) => item !== entry);
    uni.setStorageSync(STORAGE_KEY, entries);
}

export async function removeCachedImage(source: string, version: string, filePath: string): Promise<void> {
    const task = writes.then(async () => {
        const entry = index().find(
            (item) => item.source === source && item.version === version && item.path === filePath
        );
        if (entry) {
            try {
                await remove(entry);
            } catch {
                // A missing/corrupt file must not be returned again, even if removal fails.
                entries = index().filter((item) => item !== entry);
                try {
                    uni.setStorageSync(STORAGE_KEY, entries);
                } catch {
                    /* Next load can rebuild the cache. */
                }
            }
        }
    });
    writes = task.catch(() => {});
    await writes;
}

async function download(source: string, version: string): Promise<string> {
    const cached = index().find((entry) => entry.source === source && entry.version === version);
    if (cached) {
        try {
            await new Promise<void>((resolve, reject) =>
                uni.getSavedFileInfo({ filePath: cached.path, success: () => resolve(), fail: reject })
            );
            cached.usedAt = Date.now();
            try {
                uni.setStorageSync(STORAGE_KEY, index());
            } catch {
                /* The saved image is still usable. */
            }
            return cached.path;
        } catch {
            entries = index().filter((entry) => entry !== cached);
        }
    }

    const tempPath = await new Promise<string>((resolve, reject) =>
        uni.downloadFile({
            url: source,
            timeout: 15000,
            header: { 'Cache-Control': 'no-cache' },
            success: (result) =>
                result.statusCode === 200 && result.tempFilePath
                    ? resolve(result.tempFilePath)
                    : reject(new Error('Image download failed')),
            fail: reject
        })
    );
    try {
        const size = await new Promise<number>((resolve, reject) =>
            uni.getFileInfo({ filePath: tempPath, success: (result) => resolve(result.size), fail: reject })
        );
        // shortcut: images over 1 MiB use temporary files; resize covers on the server before caching larger files.
        if (!size || size > MAX_FILE_BYTES) return tempPath;
        const task = writes.then(async () => {
            while (
                index().length >= MAX_FILES ||
                index().reduce((sum, entry) => sum + entry.size, 0) + size > MAX_BYTES
            ) {
                const oldest = index().reduce((a, b) => (a.usedAt <= b.usedAt ? a : b));
                await remove(oldest);
            }
            const savedPath = await new Promise<string>((resolve, reject) =>
                uni.saveFile({
                    tempFilePath: tempPath,
                    success: (result) => resolve(result.savedFilePath),
                    fail: reject
                })
            );
            const entry = { source, version, path: savedPath, size, usedAt: Date.now() };
            index().push(entry);
            try {
                uni.setStorageSync(STORAGE_KEY, index());
            } catch {
                entries = index().filter((item) => item !== entry);
                uni.removeSavedFile({ filePath: savedPath });
                return source;
            }
            return savedPath;
        });
        writes = task.then(
            () => {},
            () => {}
        );
        return await task;
    } catch {
        return tempPath;
    }
}

export function getCachedImage(source: string, version = ''): Promise<string> {
    if (
        !/^https?:\/\//i.test(source) ||
        typeof uni.saveFile !== 'function' ||
        ['web', 'h5'].includes(uni.getSystemInfoSync().uniPlatform || '')
    )
        return Promise.resolve(source);
    const key = JSON.stringify([source, version]);
    const existing = pending.get(key);
    if (existing) return existing;
    const task = download(source, version)
        .catch(() => source)
        .finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
}
