import { Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { TarotService } from './tarot.service';

@ApiTags('塔罗')
@ApiBearerAuth()
@Controller('tarot')
export class TarotController {
    constructor(private readonly tarotService: TarotService) {}

    @Post('daily')
    @ApiOperation({ summary: '抽取或恢复今日一牌（北京时间换日）' })
    daily(@CurrentUser('userId') userId: string) {
        return this.tarotService.daily(userId);
    }

    @Post('spread')
    @ApiOperation({ summary: '随机抽取不重复的过去、当下、方向三牌阵' })
    spread() {
        return this.tarotService.spread();
    }
}
