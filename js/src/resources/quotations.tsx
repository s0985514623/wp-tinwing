import { FileDoneOutlined } from '@ant-design/icons';

export const quotations = [
    {
        name: 'quotations',
        identifier: 'quotations',
        list: '/quotations',
        create: '/quotations/create',
        edit: '/quotations/edit/:id',
        show: '/quotations/show/:id',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'Quotations',
            hide: true,
        },
    },
    {
        name: 'quotations',
        identifier: 'quotations_sider',
        list: '/quotations/create',
        meta: {
            icon: <FileDoneOutlined />,
            label: 'New Quotation',
        },
    },
];
