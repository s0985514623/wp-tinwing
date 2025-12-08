import { useState } from 'react'
import { useApiUrl } from '@refinedev/core'
import { message } from 'antd'
import * as ExcelJS from 'exceljs'
import dayjs, { Dayjs } from 'dayjs'
import axios from 'axios'

interface ExportParams {
    action: string
    dateRange?: [Dayjs, Dayjs] | undefined
    agentId?: number
    paymentStatus?: string
    insurerId?: number
}

export const useExcelExport = () => {
    const [isLoading, setIsLoading] = useState(false)
    const apiUrl = useApiUrl()

    const exportToExcel = async (params: ExportParams) => {
        setIsLoading(true)
        try {
            // 準備 API 參數
            const queryParams: Record<string, any> = {}
            
            if (params.dateRange) {
                queryParams['start_date'] = dayjs(params.dateRange[0]).format('YYYY-MM-DD')
                queryParams['end_date'] = dayjs(params.dateRange[1]).format('YYYY-MM-DD')
            }
            
            if (params.agentId) queryParams['agent_id'] = params.agentId
            if (params.paymentStatus) queryParams['payment_status'] = params.paymentStatus
            if (params.insurerId) queryParams['insurer_id'] = params.insurerId

            // 調用 API
            const response = await axios.get(`${apiUrl}/${params.action}`, {
                params: queryParams
            })
            const data = response.data

            if (!data?.data || !Array.isArray(data.data)) {
                throw new Error('無效的資料格式')
            }

            // 建立 Excel 工作簿
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet(getSheetName(params.action))

            // 根據不同的報表類型設定欄位
            const reportData = data.data
            if (reportData.length > 0) {
                // 處理 Profit and Loss Statement 格式
                if (params.action === 'profit_and_loss_analysis') {
                    // 不添加標題行，直接處理資料
                    let rowIndex = 1
                    
                    reportData.forEach((row: any) => {
                        const category = row.Category || ''
                        const account = row.Account || ''
                        const currentPeriod = row.Current_Period
                        const yearToDate = row.Year_to_Date
                        
                        // 根據類別設定不同的格式
                        let dataRow
                        
                        if (category === 'HEADER') {
                            if (account === 'Profit and Loss Statement') {
                                // 主標題
                                dataRow = worksheet.addRow([account, '', ''])
                                dataRow.font = { bold: true, size: 14 }
                                dataRow.alignment = { horizontal: 'left' }
                            } else if (account === 'As at 31/03/24') {
                                // 副標題
                                dataRow = worksheet.addRow([account, '', ''])
                                dataRow.font = { size: 12 }
                                dataRow.alignment = { horizontal: 'left' }
                            } else if (currentPeriod === 'Current Period') {
                                // 欄位標題
                                dataRow = worksheet.addRow(['', currentPeriod, yearToDate])
                                dataRow.font = { bold: true, size: 11 }
                                dataRow.alignment = { horizontal: 'center' }
                                dataRow.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'FFE6E6FA' }
                                }
                            }
                        } else if (category === 'SECTION') {
                            // 區段標題
                            dataRow = worksheet.addRow([account, '', ''])
                            dataRow.font = { bold: true, size: 11 }
                            dataRow.alignment = { horizontal: 'left' }
                        } else if (category === 'EMPTY') {
                            // 空行
                            dataRow = worksheet.addRow(['', '', ''])
                            // 空行不需要特殊格式
                        } else if (category === 'TOTAL' || category === 'FINAL_TOTAL') {
                            // 總計行
                            dataRow = worksheet.addRow([account, currentPeriod, yearToDate])
                            dataRow.font = { bold: true, size: 11 }
                            dataRow.alignment = { horizontal: 'left' }
                            
                            // 設定數值格式和對齊
                            if (typeof currentPeriod === 'number') {
                                dataRow.getCell(2).numFmt = '#,##0.00'
                                dataRow.getCell(2).alignment = { horizontal: 'right' }
                            }
                            if (typeof yearToDate === 'number') {
                                dataRow.getCell(3).numFmt = '#,##0.00'
                                dataRow.getCell(3).alignment = { horizontal: 'right' }
                            }
                            
                            // 加上邊框
                            dataRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    bottom: { style: 'thin' }
                                }
                            })
                        } else {
                            // 一般資料行 (包括 SUBTOTAL, INCOME, EXPENSE)
                            dataRow = worksheet.addRow([account, currentPeriod, yearToDate])
                            dataRow.alignment = { horizontal: 'left' }
                            
                            // 設定數值格式
                            if (typeof currentPeriod === 'number') {
                                dataRow.getCell(2).numFmt = '#,##0.00'
                                dataRow.getCell(2).alignment = { horizontal: 'right' }
                            }
                            if (typeof yearToDate === 'number') {
                                dataRow.getCell(3).numFmt = '#,##0.00'
                                dataRow.getCell(3).alignment = { horizontal: 'right' }
                            }
                            
                            // 如果是 SUBTOTAL，加上底線
                            if (category === 'SUBTOTAL') {
                                dataRow.getCell(2).border = { bottom: { style: 'thin' } }
                                dataRow.getCell(3).border = { bottom: { style: 'thin' } }
                            }
                        }
                        
                        rowIndex++
                    })
                    
                    // 設定欄寬
                    worksheet.getColumn(1).width = 35  // Account 欄
                    worksheet.getColumn(2).width = 15  // Current Period 欄
                    worksheet.getColumn(3).width = 15  // Year to Date 欄
                    
                } else {
                    // 其他報表的一般格式
                    const headers = Object.keys(reportData[0])
                    worksheet.addRow(headers)

                    // 設定標題行樣式
                    const headerRow = worksheet.getRow(1)
                    headerRow.height = 25
                    headerRow.font = { bold: true, size: 12 }
                    headerRow.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE6E6FA' }
                    }
                    headerRow.alignment = { 
                        vertical: 'middle', 
                        horizontal: 'center' 
                    }

                    // 添加資料行
                    reportData.forEach((row: any) => {
                        const values = headers.map(header => {
                            const value = row[header]
                            if (typeof value === 'number') {
                                return value
                            }
                            return value || ''
                        })
                        const dataRow = worksheet.addRow(values)
                        
                        // 設定資料行的格式
                        dataRow.eachCell((cell, colNumber) => {
                            const header = headers[colNumber - 1]
                            const value = row[header]
                            
                            if (typeof value === 'number') {
                                if (header.toLowerCase().includes('amount')) {
                                    cell.numFmt = '#,##0.00'
                                } else if (header.toLowerCase().includes('percentage')) {
                                    cell.numFmt = '0.00%'
                                }
                            }
                        })
                    })

                    // 自動調整欄寬
                    headers.forEach((header, index) => {
                        const column = worksheet.getColumn(index + 1)
                        const headerLength = header.toString().length
                        const dataLengths = reportData.map((row: any) => {
                            const value = row[header]
                            return value ? value.toString().length : 0
                        })
                        const maxDataLength = dataLengths.length > 0 ? Math.max(...dataLengths) : 0
                        const maxLength = Math.max(headerLength, maxDataLength)
                        column.width = Math.max(10, Math.min(maxLength + 2, 50))
                    })
                }
            }

            // 匯出檔案
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            })
            
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${getFileName(params.action)}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            message.success('Excel 檔案匯出成功')
        } catch (error) {
            console.error('Excel 匯出錯誤:', error)
            message.error('Excel 匯出失敗')
        } finally {
            setIsLoading(false)
        }
    }

    return { exportToExcel, isLoading }
}

// 取得工作表名稱
const getSheetName = (action: string): string => {
    const sheetNames: Record<string, string> = {
        'client_ageing_report': 'Client Ageing Report',
        'insurer_ageing_report': 'Insurer Ageing Report',
        'profit_and_loss_analysis': 'Profit and Loss Analysis',
        'trial_balance': 'Trial Balance',
        'balance_sheet': 'Balance Sheet'
    }
    return sheetNames[action] || 'Report'
}

// 取得檔案名稱
const getFileName = (action: string): string => {
    const fileNames: Record<string, string> = {
        'client_ageing_report': 'client_ageing_report',
        'insurer_ageing_report': 'insurer_ageing_report',
        'profit_and_loss_analysis': 'profit_and_loss_analysis',
        'trial_balance': 'trial_balance',
        'balance_sheet': 'balance_sheet'
    }
    return fileNames[action] || 'report'
}