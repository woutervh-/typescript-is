export function sliceSet<T>(set: Set<T>): T[] {
    const items: T[] = [];
    set.forEach((value) => items.push(value));
    return items;
}

export function setIntersection<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set(sliceSet(set1).filter((x) => set2.has(x)));
}

export function setUnion<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...sliceSet(set1), ...sliceSet(set2)]);
}

export function sliceMapValues<T, U>(map: Map<T, U>): U[] {
    const items: U[] = [];
    map.forEach((value) => items.push(value));
    return items;
}
