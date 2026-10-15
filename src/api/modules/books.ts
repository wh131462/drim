import { get, post, put, getBaseUrl } from '../request';
import type { Book, BookCategory } from '@/constants/content';

export type BookClickSource = 'catalog' | 'shelf' | 'recommendation';

export interface BookListParams {
    category?: BookCategory;
    saved?: boolean;
    page?: number;
    pageSize?: number;
}

export interface BookListResponse {
    items: Book[];
    total: number;
    page: number;
    pageSize: number;
}

const quiet = { showLoading: false, showError: false };

function resolveCover(book: Book): Book {
    const origin = getBaseUrl().match(/^https?:\/\/[^/]+/i)?.[0] || '';
    const cover = book.coverImage.startsWith('/assets/') ? `${origin}${book.coverImage}` : book.coverImage;
    return {
        ...book,
        coverImage:
            book.coverImage.startsWith('/assets/') && book.coverVersion
                ? `${cover}?v=${encodeURIComponent(book.coverVersion)}`
                : cover
    };
}

export const booksApi = {
    async getList(params: BookListParams): Promise<BookListResponse> {
        const result = await get<BookListResponse>('/books', params, quiet);
        return { ...result, items: result.items.map(resolveCover) };
    },

    getFavorites(): Promise<string[]> {
        return get<string[]>('/books/favorites', undefined, quiet);
    },

    async getRecommendations(topic: string): Promise<Book[]> {
        const books = await post<Book[]>(
            '/books/recommendations',
            { topic: [...topic].slice(0, 2000).join('') },
            quiet
        );
        return books.map(resolveCover);
    },

    async getById(id: string): Promise<Book> {
        return resolveCover(await get<Book>(`/books/${encodeURIComponent(id)}`, undefined, quiet));
    },

    setFavorite(id: string, saved: boolean): Promise<{ saved: boolean }> {
        return put<{ saved: boolean }>(`/books/${encodeURIComponent(id)}/favorite`, { saved }, quiet);
    },

    recordClick(id: string, source: BookClickSource, requestId: string): Promise<{ counted: boolean }> {
        return post<{ counted: boolean }>(`/books/${encodeURIComponent(id)}/click`, { source, requestId }, quiet);
    }
};
