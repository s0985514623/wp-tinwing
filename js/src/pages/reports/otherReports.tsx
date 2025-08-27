import { useState } from 'react'
import Filter from '../accounting/dashboard/Filter'
import dayjs from 'dayjs'
import { Dayjs } from 'dayjs'
import { Button, Spin } from 'antd'
import useSiderReportExport from 'hooks/useSiderReportExport'

export const OtherReports: React.FC = () => {
    //統一時間範圍
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
        dayjs().add(-30, 'd'),
        dayjs(),
    ])
    const { startExport, isLoading } = useSiderReportExport()
    return <>
        <div className="flex flex-col gap-4">
            <h1>ACCOUNTING REPORTS</h1>
            <div className='w-1/2'>
                <Filter dateRange={dateRange} setDateRange={setDateRange} />

            </div>
            <Spin spinning={isLoading}>
                <div className='flex flex-wrap gap-4 w-2/3 mt-4'>
                    <Button type='primary' onClick={() => startExport('client_ageing_report', dateRange)}>Client Ageing Report</Button>
                    <Button type='primary' onClick={() => startExport('insurer_ageing_report', dateRange)}>Insurer Ageing Report</Button>
                    <Button type='primary'>Analysis by Principal and Class</Button>
                    <Button type='primary'>Profit and Loss Analysis</Button>
                    <Button type='primary'>Trial Balance</Button>
                    <Button type='primary'>Balance Sheet</Button>
                </div>
            </Spin>
        </div>
    </>;
};