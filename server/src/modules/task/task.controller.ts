import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { TaskHistoryQueryDto } from './dto/task-history-query.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/user.decorator';

@ApiTags('任务')
@Controller('task')
@ApiBearerAuth()
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Get('today')
    @ApiOperation({ summary: '获取今日任务' })
    async getTodayTask(@CurrentUser() user: JwtPayload) {
        return this.taskService.getTodayTask(user.userId);
    }

    @Post(':id/complete')
    @ApiOperation({ summary: '完成任务' })
    async completeTask(@CurrentUser() user: JwtPayload, @Param('id') taskId: string, @Body() dto: CompleteTaskDto) {
        return this.taskService.completeTask(user.userId, taskId, dto);
    }

    @Post(':id/double')
    @ApiOperation({ summary: '看广告翻倍奖励' })
    async doubleReward(@CurrentUser() user: JwtPayload, @Param('id') taskId: string, @Body() dto: { adToken: string }) {
        return this.taskService.doubleReward(user.userId, taskId, dto.adToken);
    }

    @Get('history')
    @ApiOperation({ summary: '获取任务历史' })
    async getHistory(@CurrentUser() user: JwtPayload, @Query() query: TaskHistoryQueryDto) {
        return this.taskService.getHistory(user.userId, query);
    }
}
