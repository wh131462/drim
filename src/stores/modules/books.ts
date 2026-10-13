import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { booksApi } from '@/api/modules/books';
import { useUserStore } from './user';

export const useBooksStore = defineStore('books', () => {
    const userStore = useUserStore();
    const savedIds = ref<string[]>([]);
    const pendingIds = ref<string[]>([]);
    const favoritesReady = ref(false);
    let favoritesPromise: Promise<void> | null = null;
    let revision = 0;

    watch(
        () => userStore.token,
        () => {
            savedIds.value = [];
            pendingIds.value = [];
            favoritesReady.value = false;
            favoritesPromise = null;
            revision++;
        },
        { flush: 'sync' }
    );

    async function ensureSession(): Promise<string> {
        if (!userStore.token) await userStore.login();
        if (!userStore.token) throw new Error('请先登录后重试');
        return userStore.token;
    }

    async function loadFavorites(refresh = false): Promise<void> {
        const token = await ensureSession();
        if (userStore.token !== token) throw new Error('登录状态已变化，请重试');
        if (favoritesPromise) return favoritesPromise;
        if (favoritesReady.value && !refresh) return;
        const startedRevision = revision;
        const request = booksApi.getFavorites().then((ids) => {
            if (userStore.token !== token || revision !== startedRevision) return;
            savedIds.value = ids;
            favoritesReady.value = true;
        });
        favoritesPromise = request;
        try {
            await request;
        } finally {
            if (favoritesPromise === request) favoritesPromise = null;
        }
    }

    async function toggleFavorite(id: string): Promise<boolean> {
        if (pendingIds.value.includes(id)) return savedIds.value.includes(id);
        const token = await ensureSession();
        await loadFavorites();
        if (userStore.token !== token) throw new Error('登录状态已变化，请重试');
        if (pendingIds.value.includes(id)) return savedIds.value.includes(id);
        pendingIds.value = [...pendingIds.value, id];
        revision++;
        try {
            const result = await booksApi.setFavorite(id, !savedIds.value.includes(id));
            if (userStore.token !== token) throw new Error('登录状态已变化，请重试');
            savedIds.value = result.saved
                ? [...new Set([...savedIds.value, id])]
                : savedIds.value.filter((savedId) => savedId !== id);
            revision++;
            return result.saved;
        } finally {
            if (userStore.token === token) pendingIds.value = pendingIds.value.filter((pendingId) => pendingId !== id);
        }
    }

    return { savedIds, pendingIds, favoritesReady, ensureSession, loadFavorites, toggleFavorite };
});
