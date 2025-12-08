import { useExport } from "@refinedev/core"
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { Dayjs, } from 'dayjs'
import { useExcelExport } from './useExcelExport'

function useSiderReportExport() {
    const [resource, setResource] = useState('')
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
        dayjs().add(-30, 'd'),
        dayjs(),
    ])
    const [agentId, setAgentId] = useState<number | undefined>()
    const [paymentStatus, setPaymentStatus] = useState<string | undefined>('paid')
    const [insurerId, setInsurerId] = useState<number | undefined>()
    
    // Excel 匯出功能
    const { exportToExcel, isLoading: excelLoading } = useExcelExport()
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
                value: agentId??undefined,
            },
            {
                field: 'payment_status',
                operator: 'eq',
                value: paymentStatus??undefined,
            },
            {
                field: 'insurer_id',
                operator: 'eq',
                value: insurerId??undefined,
            },
        ],
        onError: (error) => {
            console.log('error', error)
        },
        mapData: (data) => {
            if (data.Date) {
                const safeDate = `="${data.Date}"`
                return { ...data, Date: safeDate }
            }
            return data
        }
    })
    useEffect(() => {
        if (resource) {
            triggerExport()
        }
    }, [resource, dateRange, agentId, paymentStatus, insurerId])
    // 暴露一個能「帶 action」的啟動器
    const startExport = (
        { action, dateRange, agentId, paymentStatus, insurerId }: { action: string, dateRange: [Dayjs, Dayjs] | undefined, agentId?: number | undefined, paymentStatus?: string | undefined, insurerId?: number | undefined }) => {
        
        // 針對特定報表使用 Excel 匯出
        const excelReports = ['profit_and_loss_analysis', 'trial_balance', 'balance_sheet']
        
        if (excelReports.includes(action)) {
            exportToExcel({
                action,
                dateRange,
                agentId,
                paymentStatus,
                insurerId
            })
        } else {
            // 使用原有的 CSV 匯出
            setResource(action)
            setDateRange(dateRange)
            setAgentId(agentId)
            setPaymentStatus(paymentStatus)
            setInsurerId(insurerId)
        }
    };
    return { startExport, isLoading: isLoading || excelLoading }
}

export default useSiderReportExport