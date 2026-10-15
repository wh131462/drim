const storageKey = 'book-cover-cache-v1';
const source = 'https://cdn.example.com/cover.jpg?signature=abc';

describe('persistent book cover cache', () => {
    let storage: Record<string, unknown>;
    let files: Map<string, number>;
    let platform: Record<string, jest.Mock>;
    let cache: typeof import('./image-cache');
    let downloadNumber: number;
    let saveNumber: number;

    beforeEach(() => {
        jest.resetModules();
        storage = {};
        files = new Map();
        downloadNumber = 0;
        saveNumber = 0;
        platform = {
            getSystemInfoSync: jest.fn(() => ({ uniPlatform: 'mp-weixin' })),
            getStorageSync: jest.fn((key: string) => storage[key]),
            setStorageSync: jest.fn((key: string, value: unknown) => {
                storage[key] = JSON.parse(JSON.stringify(value));
            }),
            downloadFile: jest.fn((options: UniNamespace.DownloadFileOption) => {
                const tempFilePath = `/tmp/cover-${++downloadNumber}.jpg`;
                files.set(tempFilePath, 1024);
                options.success?.({ statusCode: 200, tempFilePath });
            }),
            getFileInfo: jest.fn((options: UniNamespace.GetFileInfoOptions) => {
                const size = files.get(options.filePath);
                if (size) options.success?.({ size, errMsg: 'ok' });
                else options.fail?.({ errMsg: 'missing' });
            }),
            getSavedFileInfo: jest.fn((options: UniNamespace.GetSavedFileInfoOptions) => {
                const size = files.get(options.filePath);
                if (size) options.success?.({ size, createTime: 1, errMsg: 'ok' });
                else options.fail?.({ errMsg: 'missing' });
            }),
            saveFile: jest.fn((options: UniNamespace.SaveFileOptions) => {
                const savedFilePath = `/wxfile/saved-${++saveNumber}/cover.jpg`;
                files.set(savedFilePath, files.get(options.tempFilePath)!);
                files.delete(options.tempFilePath);
                options.success?.({ savedFilePath });
            }),
            removeSavedFile: jest.fn((options: UniNamespace.RemoveSavedFileOptions) => {
                if (files.delete(options.filePath)) options.success?.({});
                else options.fail?.({ errMsg: 'missing' });
            })
        };
        Object.assign(globalThis, { uni: platform });
        cache = jest.requireActual('./image-cache');
    });

    afterEach(() => Reflect.deleteProperty(globalThis, 'uni'));

    it('reuses a persisted image after restarting the cache module without downloading it', async () => {
        const path = await cache.getCachedImage(source, 'v1');
        jest.resetModules();
        cache = jest.requireActual('./image-cache');
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe(path);
        expect(platform.downloadFile).toHaveBeenCalledTimes(1);
        expect(platform.getSavedFileInfo).toHaveBeenCalledWith(expect.objectContaining({ filePath: path }));
        expect(platform.downloadFile.mock.calls[0][0].url).toBe(source);
    });

    it('shares one pending download across concurrent requests for the same version', async () => {
        let download: UniNamespace.DownloadFileOption | undefined;
        platform.downloadFile.mockImplementationOnce((options) => {
            download = options;
        });
        const first = cache.getCachedImage(source, 'v1');
        const second = cache.getCachedImage(source, 'v1');
        expect(second).toBe(first);
        files.set('/tmp/pending.jpg', 1024);
        download!.success?.({ statusCode: 200, tempFilePath: '/tmp/pending.jpg' });
        const paths = await Promise.all([first, second]);
        expect(paths[0]).toBe(paths[1]);
        expect(platform.downloadFile).toHaveBeenCalledTimes(1);
        expect(platform.saveFile).toHaveBeenCalledTimes(1);
    });

    it('stores updated versions under separate returned directories until ordinary cache eviction', async () => {
        const oldPath = await cache.getCachedImage(source, 'v1');
        const newPath = await cache.getCachedImage(source, 'v2');
        expect(newPath).not.toBe(oldPath);
        expect(files.has(oldPath)).toBe(true);
        expect(files.has(newPath)).toBe(true);
        expect(storage[storageKey]).toEqual([
            expect.objectContaining({ source, version: 'v1', path: oldPath }),
            expect.objectContaining({ source, version: 'v2', path: newPath })
        ]);
        await cache.removeCachedImage(source, 'v1', newPath);
        expect(files.has(newPath)).toBe(true);
    });

    it('downloads again when the operating system has removed the saved file', async () => {
        const first = await cache.getCachedImage(source, 'v1');
        files.delete(first);
        const second = await cache.getCachedImage(source, 'v1');
        expect(second).not.toBe(first);
        expect(files.has(second)).toBe(true);
        expect(platform.downloadFile).toHaveBeenCalledTimes(2);
        expect(storage[storageKey]).toEqual([expect.objectContaining({ path: second })]);
    });

    it('does not delete a newer version when an older download finishes later', async () => {
        const downloads: UniNamespace.DownloadFileOption[] = [];
        platform.downloadFile.mockImplementation((options) => downloads.push(options));
        const older = cache.getCachedImage(source, 'v1');
        const newer = cache.getCachedImage(source, 'v2');
        files.set('/tmp/new.jpg', 1024);
        downloads[1].success?.({ statusCode: 200, tempFilePath: '/tmp/new.jpg' });
        const newPath = await newer;
        files.set('/tmp/old.jpg', 1024);
        downloads[0].success?.({ statusCode: 200, tempFilePath: '/tmp/old.jpg' });
        await older;
        expect(files.has(newPath)).toBe(true);
        await expect(cache.getCachedImage(source, 'v2')).resolves.toBe(newPath);
        expect(platform.downloadFile).toHaveBeenCalledTimes(2);
    });

    it.each(['network', 'http'])('falls back to the source URL after a %s download failure', async (failure) => {
        platform.downloadFile.mockImplementationOnce((options: UniNamespace.DownloadFileOption) => {
            if (failure === 'network') options.fail?.({ errMsg: 'offline' });
            else options.success?.({ statusCode: 404, tempFilePath: '/tmp/error.html' });
        });
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe(source);
        expect(platform.saveFile).not.toHaveBeenCalled();
        await expect(cache.getCachedImage(source, 'v1')).resolves.toMatch(/^\/wxfile\//);
        expect(platform.downloadFile).toHaveBeenCalledTimes(2);
    });

    it('uses the downloaded temporary image when saving fails and keeps the previous version', async () => {
        const oldPath = await cache.getCachedImage(source, 'v1');
        platform.saveFile.mockImplementationOnce((options: UniNamespace.SaveFileOptions) =>
            options.fail?.({ errMsg: 'quota exceeded' })
        );
        await expect(cache.getCachedImage(source, 'v2')).resolves.toBe('/tmp/cover-2.jpg');
        expect(files.has(oldPath)).toBe(true);
        expect(storage[storageKey]).toEqual([expect.objectContaining({ version: 'v1', path: oldPath })]);
    });

    it('uses the temporary image when its size cannot be read', async () => {
        platform.getFileInfo.mockImplementationOnce((options: UniNamespace.GetFileInfoOptions) =>
            options.fail?.({ errMsg: 'unavailable' })
        );
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe('/tmp/cover-1.jpg');
        expect(platform.saveFile).not.toHaveBeenCalled();
    });

    it('keeps oversized covers temporary instead of exceeding its per-file allowance', async () => {
        platform.getFileInfo.mockImplementationOnce((options: UniNamespace.GetFileInfoOptions) =>
            options.success?.({ size: 1024 * 1024 + 1, errMsg: 'ok' })
        );
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe('/tmp/cover-1.jpg');
        expect(platform.saveFile).not.toHaveBeenCalled();
        expect(storage[storageKey]).toBeUndefined();
    });

    it('rebuilds a malformed index without deleting an unrelated file', async () => {
        storage[storageKey] = [
            { source, version: 'v1', path: '/wxfile/user-owned/document.pdf', size: -1, usedAt: 1 },
            null
        ];
        files.set('/wxfile/user-owned/document.pdf', 100);
        await expect(cache.getCachedImage(source, 'v1')).resolves.toMatch(/^\/wxfile\/saved-/);
        expect(files.has('/wxfile/user-owned/document.pdf')).toBe(true);
        expect(platform.removeSavedFile).not.toHaveBeenCalled();
        expect(storage[storageKey]).toEqual([expect.objectContaining({ size: 1024 })]);
    });

    it('downloads normally when persistent storage cannot be read', async () => {
        platform.getStorageSync.mockImplementationOnce(() => {
            throw new Error('unavailable');
        });
        await expect(cache.getCachedImage(source, 'v1')).resolves.toMatch(/^\/wxfile\/saved-/);
        expect(platform.downloadFile).toHaveBeenCalledTimes(1);
    });

    it('keeps a valid saved image usable when updating its last-used storage fails', async () => {
        const path = await cache.getCachedImage(source, 'v1');
        platform.setStorageSync.mockImplementationOnce(() => {
            throw new Error('storage full');
        });
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe(path);
        expect(platform.downloadFile).toHaveBeenCalledTimes(1);
    });

    it('removes a newly saved orphan and returns the source when writing its index fails', async () => {
        platform.setStorageSync.mockImplementationOnce(() => {
            throw new Error('storage full');
        });
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe(source);
        expect(files.has('/wxfile/saved-1/cover.jpg')).toBe(false);
        expect(storage[storageKey]).toBeUndefined();
        await expect(cache.getCachedImage(source, 'v1')).resolves.toMatch(/^\/wxfile\//);
    });

    it.each([
        [64, 1024],
        [8, 1024 * 1024]
    ])('evicts only its least-used cover at a %i-file / %i-byte starting capacity', async (count, size) => {
        const indexed = Array.from({ length: count }, (_, position) => ({
            source: `https://cdn.example.com/${position}.jpg`,
            version: 'v1',
            path: `/wxfile/existing-${position}/cover.jpg`,
            size,
            usedAt: position + 1
        }));
        storage[storageKey] = indexed;
        for (const entry of indexed) files.set(entry.path, entry.size);
        files.set('/wxfile/user-owned/document.pdf', 1024);
        await cache.getCachedImage(indexed[0].source, 'v1');
        await cache.getCachedImage(source, 'v1');
        expect(platform.removeSavedFile).toHaveBeenCalledTimes(1);
        expect(platform.removeSavedFile.mock.calls[0][0].filePath).toBe(indexed[1].path);
        expect(files.has(indexed[0].path)).toBe(true);
        expect(files.has('/wxfile/user-owned/document.pdf')).toBe(true);
        const saved = storage[storageKey] as { size: number }[];
        expect(saved.length).toBeLessThanOrEqual(64);
        expect(saved.reduce((total, entry) => total + entry.size, 0)).toBeLessThanOrEqual(8 * 1024 * 1024);
    });

    it('does not try file persistence for packaged images or the web platform', async () => {
        await expect(cache.getCachedImage('/pages/tarot/static/back.jpg', 'v1')).resolves.toBe(
            '/pages/tarot/static/back.jpg'
        );
        platform.getSystemInfoSync.mockReturnValue({ uniPlatform: 'web' });
        await expect(cache.getCachedImage(source, 'v1')).resolves.toBe(source);
        expect(platform.downloadFile).not.toHaveBeenCalled();
    });

    it('invalidates a corrupt entry even when its saved file cannot be removed', async () => {
        const badPath = await cache.getCachedImage(source, 'v1');
        platform.removeSavedFile.mockImplementationOnce((options: UniNamespace.RemoveSavedFileOptions) =>
            options.fail?.({ errMsg: 'unavailable' })
        );
        await cache.removeCachedImage(source, 'v1', badPath);
        const newPath = await cache.getCachedImage(source, 'v1');
        expect(newPath).not.toBe(badPath);
        expect(storage[storageKey]).toEqual([expect.objectContaining({ path: newPath })]);
    });
});
