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
    const { triggerExport ,isLoading} = useExport({
        resource: resource,
        pageSize: -1,
        filters: [
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
        ],
        onError:(error)=>{
            console.log('error',error)
        },
        mapData: (data) => {
            const safeDate=`="${data.Date}"`
            return {...data,Date:safeDate}
        }
    })
    useEffect(() => {
        if(resource){
            triggerExport()
        }
    }, [resource,dateRange])
    // 暴露一個能「帶 action」的啟動器
    const startExport = (action: string,dateRange: [Dayjs, Dayjs] | undefined) => {
        setResource(action)
        setDateRange(dateRange)
    };
    return { startExport ,isLoading}
}

export default useSiderReportExport