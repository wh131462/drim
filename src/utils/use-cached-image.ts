import { onScopeDispose, ref, watch } from 'vue';
import { getCachedImage, removeCachedImage } from './image-cache';

export function useCachedImage(source: () => string, version: () => string) {
    const imageSrc = ref('');
    const imageFailed = ref(false);
    let request = 0;
    let recovered = false;

    async function load() {
        const current = ++request;
        imageSrc.value = '';
        imageFailed.value = false;
        const path = await getCachedImage(source(), version());
        if (current === request) imageSrc.value = path;
    }

    async function retryImage() {
        const current = request;
        await removeCachedImage(source(), version(), imageSrc.value);
        if (current === request) await load();
    }

    function onImageError() {
        if (recovered || imageSrc.value === source()) {
            imageFailed.value = true;
            void removeCachedImage(source(), version(), imageSrc.value);
            return;
        }
        recovered = true;
        void retryImage();
    }

    watch(
        [source, version],
        () => {
            recovered = false;
            void load();
        },
        { immediate: true }
    );
    onScopeDispose(() => {
        request++;
    });
    return { imageSrc, imageFailed, retryImage, onImageError };
}
