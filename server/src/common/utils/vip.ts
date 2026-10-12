export function isVipActive(
    user: { isVip?: boolean; vipExpireAt?: Date | string | null } | null | undefined,
    now = Date.now()
): boolean {
    const expireAt = user?.vipExpireAt;
    return (
        user?.isVip === true &&
        !!expireAt &&
        (typeof expireAt === 'string' ? Date.parse(expireAt) : expireAt.getTime()) > now
    );
}
