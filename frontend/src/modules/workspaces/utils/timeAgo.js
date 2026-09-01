export function timeAgo(isoDate) {
    const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    const units = [
        [60, 'second'],
        [60, 'minute'],
        [24, 'hour'],
        [7, 'day'],
        [4.345, 'week'],
        [12, 'month'],
        [Infinity, 'year'],
    ];
    let value = seconds;
    for (const [amount, unit] of units) {
        if (value < amount) {
            const rounded = Math.floor(value);
            if (rounded <= 0)
                return 'just now';
            return `${rounded} ${unit}${rounded === 1 ? '' : 's'} ago`;
        }
        value /= amount;
    }
    return 'a while ago';
}
