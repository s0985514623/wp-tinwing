import { FileDoneOutlined } from '@ant-design/icons';

export const creditNotes = [
    {
        name: 'credit_notes',
        identifier: 'credit_notes',
        list: '/creditNotes',
        create: '/creditNotes/create',
        edit: '/creditNotes/edit/:id',
        show: '/creditNotes/show/:id',
        meta: {
            icon: <FileDoneOutlined />,
            hide: true,
        },
    },
    {
        name: 'credit_notes',
        identifier: 'credit_notes_sider',
        list: '/creditNotes/create',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'New Credit Note',
        },
    },
];
