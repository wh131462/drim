import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DreamService } from './dream.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { DreamListQueryDto } from './dto/dream-list-query.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('梦境')
@Controller('dream')
@ApiBearerAuth()
export class DreamController {
  constructor(private readonly dreamService: DreamService) {}

  @Post()
  @ApiOperation({ summary: '提交梦境' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createDto: CreateDreamDto,
  ) {
    return this.dreamService.create(user.userId, createDto);
  }

  @Get('list')
  @ApiOperation({ summary: '获取梦境列表' })
  async getList(
    @CurrentUser() user: JwtPayload,
    @Query() query: DreamListQueryDto,
  ) {
    return this.dreamService.getList(user.userId, query);
  }

  @Get('calendar')
  @ApiOperation({ summary: '获取日历数据' })
  async getCalendar(
    @CurrentUser() user: JwtPayload,
    @Query() query: CalendarQueryDto,
  ) {
    return this.dreamService.getCalendar(user.userId, query.year, query.month);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取梦境详情' })
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.dreamService.getById(user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除梦境' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.dreamService.delete(user.userId, id);
  }
}
