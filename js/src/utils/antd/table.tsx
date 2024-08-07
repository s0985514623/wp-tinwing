export const getSortProps = <T, K extends keyof T = any>(key: K) => {
    return {
        sorter: (a: T, b: T) => (a[key] as number) - (b[key] as number),
    }
}
