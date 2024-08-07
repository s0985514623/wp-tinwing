import { FileDoneOutlined } from '@ant-design/icons';

export const archive = [
    {
        name: 'recordDropdown',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'Record',
        },
    },
    {
        name: 'quotations',
        list: '/archived_Quotations',
        meta: {
            parent: 'recordDropdown',
            label: 'Quotations',
        },
    },
    {
        name: 'debit_notes',
        list: '/archived_debit_notes',
        meta: {
            parent: 'recordDropdown',
            label: 'Debit Notes',
        },
    },
    {
        name: 'receipts',
        list: '/archived_receipts',
        meta: {
            parent: 'recordDropdown',
            label: 'Receipts',
        },
    },
    {
        name: 'renewals',
        list: '/archived_renewals',
        meta: {
            parent: 'recordDropdown',
            label: 'Renewals',
        },
    },
];
