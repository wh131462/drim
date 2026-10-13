import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { strict as assert } from 'assert';
import { randomInt } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '@/prisma/prisma.service';

interface Interpretation {
    keyword: string;
    reading: string;
    past: string;
    present: string;
    future: string;
}

interface TarotCard {
    id: number;
    name: string;
    number: string;
    arcana: 'major' | 'minor';
    suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
    rank: number;
    image: string;
    upright: Interpretation;
    reversed: Interpretation;
}

type Position = 'today' | 'past' | 'present' | 'future';

function loadDeck(): TarotCard[] {
    const deck: TarotCard[] = JSON.parse(readFileSync(join(__dirname, 'deck.json'), 'utf8'));
    assert.equal(deck.length, 78, '塔罗牌组必须包含 78 张牌');
    assert.equal(new Set(deck.map((card) => card.id)).size, 78, '塔罗牌 ID 不可重复');
    assert.equal(new Set(deck.map((card) => card.name)).size, 78, '塔罗牌名称不可重复');
    for (const [index, card] of deck.entries()) {
        assert.equal(card.id, index, '塔罗牌 ID 必须按 0–77 排列');
        assert.ok(card.name && card.number && Number.isInteger(card.rank), '塔罗牌信息不完整');
        assert.equal(card.arcana, index < 22 ? 'major' : 'minor', '大小阿卡纳分类错误');
        assert.equal(card.image, `/assets/tarot/${index}.jpg`, '塔罗卡面地址错误');
        assert.ok(existsSync(join(__dirname, '../../../public/tarot', `${index}.jpg`)), `缺少第 ${index} 张卡面`);
        for (const meaning of [card.upright, card.reversed]) {
            for (const field of ['keyword', 'reading', 'past', 'present', 'future'] as const) {
                assert.ok(typeof meaning?.[field] === 'string' && meaning[field].trim(), `第 ${index} 张牌缺少解读`);
            }
        }
    }
    assert.equal(deck.filter((card) => card.suit === 'major').length, 22);
    for (const suit of ['wands', 'cups', 'swords', 'pentacles']) {
        const ranks = deck.filter((card) => card.suit === suit && card.arcana === 'minor').map((card) => card.rank);
        assert.deepEqual(
            ranks.sort((left, right) => left - right),
            Array.from({ length: 14 }, (_, index) => index + 1),
            `${suit} 必须包含王牌至国王`
        );
    }
    return deck;
}

@Injectable()
export class TarotService {
    private readonly deck = loadDeck();

    constructor(private readonly prisma: PrismaService) {}

    private dateInShanghai(): string {
        // 日牌以产品所在时区换日，不受服务器或设备时区影响。
        return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    private describe(cardId: number, reversed: boolean, position: Position) {
        const card = this.deck[cardId];
        const meaning = reversed ? card.reversed : card.upright;
        return {
            id: card.id,
            name: card.name,
            number: card.number,
            arcana: card.arcana,
            suit: card.suit,
            rank: card.rank,
            image: card.image,
            reversed,
            position,
            keyword: meaning.keyword,
            reading: meaning.reading,
            positionReading: position === 'today' ? meaning.present : meaning[position]
        };
    }

    async daily(userId: string) {
        const date = this.dateInShanghai();
        const where = { userId_date: { userId, date } };
        let draw = await this.prisma.tarotDaily.findUnique({ where });
        if (!draw) {
            try {
                draw = await this.prisma.tarotDaily.create({
                    data: { userId, date, cardId: randomInt(this.deck.length), reversed: randomInt(2) === 1 }
                });
            } catch (error) {
                // 多设备同时首次抽牌时，由唯一约束选定同一份结果。
                if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
                draw = await this.prisma.tarotDaily.findUniqueOrThrow({ where });
            }
        }
        assert.ok(Number.isInteger(draw.cardId) && draw.cardId >= 0 && draw.cardId < this.deck.length, '日牌记录无效');
        return { date, cards: [this.describe(draw.cardId, draw.reversed, 'today')] };
    }

    spread() {
        const ids = this.deck.map((card) => card.id);
        const positions: Position[] = ['past', 'present', 'future'];
        // Fisher–Yates 部分洗牌；crypto.randomInt 无取模偏差，三张不放回。
        for (let index = 0; index < positions.length; index++) {
            const selected = randomInt(index, ids.length);
            [ids[index], ids[selected]] = [ids[selected], ids[index]];
        }
        const cards = positions.map((position, index) => this.describe(ids[index], randomInt(2) === 1, position));
        assert.equal(new Set(cards.map((card) => card.id)).size, 3, '三牌阵不可重复');
        return { date: this.dateInShanghai(), cards };
    }
}
