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
        { action, dateRange: inputDateRange, agentId: inputAgentId, paymentStatus: inputPaymentStatus, insurerId: inputInsurerId }: 
        { action: string, dateRange?: [Dayjs, Dayjs] | undefined, agentId?: number | undefined, paymentStatus?: string | undefined, insurerId?: number | undefined }) => {
        
        // 針對特定報表使用 Excel 匯出
        const excelReports = ['profit_and_loss_analysis', 'trial_balance', 'balance_sheet']
        
        if (excelReports.includes(action)) {
            
            // 對於 Excel 報表，直接使用傳入的參數，不使用內部 state 作為 fallback
            exportToExcel({
                action,
                dateRange: inputDateRange, // 直接使用傳入的值
                agentId: inputAgentId,
                paymentStatus: inputPaymentStatus,
                insurerId: inputInsurerId
            })
        } else {
            // 對於 CSV 報表，更新 state 讓 useEffect 觸發 triggerExport()
            setResource(action)
            setDateRange(inputDateRange || dateRange)
            setAgentId(inputAgentId !== undefined ? inputAgentId : agentId)
            setPaymentStatus(inputPaymentStatus !== undefined ? inputPaymentStatus : paymentStatus)
            setInsurerId(inputInsurerId !== undefined ? inputInsurerId : insurerId)
        }
    };
    return { startExport, isLoading: isLoading || excelLoading }
}

export default useSiderReportExport