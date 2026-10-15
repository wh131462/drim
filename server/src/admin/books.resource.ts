import type {
    ActionContext,
    ActionRequest,
    ActionResponse,
    PropertyOptions,
    RecordJSON,
    ResourceOptions
} from 'adminjs';
import { PrismaService } from '@/prisma/prisma.service';
import { BOOK_CATEGORIES } from '@/modules/books/dto/books.dto';

const editableFields = [
    'category',
    'title',
    'author',
    'tag',
    'price',
    'coverImage',
    'description',
    'reason',
    'comingSoon',
    'published',
    'sortOrder'
];
const textLimits: Record<string, number> = {
    title: 160,
    author: 120,
    tag: 64,
    price: 32,
    coverImage: 512,
    description: 4000,
    reason: 2000
};
const categoryLabels = ['梦与潜意识', '情绪整理', '关系', '成长', '人格'];

export function isBookCoverUrl(value: string): boolean {
    if (/^\/assets\/books\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpg|jpeg|png|webp)$/.test(value)) return true;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
    } catch {
        return false;
    }
}

function shanghaiDayStart(daysBack = 0): Date {
    const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return new Date(
        Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() - daysBack) - 8 * 60 * 60 * 1000
    );
}

export function booksResourceOptions(
    prisma: PrismaService,
    ValidationError: typeof import('adminjs').ValidationError
): ResourceOptions {
    const validate = async (request: ActionRequest, context: ActionContext) => {
        if (request.method !== 'post') return request;
        const values = { ...context.record?.params, ...request.payload };
        const errors: Record<string, { message: string }> = {};
        const payload: Record<string, unknown> = {};
        for (const [field, limit] of Object.entries(textLimits)) {
            const value = values[field] ?? '';
            if (typeof value !== 'string' || value.trim().length > limit) {
                errors[field] = { message: `请输入不超过 ${limit} 字的文本` };
                continue;
            }
            payload[field] = value.trim();
            if (!['tag', 'price'].includes(field) && !value.trim()) {
                errors[field] = { message: '此项不能为空' };
            }
        }
        if (!(BOOK_CATEGORIES as readonly unknown[]).includes(values.category)) {
            errors.category = { message: '请选择有效的书籍分类' };
        } else {
            payload.category = values.category;
        }
        if (typeof payload.coverImage === 'string' && !isBookCoverUrl(payload.coverImage)) {
            errors.coverImage = { message: '封面必须使用 /assets/books/ 下的图片或 HTTPS 图片地址' };
        }
        for (const field of ['comingSoon', 'published']) {
            const value = values[field] ?? false;
            if (![true, false, 'true', 'false'].includes(value)) {
                errors[field] = { message: '请输入有效的开关值' };
            } else {
                payload[field] = value === true || value === 'true';
            }
        }
        const sortOrder = values.sortOrder ?? 0;
        if (
            (typeof sortOrder !== 'string' && typeof sortOrder !== 'number') ||
            String(sortOrder).trim() === '' ||
            !Number.isInteger(Number(sortOrder)) ||
            Number(sortOrder) < 0 ||
            Number(sortOrder) > 1000000
        ) {
            errors.sortOrder = { message: '排序必须为 0 到 1000000 之间的整数' };
        } else {
            payload.sortOrder = Number(sortOrder);
        }
        if (Object.keys(errors).length) {
            context.record = context.resource.build(values);
            throw new ValidationError(errors);
        }
        return { ...request, payload };
    };

    const addStats = async <T extends ActionResponse>(response: T): Promise<T> => {
        const records: RecordJSON[] = response.records || (response.record ? [response.record] : []);
        const ids: string[] = records.map((record) => record.params.id).filter(Boolean);
        if (!ids.length) return response;
        const where = { bookId: { in: ids } };
        const [total, today, week, favorites] = await Promise.all([
            prisma.bookClick.groupBy({ by: ['bookId'], where, _count: { _all: true } }),
            prisma.bookClick.groupBy({
                by: ['bookId'],
                where: { ...where, createdAt: { gte: shanghaiDayStart() } },
                _count: { _all: true }
            }),
            prisma.bookClick.groupBy({
                by: ['bookId'],
                where: { ...where, createdAt: { gte: shanghaiDayStart(6) } },
                _count: { _all: true }
            }),
            prisma.bookFavorite.groupBy({ by: ['bookId'], where, _count: { _all: true } })
        ]);
        const counts = [total, today, week, favorites].map(
            (groups) => new Map(groups.map((group) => [group.bookId, group._count._all]))
        );
        for (const record of records) {
            const id = record.params.id;
            Object.assign(record.params, {
                clickCount: counts[0].get(id) || 0,
                todayClicks: counts[1].get(id) || 0,
                weekClicks: counts[2].get(id) || 0,
                favoriteCount: counts[3].get(id) || 0
            });
        }
        return response;
    };

    const softDelete = async (request: ActionRequest, _response: unknown, context: ActionContext) => {
        const records = context.records || (context.record ? [context.record] : []);
        if (!records.length) throw new ValidationError({}, { message: '请选择要删除的书籍', type: 'notFound' });
        if (request.method === 'get') {
            return context.records
                ? { records: records.map((record) => record.toJSON(context.currentAdmin)) }
                : { record: records[0].toJSON(context.currentAdmin) };
        }
        await prisma.book.updateMany({
            where: { id: { in: records.map((record) => record.id()) }, deletedAt: null },
            data: { deletedAt: new Date(), published: false }
        });
        return {
            ...(context.records
                ? { records: records.map((record) => record.toJSON(context.currentAdmin)) }
                : { record: records[0].toJSON(context.currentAdmin) }),
            redirectUrl: context.h.resourceUrl({ resourceId: context.resource.id() }),
            notice: { message: '书籍已删除，历史点击与收藏记录已保留', type: 'success' as const }
        };
    };

    const countProperty: PropertyOptions = {
        type: 'number',
        isSortable: false,
        isVisible: { list: true, show: true, edit: false, filter: false }
    };
    return {
        navigation: { name: '书籍管理', icon: 'BookOpen' },
        titleProperty: 'title',
        sort: { sortBy: 'sortOrder', direction: 'asc' },
        listProperties: [
            'title',
            'category',
            'published',
            'comingSoon',
            'sortOrder',
            'clickCount',
            'todayClicks',
            'weekClicks',
            'favoriteCount',
            'deletedAt'
        ],
        editProperties: editableFields,
        showProperties: [
            'id',
            ...editableFields,
            'clickCount',
            'todayClicks',
            'weekClicks',
            'favoriteCount',
            'createdAt',
            'updatedAt',
            'deletedAt'
        ],
        filterProperties: ['id', 'title', 'author', 'category', 'published', 'comingSoon', 'createdAt', 'deletedAt'],
        properties: {
            id: { isVisible: { list: false, show: true, edit: false, filter: true } },
            category: {
                availableValues: BOOK_CATEGORIES.map((value, index) => ({ value, label: categoryLabels[index] }))
            },
            description: { type: 'textarea' },
            reason: { type: 'textarea' },
            coverImage: {
                description:
                    '使用服务器 /assets/books/ 路径或可访问的 HTTPS 图片地址；远程原地址图片变化后需重新保存书籍以更新缓存，建议更换图片地址'
            },
            sortOrder: { description: '数字越小越靠前' },
            published: { description: '开启后小程序显示；关闭后从目录和书架隐藏' },
            clickCount: countProperty,
            todayClicks: countProperty,
            weekClicks: countProperty,
            favoriteCount: countProperty
        },
        actions: {
            new: { before: validate, after: addStats },
            edit: { before: validate, after: addStats, isAccessible: ({ record }) => !record?.params.deletedAt },
            show: { after: addStats },
            list: { after: addStats },
            delete: { handler: softDelete, guard: '删除后将下架并保留历史互动，确认删除？' },
            bulkDelete: { handler: softDelete, guard: '确认删除所选书籍并保留历史互动？' }
        }
    };
}

export const bookInteractionOptions: Record<'BookClick' | 'BookFavorite', ResourceOptions> = {
    BookClick: {
        navigation: { name: '书籍管理', icon: 'MousePointer' },
        sort: { sortBy: 'createdAt', direction: 'desc' },
        listProperties: ['book', 'user', 'source', 'createdAt'],
        showProperties: ['id', 'book', 'user', 'source', 'requestId', 'createdAt'],
        filterProperties: ['book', 'user', 'source', 'createdAt'],
        properties: {
            source: {
                availableValues: [
                    { value: 'catalog', label: '书籍目录' },
                    { value: 'shelf', label: '我的书架' },
                    { value: 'recommendation', label: '解析推荐' }
                ]
            }
        }
    },
    BookFavorite: {
        navigation: { name: '书籍管理', icon: 'Bookmark' },
        sort: { sortBy: 'createdAt', direction: 'desc' },
        listProperties: ['book', 'user', 'createdAt'],
        showProperties: ['id', 'book', 'user', 'createdAt'],
        filterProperties: ['book', 'user', 'createdAt']
    }
};
