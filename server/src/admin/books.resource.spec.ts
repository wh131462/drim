import 'reflect-metadata';
import type { ActionContext, ActionRequest, ResourceOptions } from 'adminjs';
import { PrismaService } from '@/prisma/prisma.service';
import { booksResourceOptions, isBookCoverUrl } from './books.resource';

class ValidationError extends Error {
    constructor(public propertyErrors: Record<string, unknown>) {
        super('invalid');
    }
}

describe('后台书籍写入边界', () => {
    it('拒绝脚本、路径穿越及非 HTTPS 封面', () => {
        expect(isBookCoverUrl('/assets/books/dream-analysis.jpg')).toBe(true);
        expect(isBookCoverUrl('https://cdn.example.com/cover.png')).toBe(true);
        for (const value of [
            'javascript:alert(1)',
            '/assets/books/../secret.png',
            'http://example.com/book.jpg',
            'https://user:pass@example.com/book.jpg'
        ]) {
            expect(isBookCoverUrl(value)).toBe(false);
        }
    });

    it('后台提交无法修改 ID、删除标记及统计字段', async () => {
        const options = booksResourceOptions(
            {} as PrismaService,
            ValidationError as unknown as typeof import('adminjs').ValidationError
        );
        const actions = options.actions as NonNullable<ResourceOptions['actions']>;
        const before = actions.new!.before as (
            request: ActionRequest,
            context: ActionContext
        ) => Promise<ActionRequest>;
        const request: ActionRequest = {
            method: 'post',
            params: { action: 'new', resourceId: 'Book' },
            payload: {
                category: 'dream',
                title: '梦的解析',
                author: '作者',
                coverImage: '/assets/books/dream-analysis.jpg',
                description: '简介',
                reason: '推荐理由',
                id: 'hacked',
                deletedAt: '2020-01-01',
                clickCount: 999
            }
        };
        const result = await before(request, {} as ActionContext);
        expect(result.payload).not.toHaveProperty('id');
        expect(result.payload).not.toHaveProperty('deletedAt');
        expect(result.payload).not.toHaveProperty('clickCount');
        expect(result.payload?.published).toBe(false);
    });

    it('批量删除只更新软删除标记，不删除历史互动', async () => {
        const updateMany = jest.fn().mockResolvedValue({ count: 2 });
        const options = booksResourceOptions(
            { book: { updateMany } } as unknown as PrismaService,
            ValidationError as unknown as typeof import('adminjs').ValidationError
        );
        const actions = options.actions as NonNullable<ResourceOptions['actions']>;
        const handler = actions.bulkDelete!.handler as (
            request: ActionRequest,
            response: unknown,
            context: ActionContext
        ) => Promise<unknown>;
        const record = (id: string) => ({ id: () => id, toJSON: () => ({ params: { id } }) });
        const context = {
            records: [record('book-a'), record('book-b')],
            resource: { id: () => 'Book' },
            h: { resourceUrl: () => '/admin/resources/Book' }
        } as unknown as ActionContext;
        await handler({ method: 'get', params: { resourceId: 'Book', action: 'bulkDelete' } }, {}, context);
        expect(updateMany).not.toHaveBeenCalled();
        await handler({ method: 'post', params: { resourceId: 'Book', action: 'bulkDelete' } }, {}, context);
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: { in: ['book-a', 'book-b'] }, deletedAt: null },
            data: { deletedAt: expect.any(Date), published: false }
        });
    });
});
