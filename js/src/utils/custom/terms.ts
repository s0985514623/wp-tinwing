/**
 * 分類 (terms) 名稱的排序與搜尋輔助函式
 *
 * 分類名稱大多是從別處貼上再改名而來，帶著隱形字元 U+2060（如 `Loan to director`、
 * `Golf (entertainment )`），連接號也有 en dash `–` 與 hyphen `-` 混用。
 * 直接拿原始字串比對，排序與搜尋都會跳掉，所以一律先正規化再比較。
 * 另外 slug 不代表分類名稱，排序請務必以名稱為準，不要用 slug。
 */

// 零寬 / 隱形字元（含 U+2060 word joiner）
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g

// 正規化分類名稱：去掉隱形字元、連接號統一成 hyphen、收斂多餘空白
export const normalizeTermName = (name?: unknown): string =>
  String(name ?? '')
    .replace(INVISIBLE_CHARS_REGEX, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

// A-Z 排序用的比較函式
// numeric: true 讓 `Others 2` 排在 `Others 10` 前面
// sensitivity: 'base' 讓大小寫不影響排序
export const compareTermName = (a?: unknown, b?: unknown): number =>
  normalizeTermName(a).localeCompare(normalizeTermName(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })

// 下拉選單的搜尋比對（前端篩選）
// 忽略大小寫、隱形字元與連接號差異，輸入 `visa - br` 也找得到 `Visa – BR`
export const filterTermOption = (
  input: string,
  option?: { label?: unknown },
): boolean =>
  normalizeTermName(option?.label)
    .toLowerCase()
    .includes(normalizeTermName(input).toLowerCase())
