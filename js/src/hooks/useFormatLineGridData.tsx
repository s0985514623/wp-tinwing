import { DataType as TReceipts } from 'pages/receipts/types';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import { DataType as TQuotations } from 'pages/quotations/types';
import { DataType as TExpenses } from 'pages/accounting/Expense/types';
import { DataType as TInsurers } from 'pages/insurers/types';
import { TLineGridData } from 'types';
import dayjs from 'dayjs';
import { getTotalPremiumByDebitNote, getInsurerPayment } from 'utils';

type DataType = TDebitNote | TQuotations | TReceipts;
/**
 * @description: 將資料組成lineGrid所需JSON格式
 * @param {Array} data 從API取得的資料
 * @param {String} type 要求的資料類型
 * @return {JSON} lineGrid所需JSON格式 [{date:string,value:number,category:string}]
 */
export const useFormatLineGridData = ({ data, type, debitNotesData, insurerData }: { data: DataType[]; type: string; debitNotesData?: TDebitNote[]; insurerData?: TInsurers[] }) => {
    if (data?.length === 0 || data == undefined) return [];
    if (type === 'totalIncome') {
        return (data as TReceipts[])?.reduce((acc, receipt) => {
            //取得date
            const date = dayjs.unix(receipt?.date as number).format('YYYY-MM-DD');
            //取得value
            const premium = receipt?.premium ? Number(receipt?.premium) : getTotalPremiumByDebitNote((debitNotesData?.filter((debitNote) => debitNote?.id === (receipt as TReceipts)?.debitNoteId) as TDebitNote[])[0] ?? {});
            // 尋找是否已經有該銀行的紀錄
            const existingDate = acc.find((item) => item.date === date);
            if (existingDate) {
                existingDate.value += premium;
            } else {
                acc.push({ date, value: premium, category: 'Total Income' });
            }
            return acc;
        }, [] as TLineGridData);
    }
    if (type === 'totalExpense') {
        return (data as TExpenses[])?.reduce((acc, receipt) => {
            //取得date
            const date = dayjs(receipt.created_at)?.format('YYYY-MM-DD');
            //取得value
            const premium = receipt?.amount;

            // 尋找是否已經有該category的紀錄
            const existingDate = acc.find((item) => item.date === date);
            if (existingDate) {
                existingDate.value += premium;
            } else {
                acc.push({ date, value: premium, category: 'Expenses' });
            }
            return acc;
        }, [] as TLineGridData);
    }
    if (type === 'insurerPayment') {
        return (data as TReceipts[])?.reduce((acc, receipt) => {
            //取得date
            const date = dayjs.unix(receipt?.date as number).format('YYYY-MM-DD');
            const debitNote = debitNotesData?.find((dn) => dn?.id === receipt?.debitNoteId);
            const insurer = insurerData?.find((ins) => ins?.id === debitNote?.insurerId);
            //取得value
            const premium = debitNote && insurer ? getInsurerPayment(receipt, debitNote, insurer) : 0;

            // 尋找是否已經有該日期的紀錄
            const existingDate = acc.find((item) => item.date === date);
            if (existingDate) {
                existingDate.value += premium;
            } else {
                acc.push({ date, value: premium, category: 'Insurer Payment' });
            }
            return acc;
        }, [] as TLineGridData);
    }
    return [];
};
