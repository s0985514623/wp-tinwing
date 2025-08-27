import { AreaChartOutlined } from '@ant-design/icons';

export const reports = [
    {
        name: 'reportsDropdown',
        meta: {
            icon: <AreaChartOutlined />,
            label: 'Reports',
        },
    },
    {
        name: 'reports',
        list: '/reports',
        meta: {
            parent: 'reportsDropdown',
            label: 'Reports',
        },
    },
    {
        name: 'other reports',
        list: '/reports/other-reports',
        meta: {
            parent: 'reportsDropdown',
            label: 'Other Reports',
        },
    },
];
