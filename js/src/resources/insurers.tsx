import { InsuranceOutlined } from '@ant-design/icons'

export const insurers = [
    {
        name: 'insurersDropdown',
        meta: {
            icon: <InsuranceOutlined />,
            label: 'Insurers',
        },
    },
    {
        name: 'insurers',
        list: '/insurers',
        create: '/insurers/create',
        edit: '/insurers/edit/:id',
        meta: {
            parent: 'insurersDropdown',
            label: 'Insurers Management',
        },
    },
    {
        name: 'insurer_products',
        list: '/insurer-products',
        create: '/insurer-products/create',
        edit: '/insurer-products/edit/:id',
        meta: {
            parent: 'insurersDropdown',
            label: 'Insurer Products',
        },
    },
    {
        name: 'terms',
        list: '/terms/insurance_class',
        create: '/terms/insurance_class/create',
        edit: '/terms/insurance_class/edit/:id',
        meta: {
            parent: 'insurersDropdown',
            label: 'Insurer Products Class',
            canDelete: true,
        },
    },
]
