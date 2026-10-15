import { effectScope, nextTick, ref } from 'vue';
import { getCachedImage, removeCachedImage } from './image-cache';
import { useCachedImage } from './use-cached-image';

jest.mock('./image-cache', () => ({ getCachedImage: jest.fn(), removeCachedImage: jest.fn() }));

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

async function flush() {
    await nextTick();
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();
}

describe('cached image display and recovery', () => {
    let scope: ReturnType<typeof effectScope>;
    const download = jest.mocked(getCachedImage);
    const remove = jest.mocked(removeCachedImage);
    const source = 'https://cdn.example.com/cover.jpg';

    beforeEach(() => {
        scope = effectScope();
        download.mockReset().mockResolvedValue('/wxfile/current/cover.jpg');
        remove.mockReset().mockResolvedValue(undefined);
    });

    afterEach(() => scope.stop());

    it('automatically retries a corrupt cached file once, then shows the failure placeholder', async () => {
        download.mockResolvedValueOnce('/wxfile/bad/cover.jpg').mockResolvedValueOnce('/wxfile/replacement/cover.jpg');
        const image = scope.run(() =>
            useCachedImage(
                () => source,
                () => 'v1'
            )
        )!;
        await flush();
        image.onImageError();
        await flush();
        expect(remove).toHaveBeenCalledWith(source, 'v1', '/wxfile/bad/cover.jpg');
        expect(image.imageSrc.value).toBe('/wxfile/replacement/cover.jpg');
        expect(image.imageFailed.value).toBe(false);
        image.onImageError();
        await flush();
        expect(image.imageFailed.value).toBe(true);
        expect(download).toHaveBeenCalledTimes(2);
        expect(remove).toHaveBeenCalledTimes(2);
        expect(remove).toHaveBeenLastCalledWith(source, 'v1', '/wxfile/replacement/cover.jpg');
    });

    it('shows a placeholder after the fallback URL fails without an automatic request loop', async () => {
        download.mockResolvedValueOnce(source);
        const image = scope.run(() =>
            useCachedImage(
                () => source,
                () => 'v1'
            )
        )!;
        await flush();
        image.onImageError();
        await flush();
        expect(image.imageFailed.value).toBe(true);
        expect(download).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledWith(source, 'v1', source);
    });

    it.each(['source', 'version'])('ignores a stale download after the %s changes', async (changed) => {
        const first = deferred<string>();
        const second = deferred<string>();
        download.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        const imageSource = ref(source);
        const version = ref('v1');
        const image = scope.run(() =>
            useCachedImage(
                () => imageSource.value,
                () => version.value
            )
        )!;
        if (changed === 'source') imageSource.value = 'https://cdn.example.com/new-cover.jpg';
        else version.value = 'v2';
        await nextTick();
        second.resolve('/wxfile/new/cover.jpg');
        await flush();
        first.resolve('/wxfile/old/cover.jpg');
        await flush();
        expect(image.imageSrc.value).toBe('/wxfile/new/cover.jpg');
        expect(image.imageFailed.value).toBe(false);
        expect(download).toHaveBeenLastCalledWith(imageSource.value, version.value);
    });

    it('does not resume an obsolete retry when the source changes during cache removal', async () => {
        const removed = deferred<void>();
        remove.mockReturnValueOnce(removed.promise);
        download.mockResolvedValueOnce('/wxfile/old/cover.jpg').mockResolvedValueOnce('/wxfile/new/cover.jpg');
        const imageSource = ref(source);
        const image = scope.run(() =>
            useCachedImage(
                () => imageSource.value,
                () => 'v1'
            )
        )!;
        await flush();
        const retry = image.retryImage();
        imageSource.value = 'https://cdn.example.com/new-cover.jpg';
        await flush();
        removed.resolve(undefined);
        await retry;
        await flush();
        expect(image.imageSrc.value).toBe('/wxfile/new/cover.jpg');
        expect(download).toHaveBeenCalledTimes(2);
    });

    it('ignores pending downloads after its component scope is disposed', async () => {
        const pending = deferred<string>();
        download.mockReturnValueOnce(pending.promise);
        const image = scope.run(() =>
            useCachedImage(
                () => source,
                () => 'v1'
            )
        )!;
        scope.stop();
        pending.resolve('/wxfile/late/cover.jpg');
        await flush();
        expect(image.imageSrc.value).toBe('');
    });
});
