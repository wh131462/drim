import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { BooksService } from './books.service';

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
