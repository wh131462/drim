import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { BooksService } from './books.service';
import { BookClickDto, BookFavoriteDto, BookIdDto, BookRecommendationsDto, BooksQueryDto } from './dto/books.dto';

@ApiTags('书籍与书架')
@ApiBearerAuth()
@Controller('books')
export class BooksController {
    constructor(private readonly books: BooksService) {}

    @Get()
    list(@CurrentUser('userId') userId: string, @Query() query: BooksQueryDto) {
        return this.books.list(userId, query);
    }

    @Get('favorites')
    favorites(@CurrentUser('userId') userId: string) {
        return this.books.favorites(userId);
    }

    @Post('recommendations')
    recommendations(@Body() body: BookRecommendationsDto) {
        return this.books.recommendations(body.topic);
    }

    @Get(':id')
    detail(@Param() params: BookIdDto) {
        return this.books.detail(params.id);
    }

    @Put(':id/favorite')
    setFavorite(@CurrentUser('userId') userId: string, @Param() params: BookIdDto, @Body() dto: BookFavoriteDto) {
        return this.books.setFavorite(userId, params.id, dto.saved);
    }

    @Post(':id/click')
    click(@CurrentUser('userId') userId: string, @Param() params: BookIdDto, @Body() dto: BookClickDto) {
        return this.books.click(userId, params.id, dto);
    }
}
