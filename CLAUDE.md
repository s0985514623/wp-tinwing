# CLAUDE.md — wp-tinwing 專案指南

> 給接手此專案的工程師 / AI 的操作手冊。撰寫時版本為 v1.0.83。

## 1. 這是什麼

**「天永保險系統」的 WordPress 版本** — 一套香港保險經紀 (insurance broker) 的完整業務管理系統,整套打包成單一 WordPress 外掛。

面向香港市場,可由車險欄位佐證:`ncb`(無索償折扣)、`mib`(汽車保險局徵費)、`levy`(保監局徵費)、`ls` — 見 `inc/classes/Admin/PostType/Quotations.php:148-165`。金額轉英文大寫用 `to-words`。

## 2. 架構總覽

WordPress 當後端(CPT + 自訂 REST API),React SPA 當前端。

```
plugin.php  →  Bootstrap.php  ─┬─ Admin\Entry        後台全螢幕頁面
                               ├─ Admin\CPT          12 個 CPT + metabox
                               ├─ Admin\Migration    一次性資料遷移
                               └─ Api\*.php × 14     REST 端點

js/src/main.tsx → App.tsx (Refine + AntD + HashRouter) → Routes.tsx → pages/*
```

**前端是全螢幕 SPA,不走 wp-admin 版型。** `Admin\Entry::maybe_output_admin_page()` 攔截 `current_screen`,比對到自家頁面後由 `render_page()` 印出一份完整 HTML 文件再 `exit`(`inc/classes/Admin/Entry.php:48-103`)。掛載點是 `<main id="wp_tinwing">`。

**資料流:**

```
Refine dataProvider (js/src/rest-data-provider/index.ts)
  → GET/POST /wp-json/wp-tinwing/{resource}
  → Api/*.php  →  WP_Query
```

`dataProvider` 把 Refine 的 filters / sorters / pagination 轉成 `meta_query`、`date_query`、`orderby`、`page`、`posts_per_page` 等 query string 參數。

## 3. 資料模型

### CPT 一覽

| CPT | 用途 |
| --- | --- |
| `quotations` | 報價單 |
| `debit_notes` | 收費通知(核心單據) |
| `credit_notes` | 貸項通知(退費) |
| `receipts` | 收據 / 收款紀錄 |
| `renewals` | 續保通知 |
| `clients` | 客戶 |
| `insurers` | 保險公司 |
| `insurer_products` | 保險產品 |
| `agents` | 代理人 |
| `expenses` | 支出(含 Adjust Balance,見下方陷阱 D) |
| `other_earnings` | 其他收入(年度性進帳,如年終花紅) |
| `terms` | 分類(見下方陷阱 A) |

單據流:**Quotation → Debit Note → Receipt → Renewal**;Credit Note 走退費。

### ⚠️ 陷阱 A — `terms` 是 CPT,不是 WP taxonomy

全專案沒有任何 `register_taxonomy()` 呼叫。`terms` 是一個普通 CPT,用 **`taxonomy` 這個 post meta 欄位**區分兩種分類:

- `insurance_class` — 保險類別
- `expense_class` — 支出類別

宣告見 `inc/classes/Admin/PostType/Terms.php:21-28`;前端由路由以 prop 傳入(`js/src/Routes.tsx` 的 `<TermList taxonomy="insurance_class" />`),頁面元件在 `js/src/pages/terms/`。查詢時是對 post meta 下 `meta_query`,不是 `tax_query`。

### ⚠️ 陷阱 B — CPT 在正式站的後台是隱形的

`show_in_menu` 與 `show_ui` 都綁在 `\WP_DEBUG` 上(`inc/classes/Admin/CPT.php:151-152`)。正式環境看不到 CPT 選單是**預期行為**,所有操作都走 React 介面。要用原生 WP 後台除錯時需開 `WP_DEBUG`。

### ⚠️ 陷阱 C — 三種單據共用同一份 meta schema

`quotations`、`debit_notes`、`credit_notes` 都指向 `PostType\Quotations::get_meta()`(`inc/classes/Admin/CPT.php:55-67`)。**改動任何一個欄位會同時影響這三種單據。**

### ⚠️ 陷阱 D — 系統裡有兩個都叫「Other Earning」的東西

彼此**完全無關**,機制也不同:

| 名稱 | 機制 | 用途 |
| --- | --- | --- |
| Other Earning **模組** | 獨立 CPT `other_earnings` | 手動輸入的年度性進帳(如年終花紅),分銀行戶口 |
| Other Earning **– Rebate** | `expense_class` 分類,`post_name` 為 `other-earning-rebate` | P&L 報表的回佣科目,由 `OtherReport.php::calculate_other_earning_total()` 統計 |

`other_earnings` 刻意做成獨立 CPT 而不是像 `adjust_balance` 那樣在 `expenses` 上加旗標,就是為了讓它**不可能**被既有的支出統計誤算。因此 Expenses 列表 / Expense Summary / Dashboard Expenses / P&L 的 Admin Expenses 都不需要、也不應該加排除條件。

對照:`adjust_balance` 走的是旗標路線 —— 重用 `expenses` 的 CPT 與頁面元件,靠 `is_adjust_balance` post meta 區分。代價是每一處統計 expenses 的地方都得記得排除它(目前有 9 處)。**新增同類模組時優先選獨立 CPT。**

`Expense/Record` 的三個頁面元件同時服務 expenses / adjust_balance / other_earnings,靠 `is_adjust_balance` 與 `is_other_earning` 兩個 prop 分流,元件內以 `isSimpleForm` 統一判斷要不要隱藏 Category / Cheque No. / 批次編輯。

## 4. Schema-driven 的 post meta 機制(最重要的慣例)

欄位定義集中宣告一次,由三個地方消費。

**宣告位置:** `inc/classes/Admin/PostType/*.php`。每個欄位是一個陣列:

```php
'premium' => [
    'display_function'  => 'render_meta_box',   // 用哪個 metabox 渲染器
    'input_type'        => 'number',            // HTML input type
    'meta_type'         => 'number',            // API 回傳型別
    'sanitize_callback' => 'absint',
],
```

**消費端 1 — metabox 渲染與存檔** (`inc/classes/Admin/CPT.php`)
依 `display_function` 分派到:`render_meta_box`、`render_meta_checkbox`、`render_meta_box_json`(巢狀物件,如 `motor_attr`)、`render_meta_box_json_extra_field`(`extra_field` / `extra_field2` 的 name-value 對)。存檔由 `save_metabox()` 統一處理。

**消費端 2 — API 回傳型別轉換** (`inc/classes/Api/*.php`)
依 `meta_type` 轉型:`integer` → `intval()`、`boolean` → `filter_var(..., FILTER_VALIDATE_BOOLEAN)`、`object` → `maybe_unserialize()`、其餘原樣。範例見 `inc/classes/Api/DebitNotes.php:150-164`。

**消費端 3 — 前端 Zod schema** (`js/src/pages/*/types/index.ts`)
**這份是手動同步的,不會自動產生。** 新增欄位若忘了更新 Zod schema,資料會被靜默丟棄而不報錯。

> **新增一個欄位的完整清單:** PostType 的 meta 陣列 → 前端 Zod schema → 對應的 Edit/Show 元件。

## 5. REST API 慣例

- 使用 `j7-dev/wp-utils` 的 `ApiRegisterTrait`,namespace 為 `wp-tinwing`,完整路徑 `/wp-json/wp-tinwing/{endpoint}`。
- **命名慣例:** `get_apis()` 宣告端點清單,方法名自動對應 `get_{endpoint}_callback` / `post_{endpoint}_callback` / `delete_{endpoint}_callback`。新增端點要同時改兩處(宣告 + 對應方法)。
- **共用查詢工具 — 新寫 API 時請重用,不要自己重寫:**
  - `Utils\Base::sanitize_meta_query()` (`inc/classes/Utils/Base.php:26`) — 剔除沒有 `value` 的條件,遞迴處理 `relation` 群組,並清掉空群組。
  - `Utils\Base::sanitize_post_meta_array()` (`inc/classes/Utils/Base.php:55`) — 把 `get_post_meta($id, '', true)` 回傳的巢狀陣列攤平成純值。
- **分頁** 透過 `X-WP-Total` response header 回傳總數,前端 `getList` 讀取。

## 6. 功能模組地圖

選單(Refine resources)定義在 `js/src/resources/*.tsx`,路由在 `js/src/Routes.tsx`。

| 模組 | 路由 | 頁面元件 | 後端 |
| --- | --- | --- | --- |
| Clients Summary | `/clientsSummary` | `pages/clientsSummary/` | `Api/ClientsSummary.php` |
| 報價 / 單據 | `/quotations` `/debitNotes` `/creditNotes` `/receipts` `/renewals` | `pages/{name}/` | `Api/{Name}.php` |
| 主檔 | `/clients` `/insurers` `/insurer-products` `/agents` | 同上 | 同上 |
| 分類 | `/terms/insurance_class` `/terms/expense_class` | `pages/terms/` | `Api/Terms.php` |
| 封存檢視 | `/archived_*` | 重用各自的 `ListView` | 同上 |
| 會計 | `/dashboard` `/income` `/otherEarning` `/insurerPayment/*` `/otherExpenses/*` `/adjust_balance` | `pages/accounting/` | `Api/Receipts.php`、`Api/Expenses.php`、`Api/OtherEarnings.php` |
| 報表 | `/reports/*` | `pages/reports/` | `Api/OtherReport.php` |

### 會計模組
選單結構定義在 `js/src/resources/accounting.tsx`:Dashboard(圖表)、Income、Other Earning、Insurer Payment(Record / Summary)、Expenses(Record / Summary / Category)、Adjust Balance。

`adjust_balance` 與 `other_earning` 都重用 `pages/accounting/Expense/Record/` 的頁面元件,但資料來源不同 —— 前者是 `expenses` CPT 加旗標,後者是獨立的 `other_earnings` CPT。詳見陷阱 D。

Dashboard(`pages/accounting/dashboard/ListView.tsx`)的 Other Earning 會出現在三個位置:Income 區塊的總額卡片、Income 的各銀行金額、Profit 的各銀行金額。

### 報表模組
`inc/classes/Api/OtherReport.php`(3,281 行)提供 7 個端點:

- `client_ageing_report` — 客戶帳齡分析
- `insurer_ageing_report` — 保險公司帳齡分析
- `report_by_agent`
- `report_by_principal_and_class`
- `profit_and_loss_analysis` — 損益表
- `trial_balance` — 試算表
- `balance_sheet` — 資產負債表

Excel 匯出走 `exceljs`,共用 hook 在 `js/src/hooks/useExcelExport.tsx` 與 `useSiderReportExport.tsx`。

### Debit Note 的 5 種模板
`general` / `motor` / `shortTerms` / `package` / `marineInsurance`,定義在 `js/src/pages/debitNotes/types/index.ts` 的 `templates` 陣列與 `ZTemplates` enum。每種模板各有一組 `EditTemplate*` 與 `ShowTemplate*` 元件(`js/src/pages/debitNotes/components/`)。列印用 `react-to-print`,進入點在各資源的 `ShowView.tsx`。

> **新增模板要同時動:** `templates` 陣列 + `ZTemplates` enum + `EditTemplate*` + `ShowTemplate*` 兩組元件。

⚠️ **模板的計算慣例是「motor 特殊,其餘一律比照 general」** —— `getTotalPremiumByDebitNote` 用 `default:` 落到 general,`ShowView` 對 `marineInsurance` 渲染 `<ShowMetaGeneral />`。`utils/custom/functions.ts` 的 `getInsurerPayment` 曾經改用白名單(只認 general / shortTerms / package),導致 `marineInsurance` 掉進 `return 0`,海運保險的 Payment to Insurer 全部顯示 0。**寫模板分支時用 default 收尾,不要用白名單。**

## 7. 開發與發佈

```bash
yarn bootstrap   # yarn install && composer install
yarn dev         # Vite dev server
yarn build       # 建置到 js/dist,並跑 release/mv-manifest.cjs
yarn lint        # eslint + phpcbf
yarn release     # release-it,自動同步 package.json 與 plugin.php 版本號
yarn zip         # 打包
```

資產載入走 `@kucrut/vite-for-wp`(`vite.config.ts` 的 `v4wp`)。`Bootstrap::enqueue_script()` 以 `wp_localize_script` 注入兩包資料:

- `wp_tinwing_data.env` — siteUrl、ajaxUrl、userId、nonce、各種常數
- `wpApiSettings` — REST root 與 `wp_rest` nonce

前端統一由 `js/src/utils/env.tsx` 讀取這些值。

PHP 品質工具:`phpcs.xml`、`phpmd.xml`、`phpstan.neon`。

## 8. 已知技術債(現況記錄,非待辦清單)

- **REST 端點沒有權限控管。** 所有 `get_apis()` 的 `permission_callback` 都是 `__return_true`,並附 `// TODO 應該是特定會員才能看`。前端 `Routes.tsx` 的 `<Authenticated>` 守衛整段被註解掉。實際唯一防線是 wp-admin 頁面本身的 `manage_options`,**API 端點本身對外全開**。
- **每個請求都 flush rewrite rules。** `inc/classes/Admin/CPT.php:100` 在 `init` hook 內無條件呼叫 `flush_rewrite_rules()`;另外 `custom_post_type_rewrite_rules()` 也呼叫了 `$wp_rewrite->flush_rules()`。
- **Supabase 遺留物。** 系統是從 Supabase 遷移過來的,`@refinedev/supabase`、`js/src/utils/supabaseClient.ts`、`js/src/main_old.tsx` 是殘留,現行程式碼未使用。
- **`Admin\Migration`** 是一次性的 `receipt_id` 回填,以 `wp_tinwing_migration_receipt_id_executed` option 當執行旗標,搭配 `Admin\MigrationAdmin` 提供管理介面。
