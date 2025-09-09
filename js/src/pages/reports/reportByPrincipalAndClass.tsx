import { useState, useEffect } from 'react'
import Filter from '../accounting/dashboard/Filter'
import dayjs from 'dayjs'
import { Dayjs } from 'dayjs'
import { Button, Spin, Select } from 'antd'
import useSiderReportExport from 'hooks/useSiderReportExport'
import { useSelect } from '@refinedev/antd'
import { DataType as TInsurance } from 'pages/insurers/types'

export const ReportByPrincipalAndClass: React.FC = () => {
    //統一時間範圍
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
        dayjs().add(-30, 'd'),
        dayjs(),
    ])
    const [insurerId, setInsurerId] = useState<any>(undefined)
    const { startExport, isLoading } = useSiderReportExport()
    const { selectProps: insurerProps } = useSelect<TInsurance>({
        resource: 'insurers',
        optionLabel: 'insurer_number',
        optionValue: 'id',
    })

    useEffect(() => {
        if (insurerProps.options && insurerProps.options.length > 0) {
            setInsurerId(insurerProps.options[0]?.value as number)
        }
    }, [insurerProps.options])
    return <>
        <div className="flex flex-col gap-4">
            <h1>REPORT BY AGENT</h1>
            <div className='w-1/2 flex flex-col gap-4'>
                <Filter dateRange={dateRange} setDateRange={setDateRange} />
                <div className='flex flex-col'>
                    <div className='th'>Insurer Code</div>
                    <div className='td'>
                        <Select {...insurerProps} className="w-full" allowClear onChange={(v) => setInsurerId(v)} value={insurerId ?? undefined} />
                    </div>
                </div>
            </div>
            <Spin spinning={isLoading}>
                <div className='flex flex-wrap gap-4 w-2/3 mt-4'>
                    <Button type='primary' onClick={() => startExport({action:'report_by_principal_and_class', dateRange, insurerId})}>Export</Button>
                </div>
            </Spin>
        </div>
    </>;
};