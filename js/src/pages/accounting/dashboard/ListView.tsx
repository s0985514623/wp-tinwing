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
import { getTotalPremiumByDebitNote } from 'utils'
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
          value: 'period_of_insurance_to',
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
  const { data: receiptsData, isLoading: receiptsIsLoading } =
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
        : [],
    })
  const { data: expensesData, isLoading: expensesIsLoading } =
    useList<TExpenses>({
      resource: 'expenses',
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
							value: 'created_at',
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
        : [],
    })
  const { data: insurersData, isLoading: insurersIsLoading } =
    useList<TInsurers>({
      resource: 'insurers',
    })

  //123.各種數量
  const debitNotesNo = debitNotesData?.total
  const quotationsNo = quotationsData?.total
  const receiptsNo = receiptsData?.total
  const noDisplayData = [
    { noBy: 'No of Quotation', value: quotationsNo },
    { noBy: 'No of Debit Notes', value: debitNotesNo },
    { noBy: 'No of Receipt', value: receiptsNo },
  ]
  //4.receipt amount[收入](total premium)
  const formatTotalIncome = useFormatLineGridData({
    data: receiptsData?.data as TReceipts[],
    type: 'totalIncome',
    debitNotesData: debitNotesData?.data,
  })

  //5.Insurer Payment [要給保險的錢](insurerTotalFee)
  const formatInsurerPayment = useFormatLineGridData({
    data: receiptsData?.data as TReceipts[],
    type: 'insurerPayment',
    debitNotesData: debitNotesData?.data,
    insurerData: insurersData?.data,
  })

  //6.Expense 在Expense輸入了各項Expense的總和[費用紀錄金額]
  const formatTotalExpense = useFormatLineGridData({
    data: expensesData?.data as TExpenses[],
    type: 'totalExpense',
  })

  //7.Net Income [收入] 扣掉 [要給保險的錢] 扣掉 [費用紀錄金額](就是依照時間篩出來的第6項總和)
  const totalIncome = formatTotalIncome.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const totalExpense = formatTotalExpense.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const totalInsurerPayment = formatInsurerPayment.reduce(
    (acc, item) => acc + item.value,
    0,
  )
  const netIncome = totalIncome - totalExpense - totalInsurerPayment

  //8.Income by Bank Receipt 有選入帳銀行 按銀行計算
  //將第一位塞入totalExpense
  const incomeByBankReceipt = [
    { bank: 'Expenses', income: totalExpense },
    ...(receiptsData?.data.reduce(
      (acc, receipt) => {
        //取得銀行名稱
        const bank = receipt?.payment_receiver_account
        //有銀行名稱才執行
        if (!bank) return acc
        //取得premium
        const income = receipt?.premium
          ? Number(receipt?.premium)
          : getTotalPremiumByDebitNote(
              (
                debitNotesData?.data?.filter(
                  (debitNote) => debitNote?.id === receipt?.debit_note_id,
                ) as TDebitNote[]
              )[0] ?? 0,
            )
        // 尋找是否已經有該銀行的紀錄
        const existingBank = acc.find((item) => item.bank === bank)
        if (existingBank) {
          existingBank.income += income
        } else {
          acc.push({ bank, income })
        }
        return acc
      },
      [] as { bank: string; income: number }[],
    ) || []),
  ]
  //結合所有數據並排序
  const allData = _.sortBy(
    [...formatTotalIncome, ...formatTotalExpense, ...formatInsurerPayment],
    ['date', 'value'],
  )

  //是否顯示Spin
  const isLoading =
    debitNotesIsLoading ||
    quotationsIsLoading ||
    receiptsIsLoading ||
    expensesIsLoading ||
    insurersIsLoading
  //顯示數據
  const ShowData = () => {
    if (allData.length === 0) {
      return <Empty className=" my-4" />
    }
    return (
      <>
        <div className="grid grid-cols-3 gap-5 my-4">
          <div className="flex flex-col w-full shadow-md bg-white rounded-lg p-5">
            <div className="text-2xl text-slate-700 font-bold">
              {netIncome.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300">Net Income</div>
          </div>
        </div>
        <NoDisplay noDisplayData={noDisplayData} />
        <IncomeByBank incomeByBankReceipt={incomeByBankReceipt} />
        <LineGrid data={allData} />
      </>
    )
  }

  return (
    <>
      <div className="flex justify-between items-end">
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
