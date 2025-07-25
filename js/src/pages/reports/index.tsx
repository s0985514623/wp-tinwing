import { Tabs, TabsProps } from 'antd';
import Template from './template';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import { DataType as TQuotation } from 'pages/quotations/types';
import { DataType as TReceipt } from 'pages/receipts/types';
import { TRequiredProps } from './template/types';

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Monthly Account Receivable',
        children: <Template<TDebitNote & TRequiredProps> resource="debit_notes/and_credit_notes" />,
    },
    {
        key: '2',
        label: 'Monthly Outstanding Payment',
        children: <Template<TQuotation & TRequiredProps> resource="debit_notes/not_receipt" />,
    },
    {
        key: '3',
        label: 'Monthly Payment Received',
        children: <Template<TReceipt & TRequiredProps> resource="receipts" />,
    },
];

const index = () => {
    return <Tabs defaultActiveKey="1" centered items={items} />;
};

export default index;
