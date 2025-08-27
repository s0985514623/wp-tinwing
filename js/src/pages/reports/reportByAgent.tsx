import { useState, useEffect } from 'react'
import Filter from '../accounting/dashboard/Filter'
import dayjs from 'dayjs'
import { Dayjs } from 'dayjs'
import { Button, Spin, Select } from 'antd'
import useSiderReportExport from 'hooks/useSiderReportExport'
import { useSelect } from '@refinedev/antd'
import { DataType as TAgents } from 'pages/agents/types'

export const ReportByAgent: React.FC = () => {
    //統一時間範圍
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
        dayjs().add(-30, 'd'),
        dayjs(),
    ])
    const [agentId, setAgentId] = useState<any>(undefined)
    const [paymentStatus, setPaymentStatus] = useState<string | undefined>('all')
    const { startExport, isLoading } = useSiderReportExport()
    const { selectProps: agentProps } = useSelect<TAgents>({
        resource: 'agents',
        optionLabel: 'agent_number',
        optionValue: 'id',
    })

    useEffect(() => {
        if (agentProps.options && agentProps.options.length > 0) {
            setAgentId(agentProps.options[0]?.value as number)
        }
    }, [agentProps.options])
    return <>
        <div className="flex flex-col gap-4">
            <h1>REPORT BY AGENT</h1>
            <div className='w-1/2 flex flex-col gap-4'>
                <Filter dateRange={dateRange} setDateRange={setDateRange} />
                <div className='flex flex-col'>
                    <div className='th'>Agent Code</div>
                    <div className='td'>
                        <Select {...agentProps} className="w-full" allowClear onChange={(v) => setAgentId(v)} value={agentId ?? undefined} />
                    </div>
                </div>
                <div className='flex flex-col'>
                    <div className='th'>Payment Status</div>
                    <div className='td'>
                        <Select className="w-full" allowClear onChange={(v) => setPaymentStatus(v)} value={paymentStatus ?? undefined}>
                            <Select.Option value="all">All</Select.Option>
                            <Select.Option value="paid">Paid</Select.Option>
                            <Select.Option value="unpaid">Unpaid</Select.Option>
                        </Select>
                    </div>
                </div>
            </div>
            <Spin spinning={isLoading}>
                <div className='flex flex-wrap gap-4 w-2/3 mt-4'>
                    <Button type='primary' onClick={() => startExport('report_by_agent', dateRange, agentId, paymentStatus)}>Export</Button>
                </div>
            </Spin>
        </div>
    </>;
};