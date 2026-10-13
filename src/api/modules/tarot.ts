import { post, getBaseUrl } from '../request';

export interface TarotDrawCard {
    id: number;
    name: string;
    number: string;
    arcana: 'major' | 'minor';
    suit: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
    rank: number;
    image: string;
    reversed: boolean;
    position: 'today' | 'past' | 'present' | 'future';
    keyword: string;
    reading: string;
    positionReading: string;
}

export interface TarotDraw {
    date: string;
    cards: TarotDrawCard[];
}

async function draw(mode: 'daily' | 'spread'): Promise<TarotDraw> {
    const result = await post<TarotDraw>(`/tarot/${mode}`, undefined, { showLoading: false, showError: false });
    const origin = getBaseUrl().match(/^https?:\/\/[^/]+/i)?.[0] || '';
    return { ...result, cards: result.cards.map((card) => ({ ...card, image: `${origin}${card.image}` })) };
}

export const tarotApi = {
    daily: () => draw('daily'),
    spread: () => draw('spread')
};
