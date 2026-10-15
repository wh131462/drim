import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Book, Prisma } from '@prisma/client';
import { stat } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '@/prisma/prisma.service';
import { BooksService } from './books.service';

jest.mock('fs/promises', () => ({ ...jest.requireActual('fs/promises'), stat: jest.fn() }));

describe('书籍封面缓存版本', () => {
    const fileStat = stat as jest.Mock;
    const updatedAt = new Date('2026-10-14T00:00:00.000Z');
    const book = { id: 'book-a', coverImage: '/assets/books/book.jpg', updatedAt } as Book;
    const makeService = (coverImage = book.coverImage, recordUpdatedAt = updatedAt) => {
        const record = { ...book, coverImage, updatedAt: recordUpdatedAt };
        const prisma = {
            $transaction: jest.fn().mockResolvedValue([[record], 1]),
            book: {
                findFirst: jest.fn().mockResolvedValue(record),
                findMany: jest.fn().mockResolvedValue([record]),
                count: jest.fn().mockResolvedValue(1)
            }
        };
        return new BooksService(prisma as unknown as PrismaService);
    };

    beforeEach(() => fileStat.mockReset());

    it('本地封面原地址不变时，文件更新时间或大小变化会产生新版本', async () => {
        const service = makeService();
        fileStat
            .mockResolvedValueOnce({ mtimeMs: 1000, size: 2000 })
            .mockResolvedValueOnce({ mtimeMs: 1001, size: 2000 })
            .mockResolvedValueOnce({ mtimeMs: 1001, size: 2001 });
        const first = await service.detail(book.id);
        const second = await service.detail(book.id);
        const third = await service.detail(book.id);
        expect([first.coverVersion, second.coverVersion, third.coverVersion]).toEqual([
            '1000-2000',
            '1001-2000',
            '1001-2001'
        ]);
        expect(first.coverImage).toBe(book.coverImage);
        expect(fileStat).toHaveBeenCalledWith(join(__dirname, '..', '..', '..', 'public', 'books', 'book.jpg'));
    });

    it('列表和推荐都会返回已解析的封面版本', async () => {
        fileStat.mockResolvedValue({ mtimeMs: 1000, size: 2000 });
        const service = makeService();
        const list = await service.list('user-a', { page: 1, pageSize: 20 });
        const recommendations = await service.recommendations();
        expect(list.items[0].coverVersion).toBe('1000-2000');
        expect(recommendations[0].coverVersion).toBe('1000-2000');
    });

    it('本地文件缺失时沿用书籍更新时间，不阻断书籍接口', async () => {
        fileStat.mockRejectedValue(new Error('ENOENT'));
        await expect(makeService().detail(book.id)).resolves.toMatchObject({
            coverImage: book.coverImage,
            coverVersion: updatedAt.toISOString()
        });
    });

    it('远程封面原地址不变时，重新保存书籍会产生新版本', async () => {
        const coverImage = 'https://cdn.example.com/cover.jpg?signature=abc';
        const first = await makeService(coverImage).detail(book.id);
        const second = await makeService(coverImage, new Date(updatedAt.getTime() + 1)).detail(book.id);
        expect(first.coverVersion).not.toBe(second.coverVersion);
        expect(second.coverImage).toBe(coverImage);
        expect(fileStat).not.toHaveBeenCalled();
    });

    it.each(['https://cdn.example.com/cover.jpg?signature=abc', '/assets/books/../secret.jpg'])(
        '%s 使用书籍更新时间，且不访问本地文件',
        async (coverImage) => {
            await expect(makeService(coverImage).detail(book.id)).resolves.toMatchObject({
                coverImage,
                coverVersion: updatedAt.toISOString()
            });
            expect(fileStat).not.toHaveBeenCalled();
        }
    );
});

describe('书籍互动边界', () => {
    const dto = { requestId: 'click-12345678', source: 'catalog' as const };
    const makeService = () => {
        const prisma = {
            book: { findFirst: jest.fn().mockResolvedValue({ id: 'book-a' }) },
            bookClick: { findUnique: jest.fn(), create: jest.fn().mockResolvedValue({}) },
            bookFavorite: {
                createMany: jest.fn().mockResolvedValue({ count: 1 }),
                deleteMany: jest.fn().mockResolvedValue({ count: 1 })
            }
        };
        return { prisma, service: new BooksService(prisma as unknown as PrismaService) };
    };

    it('同一点击重试不再次写入；请求标识不能用于另一本书', async () => {
        const { service, prisma } = makeService();
        prisma.bookClick.findUnique.mockResolvedValue({ bookId: 'book-a', source: 'catalog' });
        await expect(service.click('user-a', 'book-a', dto)).resolves.toEqual({ counted: false });
        await expect(service.click('user-a', 'book-b', dto)).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.bookClick.create).not.toHaveBeenCalled();
    });

    it('并发重复点击由唯一键处理，只算一条', async () => {
        const { service, prisma } = makeService();
        prisma.bookClick.findUnique
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ bookId: 'book-a', source: 'catalog' });
        prisma.bookClick.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '5' })
        );
        await expect(service.click('user-a', 'book-a', dto)).resolves.toEqual({ counted: false });
    });

    it('下架后可取消已有收藏，但不能继续新增收藏', async () => {
        const { service, prisma } = makeService();
        prisma.book.findFirst.mockResolvedValue(null);
        await expect(service.setFavorite('user-a', 'book-a', true)).rejects.toBeInstanceOf(NotFoundException);
        expect(prisma.bookFavorite.createMany).not.toHaveBeenCalled();
        await expect(service.setFavorite('user-a', 'book-a', false)).resolves.toEqual({ saved: false });
        expect(prisma.bookFavorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-a', bookId: 'book-a' } });
    });
});
