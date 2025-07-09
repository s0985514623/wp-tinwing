import { AccountBookOutlined } from '@ant-design/icons';

export const accounting = [
    {
        name: 'accountingDropdown',
        meta: {
            icon: <AccountBookOutlined />,
            label: 'Accounting',
        },
    },
    {
        name: 'dashboard',
        list: '/dashboard',
        create: '/dashboard/create',
        edit: '/dashboard/edit/:id',
        meta: {
            parent: 'accountingDropdown',
            label: 'Dashboard',
        },
    },
    {
        name: 'receipts',
        list: '/income',
        create: '/income/create',
        edit: '/income/edit/:id',
        meta: {
            parent: 'accountingDropdown',
            label: 'Income',
        },
    },
    {
        name: 'insurerPaymentDropdown',
        meta: {
            parent: 'accountingDropdown',
            label: 'InsurerPayment',
        },
    },
    {
        name: 'receipts',
		identifier: 'insurer_payment_record',
        list: '/insurerPayment/record',
        edit: '/insurerPayment/record/edit/:id',
        meta: {
            parent: 'insurerPaymentDropdown',
            label: 'Record',
        },
    },
    {
        name: 'insurers',
        list: '/insurerPayment/summary',
        meta: {
            parent: 'insurerPaymentDropdown',
            label: 'Summary',
        },
    },
    {
        name: 'expensesDropdown',
        meta: {
            parent: 'accountingDropdown',
            label: 'Other Expenses',
        },
    },
    {
        name: 'expenses',
        identifier: 'expenses_record',
        list: '/otherExpenses/record',
        create: '/otherExpenses/record/create',
        edit: '/otherExpenses/record/edit/:id',
        meta: {
            parent: 'expensesDropdown',
            label: 'Record',
        },
    },
    {
        name: 'expenses',
        identifier: 'expenses_summary',
        list: '/otherExpenses/summary',
        show: '/otherExpenses/summary/show/:year/:month/:bank',
        meta: {
            parent: 'expensesDropdown',
            label: 'Summary',
        },
    },
    {
        name: 'terms',
        identifier: 'terms_expense_class',
				list: '/terms/expense_class',
        create: '/terms/expense_class/create',
        edit: '/terms/expense_class/edit/:id',
        meta: {
            parent: 'expensesDropdown',
            label: 'Category',
        },
    },
		{
			name: 'expenses',
			identifier: 'expenses_adjust_balance',
			list: '/adjust_balance',
			create: '/adjust_balance/create',
			edit: '/adjust_balance/edit/:id',
			meta: {
					parent: 'accountingDropdown',
					label: 'Adjust Balance',
			},
	},
];
