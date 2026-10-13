import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export const BOOK_CATEGORIES = ['dream', 'emotion', 'relationship', 'growth', 'personality'] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export class BooksQueryDto {
    @IsOptional()
    @IsIn(BOOK_CATEGORIES)
    category?: BookCategory;

    @IsOptional()
    @IsIn(['true', 'false'])
    saved?: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100000)
    page: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    pageSize: number = 20;
}

export class BookIdDto {
    @IsString()
    @MaxLength(191)
    @Matches(/^[a-zA-Z0-9_-]+$/)
    id: string;
}

export class BookRecommendationsDto {
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    topic?: string;
}

export class BookFavoriteDto {
    @IsBoolean()
    saved: boolean;
}

export class BookClickDto {
    @IsIn(['catalog', 'shelf', 'recommendation'])
    source: 'catalog' | 'shelf' | 'recommendation';

    @IsString()
    @MaxLength(64)
    @Matches(/^[a-zA-Z0-9_-]{8,64}$/)
    requestId: string;
}
