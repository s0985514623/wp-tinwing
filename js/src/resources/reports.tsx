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
        name: 'Customer Ageing Report',
        list: '/reports/customer-ageing',
        meta: {
            parent: 'reportsDropdown',
            label: 'Customer Ageing Report',
            action: 'export-customer-ageing',
        },
    },
    {
        name: 'Insurer Ageing Report',
        list: '/reports/insurer-ageing',
        meta: {
            parent: 'reportsDropdown',
            label: 'Insurer Ageing Report',
            action: 'export-insurer-ageing',
        },
    },
    {
        name:'Agent Report',
        list: '/reports/agent-report',
        meta: {
            parent: 'reportsDropdown',
            label: 'Agent Report',  
            action: 'export-agent-report',
        },
    },
    {
        name: 'Sales Analysis by Insurer and Class',
        list: '/reports/sales-analysis-by-insurer-and-class',
        meta: {
            parent: 'reportsDropdown',
            label: 'Sales Analysis by Insurer and Class',
        },
    },
    {
        name:'Profit and Loss',
        list: '/reports/profit-and-loss-report',
        meta: {
            parent: 'reportsDropdown',
            label: 'Profit and Loss Report',
        },
    },
    {
        name: 'Trial Balance and Expenses',
        list: '/reports/trial-balance-and-expenses',
        meta: {
            parent: 'reportsDropdown',
            label: 'Trial Balance and Expenses',
        },
    },
    {
        name:'Balance Sheet',
        list: '/reports/balance-sheet',
        meta: {
            parent: 'reportsDropdown',
            label: 'Balance Sheet',
        },
    }
];
