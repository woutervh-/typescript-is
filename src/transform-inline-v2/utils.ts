export function sliceSet<T>(set: Set<T>): T[] {
    const items: T[] = [];
    set.forEach((value) => items.push(value));
    return items;
}

export function sliceMapValues<T, U>(map: Map<T, U>): U[] {
    const items: U[] = [];
    map.forEach((value) => items.push(value));
    return items;
}
