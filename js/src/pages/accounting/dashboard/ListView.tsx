import { useState } from 'react'
import { CrudFilters, useList, useExport } from '@refinedev/core'
import Filter from './Filter'
import { ExportButton } from '@refinedev/antd'
import dayjs, { Dayjs } from 'dayjs'
import { Spin, Empty } from 'antd'
import { DataType as TReceipts } from 'pages/receipts/types'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import { DataType as TQuotations } from 'pages/quotations/types'
import { DataType as TExpenses } from 'pages/accounting/Expense/types'
import { DataType as TInsurers } from 'pages/insurers/types'
import { DataType as TRenewals } from '@/pages/renewals/types'
import { getTotalPremiumByDebitNote, getInsurerPayment } from 'utils'
import IncomeByBank from './IncomeByBank'
import LineGrid from './LineGrid'
import { useFormatLineGridData } from 'hooks/useFormatLineGridData'
import _ from 'lodash-es'
import NoDisplay from './NoDisplay'

type DataType = TReceipts | TDebitNote | TQuotations
export const ListView: React.FC = () => {
  //統一時間範圍
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().add(-30, 'd'),
    dayjs(),
  ])
  const filters = dateRange
    ? [
        {
          field: 'meta_query[relation]',
          operator: 'eq',
          value: 'AND',
        },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[0][value][0]',
          operator: 'eq',
          value: dateRange[0]?.unix(),
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: dateRange[1]?.unix(),
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: 'BETWEEN',
        },
      ]
    : []

  //Export CSV
  const { triggerExport: _Export, isLoading: _exportLoading } =
    useExport<DataType>({
      mapData: (item) => {
        return {
          ...item,
          // date: dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
          // payment_date: dayjs.unix(item?.payment_date as number).format('YYYY-MM-DD'),
        }
      },
    })

  //取得資料
  const { data: debitNotesData, isLoading: debitNotesIsLoading } =
    useList<TDebitNote>({
      resource: 'debit_notes',
      filters: filters as CrudFilters,
    })
  const { data: quotationsData, isLoading: quotationsIsLoading } =
    useList<TQuotations>({
      resource: 'quotations',
      filters: filters as CrudFilters,
    })
  const { data: renewalsData, isLoading: renewalsIsLoading } =
    useList<TRenewals>({
      resource: 'renewals',
      filters: filters as CrudFilters,
    })
  const { data: receiptsData, isLoading: receiptsIsLoading } =
    useList<TReceipts>({
      resource: 'receipts',
      filters: filters as CrudFilters,
    })
  const { data: InsurerPaymentData, isLoading: InsurerPaymentIsLoading } =
    useList<TReceipts>({
      resource: 'receipts',
      filters: dateRange
        ? [
            {
              field: 'meta_query[relation]',
              operator: 'eq',
              value: 'AND',
            },
            {
              field: 'meta_query[0][key]',
              operator: 'eq',
              value: 'pay_to_insurer_by_payment_date',
            },
            {
              field: 'meta_query[0][value][0]',
              operator: 'eq',
              value: dateRange[0]?.unix(),
            },
            {
              field: 'meta_query[0][value][1]',
              operator: 'eq',
              value: dateRange[1]?.unix(),
            },
            {
              field: 'meta_query[0][compare]',
              operator: 'eq',
              value: 'BETWEEN',
            },
            {
              field: 'meta_query[1][key]',
              operator: 'eq',
              value: 'is_paid',
            },
            {
              field: 'meta_query[1][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[1][compare]',
              operator: 'eq',
              value: '=',
            },
          ]
        : [
            {
              field: 'meta_query[0][key]',
              operator: 'eq',
              value: 'is_paid',
            },
            {
              field: 'meta_query[0][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[0][compare]',
              operator: 'eq',
              value: '=',
            },
          ],
    })
  const { data: creditNotesData, isLoading: creditNotesIsLoading } =
    useList<TDebitNote>({
      resource: 'credit_notes',
      filters: filters as CrudFilters,
    })

  //一般expenses 費用
  const { data: expensesData, isLoading: expensesIsLoading } =
    useList<TExpenses>({
      resource: 'expenses',
      filters: dateRange
        ? [
            {
              field: 'meta_query[0][key]',
              operator: 'eq',
              value: 'date',
            },
            {
              field: 'meta_query[0][value][0]',
              operator: 'eq',
              value: dateRange[0]?.unix(),
            },
            {
              field: 'meta_query[0][value][1]',
              operator: 'eq',
              value: dateRange[1]?.unix(),
            },
            {
              field: 'meta_query[0][compare]',
              operator: 'eq',
              value: 'BETWEEN',
            },
            {
              field: 'meta_query[1][key]',
              operator: 'eq',
              value: 'is_adjust_balance',
            },
            {
              field: 'meta_query[1][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[1][compare]',
              operator: 'eq',
              value: '!=',
            },
          ]
        : [
            {
              field: 'meta_query[1][key]',
              operator: 'eq',
              value: 'is_adjust_balance',
            },
            {
              field: 'meta_query[1][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[1][compare]',
              operator: 'eq',
              value: '!=',
            },
          ],
    })
  //Adjust balances 費用
  const { data: adjustBalancesData, isLoading: adjustBalancesIsLoading } =
    useList<TExpenses>({
      resource: 'expenses',
      filters: dateRange
        ? [
            {
              field: 'meta_query[0][key]',
              operator: 'eq',
              value: 'date',
            },
            {
              field: 'meta_query[0][value][0]',
              operator: 'eq',
              value: dateRange[0]?.unix(),
            },
            {
              field: 'meta_query[0][value][1]',
              operator: 'eq',
              value: dateRange[1]?.unix(),
            },
            {
              field: 'meta_query[0][compare]',
              operator: 'eq',
              value: 'BETWEEN',
            },

            {
              field: 'meta_query[1][key]',
              operator: 'eq',
              value: 'is_adjust_balance',
            },
            {
              field: 'meta_query[1][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[1][compare]',
              operator: 'eq',
              value: '=',
            },
          ]
        : [
            {
              field: 'meta_query[1][key]',
              operator: 'eq',
              value: 'is_adjust_balance',
            },
            {
              field: 'meta_query[1][value]',
              operator: 'eq',
              value: 1,
            },
            {
              field: 'meta_query[1][compare]',
              operator: 'eq',
              value: '=',
            },
          ],
    })
  const { data: insurersData, isLoading: insurersIsLoading } =
    useList<TInsurers>({
      resource: 'insurers',
    })

  //123.各種數量
  const debitNotesNo = debitNotesData?.total
  const quotationsNo = quotationsData?.total
  const receiptsNo = receiptsData?.total
  const creditNotesNo = creditNotesData?.total
  const renewalsNo = renewalsData?.total
  const noDisplayData = [
    { noBy: 'No of Quotation', value: quotationsNo },
    { noBy: 'No of Debit Notes', value: debitNotesNo },
    { noBy: 'No of Receipt', value: receiptsNo },
    { noBy: 'No of Renewal', value: renewalsNo },
  ]
  //4.receipt amount[收入](total premium)
  const formatTotalIncome = useFormatLineGridData({
    data: receiptsData?.data as TReceipts[],
    type: 'totalIncome',
    debitNotesData: debitNotesData?.data,
  })

  //4-2. 計算 Receipt 收入，分銀行來紀錄
  const receiptsByBankToIncome =
    receiptsData?.data.reduce(
      (acc, receipt) => {
        const bank = receipt?.payment_receiver_account
        if (!bank) return acc
        //如果是creditNote就不計算
        const ifCreditNote = receipt?.created_from_credit_note_id
        if (ifCreditNote) return acc
        const premium = receipt?.premium
          ? Number(receipt?.premium)
          : getTotalPremiumByDebitNote(
              (
                debitNotesData?.data?.filter(
                  (debitNote) => debitNote?.id === receipt?.debit_note_id,
                ) as TDebitNote[]
              )[0] ?? 0,
            )
        const existingBank = acc.find((item) => item.bank === bank)
        if (existingBank) {
          existingBank.income += premium
        } else {
          acc.push({ bank, income: premium })
        }
        return acc
      },
      [] as { bank: string; income: number }[],
    ) || []

  /*4-3. Bank Balance 計算
	receipt能計算的只有Receipt Amount(premium)跟 Insurer Payment 跟Credit Note Amount
	Adjust Balance & Expenses 要另外計算
	*/
  const bankBalance =
    receiptsData?.data.reduce(
      (acc, receipt) => {
        const bank = receipt?.payment_receiver_account
        const payToBank = receipt?.pay_to_insurer_by_bank
        const isPaid = receipt?.is_paid
        if (!bank) return acc
        if (!isPaid) return acc
        const debitNote = debitNotesData?.data.find(
          (dn: TDebitNote) => dn.id === receipt.debit_note_id,
        )
        const renewal = renewalsData?.data.find(
          (r: TRenewals) => r.id === receipt.created_from_renewal_id,
        )
        const insurer = insurersData?.data?.find((insurer) => {
          if (renewal) {
            return insurer.id === renewal.insurer_id
          } else {
            return insurer.id === debitNote?.insurer_id
          }
        })
        const insurerPayment = insurer
          ? getInsurerPayment(
              receipt,
              renewal ?? (debitNote as TDebitNote),
              insurer as TInsurers,
            )
          : 0
        const premium = receipt?.premium
          ? Number(receipt?.premium)
          : getTotalPremiumByDebitNote(
              (
                debitNotesData?.data?.filter(
                  (debitNote) => debitNote?.id === receipt?.debit_note_id,
                ) as TDebitNote[]
              )[0] ?? 0,
            )
        // const total = premium - insurerPayment
        const existingBank = acc.find((item) => item.bank === bank)
        const existingPayToBank = acc.find((item) => item.bank === payToBank)
        if (existingBank) {
          existingBank.income += premium
        } else {
          acc.push({ bank, income: premium })
        }
        if (existingPayToBank && isPaid) {
          existingPayToBank.income -= insurerPayment
        }
        return acc
      },
      [] as { bank: string; income: number }[],
    ) || []
  // console.log('🚀 ~ bankBalance:', bankBalance)
  //計算Adjust Balances
  adjustBalancesData?.data.map((adjustBalance) => {
    const bank = adjustBalance?.payment_receiver_account
    if (!bank) return
    const amount = adjustBalance?.amount
    const existingBank = bankBalance.find((item) => item.bank === bank)
    if (existingBank) {
      existingBank.income -= amount
    } else {
      bankBalance.push({ bank, income: -amount })
    }
  })
  //計算Expenses
  expensesData?.data.map((expense) => {
    const bank = expense?.payment_receiver_account
    if (!bank) return
    const amount = expense?.amount
    const existingBank = bankBalance.find((item) => item.bank === bank)
    if (existingBank) {
      existingBank.income -= amount
    } else {
      bankBalance.push({ bank, income: -amount })
    }
  })

  //5.Insurer Payment [要給保險的錢](insurerTotalFee)
  const formatInsurerPayment = useFormatLineGridData({
    data: InsurerPaymentData?.data as TReceipts[],
    type: 'insurerPayment',
    debitNotesData: debitNotesData?.data,
    renewalsData: renewalsData?.data,
    insurersData: insurersData?.data,
  })

  //6.Expense 在Expense輸入了各項Expense的總和[費用紀錄金額]
  const formatTotalExpense = useFormatLineGridData({
    data: expensesData?.data as TExpenses[],
    type: 'totalExpense',
  })
  //6.Adjust balances 在Adjust balances輸入了各項Expense的總和[費用紀錄金額]
  const formatTotalAdjustBalances = useFormatLineGridData({
    data: adjustBalancesData?.data as TExpenses[],
    type: 'totalAdjustBalances',
  })
  // 追加creditNotesData data
  const creditNotesFormReceipt = receiptsData?.data.filter((receipt) => {
    if (receipt.created_from_credit_note_id) return true
    return false
  })

  const formatTotalCreditNotes = useFormatLineGridData({
    data: creditNotesFormReceipt as TDebitNote[],
    type: 'totalCreditNotes',
  })
  //7.Net Income [收入] 扣掉 [要給保險的錢] 扣掉 [費用紀錄金額](就是依照時間篩出來的第6項總和)
  const totalExpense = formatTotalExpense.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const totalAdjustBalances = formatTotalAdjustBalances.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const totalInsurerPayment = formatInsurerPayment.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const totalCreditNotes = formatTotalCreditNotes.reduce(
    (acc, item) => acc + item.value,
    0,
  )

  //8.Income by Bank Receipt 有選入帳銀行 按銀行計算
  //將第一位塞入totalExpense , 第二位塞入CreditNotes
  const incomeByBankReceipt = [
    { bank: 'Expenses', income: totalExpense },
    { bank: 'Credit Notes', income: totalCreditNotes },
    { bank: 'Adjust Balances', income: totalAdjustBalances },
    { bank: 'Insurer Payment', income: totalInsurerPayment },
  ]
  //TODO 這邊可以改掉 結合所有數據並排序
  const allData = _.sortBy(
    [
      ...formatTotalIncome,
      ...formatTotalExpense,
      ...formatTotalAdjustBalances,
      ...formatInsurerPayment,
      ...formatTotalCreditNotes,
    ],
    ['date', 'value'],
  )

  //是否顯示Spin
  const isLoading =
    debitNotesIsLoading ||
    quotationsIsLoading ||
    receiptsIsLoading ||
    expensesIsLoading ||
    adjustBalancesIsLoading ||
    creditNotesIsLoading ||
    insurersIsLoading ||
    renewalsIsLoading ||
    InsurerPaymentIsLoading
  //顯示數據
  const ShowData = () => {
    if (allData.length === 0) {
      return <Empty className=" my-4" />
    }
    return (
      <>
        <h2 className="mt-4 font-bold">Balance</h2>
        <IncomeByBank incomeByBankReceipt={bankBalance} />
        <h2 className="mt-4 font-bold">Income</h2>
        <NoDisplay noDisplayData={noDisplayData} />
        <IncomeByBank incomeByBankReceipt={receiptsByBankToIncome} />
        <h2 className="mt-4 font-bold">Expenses</h2>
        <IncomeByBank incomeByBankReceipt={incomeByBankReceipt} />
        {/* <LineGrid data={allData} /> */}
      </>
    )
  }

  return (
    <>
      <div className="flex justify-between items-end mb-8">
        <h1>Dashboard</h1>
        <div className="flex justify-center items-center gap-4">
          <Filter dateRange={dateRange} setDateRange={setDateRange} />
          <ExportButton />
        </div>
      </div>
      <Spin spinning={isLoading}>
        <ShowData />
      </Spin>
    </>
  )
}
