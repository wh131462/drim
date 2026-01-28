import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdRewardType {
    /** 任务双倍奖励 */
    TASK_DOUBLE = 'task_double',
    /** 看广告获取积分 */
    POINTS_GAIN = 'points_gain'
}

export class ClaimAdRewardDto {
    @ApiProperty({
        description: '广告奖励类型',
        enum: AdRewardType,
        example: AdRewardType.POINTS_GAIN
    })
    @IsNotEmpty({ message: '奖励类型不能为空' })
    @IsEnum(AdRewardType, { message: '无效的奖励类型' })
    type: AdRewardType;
}

export class AdRewardResponseDto {
    @ApiProperty({ description: '是否成功' })
    success: boolean;

    @ApiProperty({ description: '获得的积分' })
    points: number;

    @ApiProperty({ description: '当前总积分' })
    totalPoints: number;

    @ApiProperty({ description: '今日剩余广告观看次数' })
    remainingAdCount: number;
}

export class AdStatusResponseDto {
    @ApiProperty({ description: '今日已观看广告次数' })
    todayAdCount: number;

    @ApiProperty({ description: '每日广告上限' })
    dailyLimit: number;

    @ApiProperty({ description: '剩余观看次数' })
    remainingCount: number;

    @ApiProperty({ description: '是否还可以观看广告' })
    canWatch: boolean;
}
