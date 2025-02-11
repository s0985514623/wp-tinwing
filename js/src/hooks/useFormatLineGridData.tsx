import { DataType as TReceipts } from 'pages/receipts/types'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import { DataType as TQuotations } from 'pages/quotations/types'
import { DataType as TExpenses } from 'pages/accounting/Expense/types'
import { DataType as TInsurers } from 'pages/insurers/types'
import { DataType as TRenewals } from 'pages/renewals/types'
import { TLineGridData } from 'types'
import dayjs from 'dayjs'
import { getTotalPremiumByDebitNote, getInsurerPayment } from 'utils'

type DataType = TDebitNote | TQuotations | TReceipts
/**
 * @description: 將資料組成lineGrid所需JSON格式
 * @param {Array} data 從API取得的資料
 * @param {String} type 要求的資料類型
 * @return {JSON} lineGrid所需JSON格式 [{date:string,value:number,category:string}]
 */
export const useFormatLineGridData = ({
  data,
  type,
  debitNotesData,
  renewalsData,
  insurersData,
}: {
  data: DataType[]
  type: string
  debitNotesData?: TDebitNote[]
  renewalsData?: TRenewals[]
  insurersData?: TInsurers[]
}) => {
  if (data?.length === 0 || data == undefined) return []
  if (type === 'totalIncome') {
    return (data as TReceipts[])?.reduce((acc, receipt) => {
      //取得date
      const date = dayjs.unix(receipt?.date as number).format('YYYY-MM-DD')
      //取得value
      const premium = receipt?.premium
        ? Number(receipt?.premium)
        : getTotalPremiumByDebitNote(
            (
              debitNotesData?.filter(
                (debitNote) =>
                  debitNote?.id === (receipt as TReceipts)?.debit_note_id,
              ) as TDebitNote[]
            )[0] ?? {},
          )
      // 尋找是否已經有該銀行的紀錄
      const existingDate = acc.find((item) => item.date === date)
      if (existingDate) {
        existingDate.value += premium
      } else {
        acc.push({ date, value: premium, category: 'Total Income' })
      }
      return acc
    }, [] as TLineGridData)
  }
  if (type === 'totalExpense') {
    return (data as TExpenses[])?.reduce((acc, receipt) => {
      //取得bank 如果沒有的話不紀錄
      const bank = receipt?.payment_receiver_account
      if (!bank) return acc
      //取得date
      const date = dayjs.unix(Number(receipt.date))?.format('YYYY-MM-DD')
      //取得value
      const premium = receipt?.amount

      // 尋找是否已經有該category的紀錄
      const existingDate = acc.find((item) => item.date === date)
      if (existingDate) {
        existingDate.value += premium
      } else {
        acc.push({ date, value: premium, category: 'Expenses' })
      }
      return acc
    }, [] as TLineGridData)
  }
  if (type === 'totalAdjustBalances') {
    return (data as TExpenses[])?.reduce((acc, receipt) => {
      //取得date
      const date = dayjs.unix(Number(receipt.date))?.format('YYYY-MM-DD')
      //取得value
      const premium = receipt?.amount

      // 尋找是否已經有該category的紀錄
      const existingDate = acc.find((item) => item.date === date)
      if (existingDate) {
        existingDate.value += premium
      } else {
        acc.push({ date, value: premium, category: 'Adjust Balances' })
      }
      return acc
    }, [] as TLineGridData)
  }
  if (type === 'insurerPayment') {
    return (data as TReceipts[])?.reduce((acc, receipt) => {
      //取得date
      const date = dayjs.unix(receipt?.date as number).format('YYYY-MM-DD')
      // const debitNote = debitNotesData?.find((dn) => dn?.id === receipt?.debit_note_id);
      // const insurer = insurerData?.find((ins) => ins?.id === debitNote?.insurer_id);
      const debitNote = debitNotesData?.find(
        (dn: TDebitNote) => dn.id === receipt.debit_note_id,
      )
      const renewal = renewalsData?.find(
        (r: TRenewals) => r.id === receipt.created_from_renewal_id,
      )
      const insurer = insurersData?.find((insurer) => {
        if (renewal) {
          return insurer.id === renewal.insurer_id
        } else {
          return insurer.id === debitNote?.insurer_id
        }
      })
      //取得value
      const premium = insurer
        ? getInsurerPayment(
            receipt,
            renewal ?? (debitNote as TDebitNote),
            insurer as TInsurers,
          )
        : 0
      // 尋找是否已經有該日期的紀錄
      const existingDate = acc.find((item) => item.date === date)
      if (existingDate) {
        existingDate.value += premium
      } else {
        acc.push({ date, value: premium, category: 'Insurer Payment' })
      }
      return acc
    }, [] as TLineGridData)
  }
  if (type === 'totalCreditNotes') {
    return (data as TDebitNote[])?.reduce((acc, credit_notes) => {
      //取得date
      const date = dayjs.unix(credit_notes?.date as number).format('YYYY-MM-DD')

      //取得value
      const premium = credit_notes?.premium
        ? Math.abs(credit_notes?.premium)
        : 0

      // 尋找是否已經有該日期的紀錄
      const existingDate = acc.find((item) => item.date === date)
      if (existingDate) {
        existingDate.value += premium
      } else {
        acc.push({ date, value: premium, category: 'Credit Notes' })
      }
      return acc
    }, [] as TLineGridData)
  }

  return []
}
