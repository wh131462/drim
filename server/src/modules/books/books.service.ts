import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Book, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { BookClickDto, BooksQueryDto } from './dto/books.dto';

const publishedWhere = { published: true, deletedAt: null };
const bookOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

function formatBook(book: Book) {
    return {
        id: book.id,
        category: book.category,
        title: book.title,
        author: book.author,
        tag: book.tag,
        price: book.price,
        coverImage: book.coverImage,
        description: book.description,
        reason: book.reason,
        comingSoon: book.comingSoon
    };
}

@Injectable()
export class BooksService {
    constructor(private readonly prisma: PrismaService) {}

    async list(userId: string, query: BooksQueryDto) {
        const where: Prisma.BookWhereInput = {
            ...publishedWhere,
            ...(query.category ? { category: query.category } : {}),
            ...(query.saved === 'true' ? { favorites: { some: { userId } } } : {})
        };
        const { page, pageSize } = query;
        const [books, total] = await this.prisma.$transaction([
            this.prisma.book.findMany({ where, orderBy: bookOrder, skip: (page - 1) * pageSize, take: pageSize }),
            this.prisma.book.count({ where })
        ]);
        return { items: books.map(formatBook), total, page, pageSize };
    }

    async favorites(userId: string) {
        const favorites = await this.prisma.bookFavorite.findMany({
            where: { userId },
            select: { bookId: true },
            orderBy: { createdAt: 'desc' }
        });
        return favorites.map((favorite) => favorite.bookId);
    }

    async recommendations(topic = '') {
        const category = /亲人|家庭|争吵|关系/.test(topic)
            ? 'relationship'
            : /考试|追逐|迷路|焦虑|压力/.test(topic)
              ? 'emotion'
              : /飞行|水|死亡|潜意识|梦/.test(topic)
                ? 'dream'
                : null;
        const books = await this.prisma.book.findMany({
            where: { ...publishedWhere, comingSoon: false, ...(category ? { category } : {}) },
            orderBy: bookOrder,
            take: 2
        });
        if (books.length < 2 && category) {
            books.push(
                ...(await this.prisma.book.findMany({
                    where: { ...publishedWhere, comingSoon: false, id: { notIn: books.map((book) => book.id) } },
                    orderBy: bookOrder,
                    take: 2 - books.length
                }))
            );
        }
        return books.map(formatBook);
    }

    private async publishedBook(id: string) {
        const book = await this.prisma.book.findFirst({ where: { id, ...publishedWhere } });
        if (!book) throw new NotFoundException('书籍已下架或不存在');
        return book;
    }

    async detail(id: string) {
        return formatBook(await this.publishedBook(id));
    }

    async setFavorite(userId: string, bookId: string, saved: boolean) {
        if (saved) {
            await this.publishedBook(bookId);
            // 数据库唯一键保证重试和同时收藏不会产生重复记录。
            await this.prisma.bookFavorite.createMany({ data: [{ userId, bookId }], skipDuplicates: true });
        } else {
            await this.prisma.bookFavorite.deleteMany({ where: { userId, bookId } });
        }
        return { saved };
    }

    async click(userId: string, bookId: string, dto: BookClickDto) {
        const existing = await this.prisma.bookClick.findUnique({
            where: { userId_requestId: { userId, requestId: dto.requestId } }
        });
        if (existing) {
            if (existing.bookId !== bookId || existing.source !== dto.source) {
                throw new BadRequestException('点击请求标识已被使用');
            }
            return { counted: false };
        }
        await this.publishedBook(bookId);
        try {
            await this.prisma.bookClick.create({ data: { userId, bookId, ...dto } });
            return { counted: true };
        } catch (error) {
            if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
            const duplicate = await this.prisma.bookClick.findUnique({
                where: { userId_requestId: { userId, requestId: dto.requestId } }
            });
            if (duplicate?.bookId !== bookId || duplicate?.source !== dto.source) {
                throw new BadRequestException('点击请求标识已被使用');
            }
            return { counted: false };
        }
    }
}
