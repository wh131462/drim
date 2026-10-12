(function () {
    const DREAM_KEY = 'drim-design-dream';
    const THEME_KEY = 'drim-design-theme';
    const safeRead = (storage, key) => {
        try {
            return window[storage].getItem(key);
        } catch {
            return null;
        }
    };
    const readDream = () => {
        try {
            const value = JSON.parse(safeRead('sessionStorage', DREAM_KEY) || 'null');
            if (
                !value ||
                Array.isArray(value) ||
                typeof value.content !== 'string' ||
                !value.content.trim() ||
                value.content.length > 1000
            )
                return null;
            return {
                content: value.content,
                tags: Array.isArray(value.tags)
                    ? value.tags
                          .filter((tag) => typeof tag === 'string' && tag.trim())
                          .slice(0, 3)
                          .map((tag) => tag.slice(0, 12))
                    : [],
                versions:
                    value.versions && typeof value.versions === 'object'
                        ? {
                              original:
                                  typeof value.versions.original === 'string'
                                      ? value.versions.original.slice(0, 1000)
                                      : value.content,
                              polished:
                                  typeof value.versions.polished === 'string'
                                      ? value.versions.polished.slice(0, 1000)
                                      : ''
                          }
                        : { original: value.content, polished: '' },
                activeVersion: value.activeVersion === 'polished' ? 'polished' : 'original',
                emotion: typeof value.emotion === 'string' ? value.emotion.slice(0, 20) : null,
                isPublic: value.isPublic === true,
                recordedAt:
                    typeof value.recordedAt === 'string' && !Number.isNaN(Date.parse(value.recordedAt))
                        ? value.recordedAt
                        : null
            };
        } catch {
            return null;
        }
    };
    const writeDream = (value) => {
        try {
            window.sessionStorage.setItem(DREAM_KEY, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    };
    const tagLabels = {
        running: '追逐',
        flying: '飞行',
        exam: '考试',
        family: '亲人',
        water: '水',
        animal: '动物',
        lost: '迷路',
        death: '死亡'
    };
    const emotionLabels = {
        happy: '开心',
        sad: '悲伤',
        angry: '愤怒',
        fear: '恐惧',
        surprise: '惊讶',
        disgust: '厌恶',
        calm: '平静',
        anxious: '焦虑',
        confused: '困惑',
        excited: '兴奋',
        lonely: '孤独',
        shame: '羞愧',
        love: '温暖',
        bored: '无聊'
    };
    const label = (map, value) => (Object.hasOwn(map, value) ? map[value] : value || '');
    const setTheme = (theme) => {
        document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
        try {
            window.localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme);
        } catch {}
    };
    const shanghaiDate = (value = new Date()) =>
        new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date(value));
    const sampleDream = (date) => {
        const yesterday = shanghaiDate(Date.now() - 86400000);
        const candidate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? `${date}T08:30:00+08:00` : '';
        const valid = candidate && !Number.isNaN(Date.parse(candidate)) && shanghaiDate(candidate) === date;
        const versions = {
            original: '我梦见自己在一片草地上奔跑，阳光很温暖。跑着跑着，我突然能飞起来了，感觉轻松又自由。',
            polished:
                '我梦见自己在一片草地上奔跑，阳光落在肩上。后来我慢慢飞起来，俯瞰着安静的大地，心里感到自由又轻松。'
        };
        return {
            content: versions.polished,
            tags: ['flying'],
            emotion: 'happy',
            isPublic: false,
            recordedAt: valid ? candidate : `${yesterday}T08:30:00+08:00`,
            versions,
            activeVersion: 'polished'
        };
    };
    const pageDream = (search = '') => {
        const params = new URLSearchParams(search);
        return params.get('sample') === '1' ? sampleDream(params.get('date')) : readDream();
    };
    const savedTheme = safeRead('localStorage', THEME_KEY);
    document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
    const readingFor = (dream) => {
        const topics = [
            ...(dream?.tags || []).map((tag) => label(tagLabels, tag)),
            label(emotionLabels, dream?.emotion),
            dream?.content || ''
        ].join(' ');
        if (/考试|追逐|迷路|焦虑|恐惧/.test(topics))
            return {
                category: 'emotion',
                title: '当下的力量',
                reason: '你的梦境带有压力或不安的线索，这本书提供了把注意力带回当下的阅读视角。',
                theme: '为心里的压力留一个出口',
                interpretation:
                    '可以试着回想梦中最紧张的瞬间，以及最近让你挂心的事。梦境中的压力并不预示坏事，它也可能提醒你给自己留出休息和整理思绪的空间。'
            };
        if (/亲人|家庭|争吵|温暖/.test(topics))
            return {
                category: 'relationship',
                title: '依恋',
                reason: '你的梦境涉及亲人或关系，适合继续了解亲密关系中的需要与连接方式。',
                theme: '看见关系里的连接与需要',
                interpretation:
                    '可以留意梦中人物带来的感受，想想你想念什么、希望得到怎样的理解。梦中的熟悉场景也许是近期记忆和感受的组合，适合用来展开温柔的自我观察。'
            };
        if (/飞行|水|死亡|潜意识/.test(topics))
            return {
                category: 'dream',
                title: '荣格自传：回忆·梦·思考',
                reason: '你的梦境包含飞行、水或象征线索，适合从梦与潜意识的角度继续阅读。',
                theme: '探索梦中的自由与象征',
                interpretation:
                    '梦里的空间与动作可以成为观察自己的线索。试着记下最鲜明的画面和身体感受，看看它与你最近的生活有什么关联。每个人的梦都不同，符号的意义也需要结合你的个人经验。'
            };
        return {
            category: 'all',
            title: '被讨厌的勇气',
            reason: '从自我理解与选择的角度开始阅读，给这场梦留一个继续思考的入口。',
            theme: '从这场梦开始理解自己',
            interpretation:
                '试着记录醒来时最明显的感受，以及梦里最让你在意的画面。梦境可以成为整理记忆和情绪的入口，你可以慢慢寻找它与近期生活的关联。'
        };
    };
    window.DrimDesign = {
        DREAM_KEY,
        readDream,
        writeDream,
        setTheme,
        shanghaiDate,
        sampleDream,
        pageDream,
        readingFor,
        labelTag: (value) => label(tagLabels, value),
        labelEmotion: (value) => label(emotionLabels, value)
    };
})();
