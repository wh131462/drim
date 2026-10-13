import { getPageHeadingMetrics } from './navigation';

describe('page heading alignment', () => {
    const capsule = jest.fn();

    beforeEach(() => {
        Object.assign(globalThis, {
            uni: { getSystemInfoSync: () => ({ statusBarHeight: 47 }), getMenuButtonBoundingClientRect: capsule }
        });
        capsule.mockReset();
    });

    afterEach(() => Reflect.deleteProperty(globalThis, 'uni'));

    it('uses the capsule position and height on the current device', () => {
        capsule.mockReturnValue({ top: 55, height: 32 });
        expect(getPageHeadingMetrics()).toEqual({ top: 55, height: 32 });
    });

    it.each(['unavailable', 'empty'])('falls back when capsule metrics are %s', (state) => {
        capsule.mockImplementation(() => {
            if (state === 'unavailable') throw new Error('unsupported');
            return { top: 0, height: 0 };
        });
        expect(getPageHeadingMetrics()).toEqual({ top: 53, height: 32 });
    });
});
