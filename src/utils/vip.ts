export function isVipActive(
    user: { isVip?: boolean; vipExpireAt?: string | null } | null | undefined,
    now = Date.now()
): boolean {
    return user?.isVip === true && !!user.vipExpireAt && Date.parse(user.vipExpireAt) > now;
}

export function normalizeVipStatus<T extends { isVip?: boolean; vipExpireAt?: string | null }>(
    user: T | null
): T | null {
    if (!user) return null;
    const isVip = isVipActive(user);
    return user.isVip === isVip ? user : { ...user, isVip };
}
