// 排序時視為「無值」的情況:null / undefined / 空字串 / NaN
// 0 不算無值,Expense 的 amount 可以合法為 0
const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (typeof value === 'number' && Number.isNaN(value))

const isNumeric = (value: unknown): boolean =>
  typeof value === 'number' ||
  (typeof value === 'string' &&
    value.trim() !== '' &&
    !Number.isNaN(Number(value)))

export const getSortProps = <T, K extends keyof T = any>(key: K) => {
  return {
    sorter: (a: T, b: T) => {
      const aValue = a?.[key]
      const bValue = b?.[key]

      // 無值一律推到升冪的最後,降冪時 antd 會自動反轉
      if (isEmpty(aValue) && isEmpty(bValue)) return 0
      if (isEmpty(aValue)) return 1
      if (isEmpty(bValue)) return -1

      // meta_type 為 number 的欄位(如 amount)API 回傳的是字串,一律用數值比較
      if (isNumeric(aValue) && isNumeric(bValue)) {
        return Number(aValue) - Number(bValue)
      }

      return String(aValue).localeCompare(String(bValue), undefined, {
        numeric: true,
      })
    },
  }
}
