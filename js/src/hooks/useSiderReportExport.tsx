import { useExport } from "@refinedev/core"
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Dayjs, } from 'dayjs'

function useSiderReportExport() {
    const [resource, setResource] = useState('')
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
        dayjs().add(-30, 'd'),
        dayjs(),
    ])
    const [agentId, setAgentId] = useState<number | undefined>()
    const [paymentStatus, setPaymentStatus] = useState<string | undefined>('paid')
    const { triggerExport, isLoading } = useExport({
        resource: resource,
        pageSize: -1,
        filters: [
            {
                field: 'meta_query[relation]',
                operator: 'eq',
                value: 'AND',
            },
            {
                field: 'meta_query[0][key]',
                operator: 'eq',
                value: 'date',
            },
            {
                field: 'meta_query[0][value][0]',
                operator: 'eq',
                value: dateRange
                    ? dayjs(dateRange[0]?.startOf('day')).unix()
                    : undefined,
            },
            {
                field: 'meta_query[0][value][1]',
                operator: 'eq',
                value: dateRange
                    ? dayjs(dateRange[1]?.endOf('day')).unix()
                    : undefined,
            },
            {
                field: 'meta_query[0][compare]',
                operator: 'eq',
                value: dateRange ? 'BETWEEN' : '>',
            },
            {
                field: 'agent_id',
                operator: 'eq',
                value: agentId,
            },
            {
                field: 'payment_status',
                operator: 'eq',
                value: paymentStatus,
            },
        ],
        onError: (error) => {
            console.log('error', error)
        },
        mapData: (data) => {
            const safeDate = `="${data.Date}"`
            return { ...data, Date: safeDate }
        }
    })
    useEffect(() => {
        if (resource) {
            triggerExport()
        }
    }, [resource, dateRange, agentId, paymentStatus])
    // 暴露一個能「帶 action」的啟動器
    const startExport = (action: string, dateRange: [Dayjs, Dayjs] | undefined, agentId?: number | undefined, paymentStatus?: string | undefined) => {
        setResource(action)
        setDateRange(dateRange)
        setAgentId(agentId)
        setPaymentStatus(paymentStatus)
    };
    return { startExport, isLoading }
}

export default useSiderReportExport