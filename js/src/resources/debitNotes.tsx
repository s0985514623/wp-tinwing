import { FileDoneOutlined } from '@ant-design/icons';


export const debitNotes = [
    {
        name: 'debit_notes',
        identifier: 'debit_notes',
        list: '/debitNotes',
        create: '/debitNotes/create',
        edit: '/debitNotes/edit/:id',
        show: '/debitNotes/show/:id',
        meta: {
            icon: <FileDoneOutlined />,
            hide: true,
        },
    },
    {
        name: 'debit_notes',
        identifier: 'debit_notes_sider',
        list: '/debitNotes/create',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'New Debit Note',
        },
    },
    {
        name: 'receipts',
        identifier: 'receipts',
        list: '/receipts',
        create: '/receipts/create',
        edit: '/receipts/edit/:id',
        show: '/receipts/show/:id',
        meta: {
            icon: <FileDoneOutlined />,
            hide: true,
        },
    },
    {
        name: 'receipts',
        identifier: 'receipts_sider',
        list: '/receipts/create',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'New Receipt',
        },
    },
    {
        name: 'renewals',
        identifier: 'renewals',
        list: '/renewals',
        create: '/renewals/create',
        edit: '/renewals/edit/:id',
        show: '/renewals/show/:id',
        meta: {
            icon: <FileDoneOutlined />,
            hide: true,
        },
    },
    {
        name: 'renewals',
        identifier: 'renewals_sider',
        list: '/renewals/create',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'New Renewal',
        },
    },
];
