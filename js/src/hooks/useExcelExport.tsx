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

            if (params.dateRange === undefined) {
            } else if (params.dateRange && Array.isArray(params.dateRange) && params.dateRange.length === 2) {
                queryParams['start_date'] = dayjs(params.dateRange[0]).format('YYYY-MM-DD')
                queryParams['end_date'] = dayjs(params.dateRange[1]).format('YYYY-MM-DD')

            } else {
                console.log('❌ 日期參數格式無效:', params.dateRange)
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
                // 處理 Profit and Loss Statement 與 Balance Sheet 格式：第一欄為項目名稱，之後是金額欄
                if (params.action in statementValueKeys) {
                    const valueKeys = statementValueKeys[params.action]
                    const lastColumn = valueKeys.length + 1

                    reportData.forEach((row: any, index: number) => {
                        const category = row.Category || ''
                        const dataRow = worksheet.addRow([row.Account || '', ...valueKeys.map((key) => row[key] ?? '')])

                        if (category === 'HEADER') {
                            // 第一列為主標題，其餘為「As at」日期
                            dataRow.font = index === 0 ? { bold: true, size: 14 } : { size: 12 }
                            return
                        }
                        if (category === 'COLUMN_HEADER') {
                            dataRow.font = { bold: true, size: 11 }
                            dataRow.alignment = { horizontal: 'left' }
                            return
                        }
                        if (category === 'SECTION') {
                            dataRow.font = { bold: true, size: 11 }
                            return
                        }
                        if (category === 'EMPTY') {
                            return
                        }

                        const isTotal = category === 'TOTAL' || category === 'FINAL_TOTAL'
                        if (isTotal) {
                            dataRow.font = { bold: true, size: 11 }
                        }
                        for (let col = 2; col <= lastColumn; col++) {
                            const cell = dataRow.getCell(col)
                            if (typeof cell.value !== 'number') {
                                continue
                            }
                            cell.numFmt = '#,##0.00'
                            cell.alignment = { horizontal: 'right' }
                            if (isTotal) {
                                cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' } }
                            } else if (category === 'SUBTOTAL') {
                                cell.border = { bottom: { style: 'thin' } }
                            }
                        }
                    })

                    // 設定欄寬
                    worksheet.getColumn(1).width = 35  // 項目名稱欄
                    for (let col = 2; col <= lastColumn; col++) {
                        worksheet.getColumn(col).width = 18
                    }

                } else if (params.action === 'trial_balance') {
                    // 處理 Trial Balance 格式：No. / Attribute / Account Name 之後是五組借貸金額，組與組之間空一欄
                    const amountGroups = ['Beginning Balance', 'Beginning Period', 'Opening Balance', 'This Period', 'Ending Balance']
                    const amountColumns = amountGroups.flatMap((group, index) => [
                        { key: `${group} Debit`, col: 4 + index * 3 },
                        { key: `${group} Credit`, col: 5 + index * 3 },
                    ])
                    const lastColumn = amountColumns[amountColumns.length - 1].col

                    reportData.forEach((row: any) => {
                        const category = row.Category || ''
                        const headerType = row['Header Type'] || ''

                        const values: (string | number)[] = Array(lastColumn).fill('')
                        values[0] = row['No.'] ?? ''
                        values[1] = row['Attribute'] ?? ''
                        values[2] = row['Account Name'] ?? ''
                        amountColumns.forEach(({ key, col }) => {
                            values[col - 1] = row[key] ?? ''
                        })
                        const dataRow = worksheet.addRow(values)

                        if (category === 'HEADER') {
                            if (headerType === 'TITLE' || headerType === 'SUBTITLE') {
                                // 主標題與期間 - 從 Account Name 合併到最後一欄並置中
                                dataRow.font = { bold: headerType === 'TITLE', size: headerType === 'TITLE' ? 14 : 12 }
                                worksheet.mergeCells(dataRow.number, 3, dataRow.number, lastColumn)
                                dataRow.getCell(3).alignment = { horizontal: 'center' as const, vertical: 'middle' as const }
                                return
                            }

                            dataRow.font = { bold: true, size: 11 }
                            if (headerType === 'GROUP') {
                                // 各組標題橫跨該組的借貸兩欄
                                amountColumns.filter((_, index) => index % 2 === 0).forEach(({ col }) => {
                                    worksheet.mergeCells(dataRow.number, col, dataRow.number, col + 1)
                                })
                            }
                            dataRow.eachCell((cell) => {
                                cell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: false }
                                if (headerType === 'COLUMN') {
                                    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } }
                                }
                            })
                            return
                        }

                        dataRow.alignment = { horizontal: 'left' }
                        amountColumns.forEach(({ col }) => {
                            const cell = dataRow.getCell(col)
                            if (typeof cell.value === 'number') {
                                cell.numFmt = '#,##0.00'
                                cell.alignment = { horizontal: 'right' as const }
                            }
                        })

                        if (category === 'TOTAL') {
                            dataRow.font = { bold: true, size: 11 }
                            dataRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    bottom: { style: 'thin' }
                                }
                            })
                        }
                    })

                    // 設定欄寬
                    worksheet.getColumn(1).width = 8   // No. 欄
                    worksheet.getColumn(2).width = 25  // Attribute 欄
                    worksheet.getColumn(3).width = 34  // Account Name 欄
                    for (let col = 4; col <= lastColumn; col++) {
                        // 每三欄為「借、貸、空白間隔」
                        worksheet.getColumn(col).width = (col - 4) % 3 === 2 ? 3 : 17
                    }
                } else {
                    // 其他報表的一般格式
                    const headers = Object.keys(reportData[0])
                    worksheet.addRow(headers)

                    // 設定標題行樣式
                    const headerRow = worksheet.getRow(1)
                    headerRow.height = 25
                    headerRow.font = { bold: true, size: 12 }
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

            // 後端附上的提示（例如起始日早於期初可滾算的日期）
            if (data.notice) {
                message.warning(data.notice, 8)
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

// 項目名稱之外的金額欄位，依序對應 Excel 的第 2 欄起
const statementValueKeys: Record<string, string[]> = {
    'profit_and_loss_analysis': ['Current_Period'],
    'balance_sheet': ['Amount', 'Subtotal', 'Total'],
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