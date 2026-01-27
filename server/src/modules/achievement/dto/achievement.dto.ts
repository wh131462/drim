import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AchievementDto {
    @ApiProperty({ description: '成就ID' })
    id: string;

    @ApiProperty({ description: '成就名称' })
    name: string;

    @ApiProperty({ description: '成就描述' })
    description: string;

    @ApiProperty({ description: '成就图标' })
    icon: string;

    @ApiProperty({ description: '条件类型' })
    conditionType: string;

    @ApiProperty({ description: '条件值' })
    conditionValue: number;

    @ApiProperty({ description: '奖励积分' })
    rewardPoints: number;

    @ApiProperty({ description: '是否已解锁' })
    unlocked: boolean;

    @ApiPropertyOptional({ description: '解锁时间' })
    unlockedAt?: string;

    @ApiPropertyOptional({ description: '当前进度' })
    progress?: number;

    @ApiPropertyOptional({ description: '进度百分比' })
    progressPercent?: number;
}

export class UserAchievementProgressDto {
    @ApiProperty({ description: '当前等级' })
    level: number;

    @ApiProperty({ description: '等级名称' })
    levelTitle: string;

    @ApiProperty({ description: '当前经验' })
    currentExp: number;

    @ApiProperty({ description: '下一等级所需经验' })
    nextLevelExp: number;

    @ApiProperty({ description: '已解锁成就数' })
    unlockedCount: number;

    @ApiProperty({ description: '总成就数' })
    totalCount: number;

    @ApiProperty({ description: '成就列表' })
    achievements: AchievementDto[];
}
