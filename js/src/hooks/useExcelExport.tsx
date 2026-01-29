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
                            } else if (account.startsWith('As at ')) {
                                // 副標題 - 動態日期
                                dataRow = worksheet.addRow([account, '', ''])
                                dataRow.font = { size: 12 }
                                dataRow.alignment = { horizontal: 'left' }
                            } else if (currentPeriod === 'Current Period') {
                                // 欄位標題
                                dataRow = worksheet.addRow(['', currentPeriod, yearToDate])
                                dataRow.font = { bold: true, size: 11 }
                                dataRow.alignment = { horizontal: 'center' }
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

                } else if (params.action === 'trial_balance') {
                    // 處理 Trial Balance 格式
                    let rowIndex = 1

                    reportData.forEach((row: any) => {
                        const category = row.Category || ''
                        const accountName = row['Account Name'] || ''
                        const no = row['No.'] ?? ''
                        const attribute = row['Attribute'] ?? ''
                        const beginningBalanceDebit = row['Beginning Balance Debit']
                        const beginningBalanceCredit = row['Beginning Balance Credit']
                        const spacer1 = row['Spacer 1'] ?? ''
                        const thisPeriodDebit = row['This Period Debit']
                        const thisPeriodCredit = row['This Period Credit']
                        const spacer2 = row['Spacer 2'] ?? ''
                        const endingBalanceDebit = row['Ending Balance Debit']
                        const endingBalanceCredit = row['Ending Balance Credit']

                        // 根據類別設定不同的格式
                        let dataRow: ExcelJS.Row | undefined

                        if (category === 'HEADER') {
                            if (accountName === 'TRIAL BALANCE') {
                                // 主標題 - 在 D-K 欄（第3-11列）中置中對齊（添加了 No. 和 Attribute 兩列，以及兩個 Spacer）
                                dataRow = worksheet.addRow([
                                    no || '',
                                    attribute || '',
                                    accountName,
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    ''
                                ])
                                dataRow.font = { bold: true, size: 14 }
                                // 合併 D-K 欄（第3-11列，從 Account Name 到 Ending Balance Credit，包含兩個 Spacer）
                                worksheet.mergeCells(dataRow.number, 3, dataRow.number, 11)
                                dataRow.getCell(3).alignment = { horizontal: 'center' as const, vertical: 'middle' as const }
                            } else if (accountName.startsWith('For Period :')) {
                                // 副標題 - 在 D-K 欄（第3-11列）中置中對齊（添加了兩個 Spacer）
                                dataRow = worksheet.addRow([
                                    no || '',
                                    attribute || '',
                                    accountName,
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    '',
                                    ''
                                ])
                                dataRow.font = { size: 12 }
                                // 合併 D-K 欄（第3-11列，從 Account Name 到 Ending Balance Credit，包含兩個 Spacer）
                                worksheet.mergeCells(dataRow.number, 3, dataRow.number, 11)
                                dataRow.getCell(3).alignment = { horizontal: 'center' as const, vertical: 'middle' as const }
                            } else if ((typeof beginningBalanceDebit === 'string' && beginningBalanceDebit.startsWith('BEGINNING BALANCE Until')) ||
                                (typeof thisPeriodDebit === 'string' && thisPeriodDebit === 'THIS PERIOD') ||
                                (typeof endingBalanceDebit === 'string' && endingBalanceDebit === 'ENDING BALANCE')) {
                                // 欄位標題行 - 靠左對齊，文字可以超出儲存格 - 使用後端返回的值
                                // 保持 "BEGINNING BALANCE Until" 在後端返回的原始位置（第4列），然後合併 D-E 列（第4-5列）
                                dataRow = worksheet.addRow([
                                    no || '',
                                    attribute || '',
                                    accountName || '',
                                    beginningBalanceDebit || '',
                                    beginningBalanceCredit || '',
                                    spacer1 || '',
                                    thisPeriodDebit || '',
                                    thisPeriodCredit || '',
                                    spacer2 || '',
                                    endingBalanceDebit || '',
                                    endingBalanceCredit || ''
                                ])
                                dataRow.font = { bold: true, size: 11 }

                                // 合併 D-E 列（第4-5列），讓 "BEGINNING BALANCE Until +日期" 可以延伸到右邊
                                if (typeof beginningBalanceDebit === 'string' && beginningBalanceDebit.startsWith('BEGINNING BALANCE Until')) {
                                    worksheet.mergeCells(dataRow.number, 4, dataRow.number, 5)
                                    // 確保合併後的儲存格靠左對齊，文字從第4列開始顯示
                                    const mergedCell = dataRow.getCell(4)
                                    mergedCell.value = beginningBalanceDebit
                                    mergedCell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: false }
                                }
                                // 合併第七列和第八列，讓 "THIS PERIOD" 可以延伸到右邊（調整了列索引，因為添加了 Spacer 1）
                                if (typeof thisPeriodDebit === 'string' && thisPeriodDebit === 'THIS PERIOD') {
                                    worksheet.mergeCells(dataRow.number, 7, dataRow.number, 8)
                                }
                                // 合併第十列和第十一列，讓 "ENDING BALANCE" 可以延伸到右邊（調整了列索引，因為添加了 Spacer 2）
                                if (typeof endingBalanceDebit === 'string' && endingBalanceDebit === 'ENDING BALANCE') {
                                    worksheet.mergeCells(dataRow.number, 10, dataRow.number, 11)
                                }

                                // 每個儲存格靠左對齊，允許文字超出
                                dataRow.eachCell((cell, colNumber) => {
                                    cell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: false }
                                })
                            } else if ((typeof beginningBalanceDebit === 'string' && beginningBalanceDebit === 'Debit') ||
                                (typeof beginningBalanceCredit === 'string' && beginningBalanceCredit === 'Credit') ||
                                (typeof thisPeriodDebit === 'string' && thisPeriodDebit === 'Debit') ||
                                (typeof thisPeriodCredit === 'string' && thisPeriodCredit === 'Credit') ||
                                (typeof endingBalanceDebit === 'string' && endingBalanceDebit === 'Debit') ||
                                (typeof endingBalanceCredit === 'string' && endingBalanceCredit === 'Credit')) {
                                // No./Attribute/Account Name/Debit/Credit 標題行 - 靠左對齊 - 使用後端返回的值
                                dataRow = worksheet.addRow([
                                    no || '',
                                    attribute || '',
                                    accountName || '',
                                    beginningBalanceDebit || '',
                                    beginningBalanceCredit || '',
                                    spacer1 || '',
                                    thisPeriodDebit || '',
                                    thisPeriodCredit || '',
                                    spacer2 || '',
                                    endingBalanceDebit || '',
                                    endingBalanceCredit || ''
                                ])
                                dataRow.font = { bold: true, size: 11 }
                                // 每個儲存格靠左對齊，允許文字超出，並添加下底線和黑色邊框
                                dataRow.eachCell((cell) => {
                                    cell.alignment = { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: false }
                                    cell.border = {
                                        bottom: { style: 'thin', color: { argb: 'FF000000' } }
                                    }
                                })
                            } else {
                                // 其他 HEADER 行（預設處理）- 使用後端返回的值
                                dataRow = worksheet.addRow([
                                    no || '',
                                    attribute || '',
                                    accountName || '',
                                    beginningBalanceDebit || '',
                                    beginningBalanceCredit || '',
                                    spacer1 || '',
                                    thisPeriodDebit || '',
                                    thisPeriodCredit || '',
                                    spacer2 || '',
                                    endingBalanceDebit || '',
                                    endingBalanceCredit || ''
                                ])
                                dataRow.font = { bold: true, size: 11 }
                                dataRow.alignment = { horizontal: 'center' }
                            }
                        } else if (category === 'EMPTY') {
                            // 空行 - 使用後端返回的值
                            dataRow = worksheet.addRow([
                                no || '',
                                attribute || '',
                                accountName || '',
                                beginningBalanceDebit || '',
                                beginningBalanceCredit || '',
                                spacer1 || '',
                                thisPeriodDebit || '',
                                thisPeriodCredit || '',
                                spacer2 || '',
                                endingBalanceDebit || '',
                                endingBalanceCredit || ''
                            ])
                        } else if (category === 'TOTAL') {
                            // 總計行 - 使用後端返回的值
                            dataRow = worksheet.addRow([
                                no || '',
                                attribute || '',
                                accountName,
                                beginningBalanceDebit,
                                beginningBalanceCredit,
                                spacer1 || '',
                                thisPeriodDebit,
                                thisPeriodCredit,
                                spacer2 || '',
                                endingBalanceDebit,
                                endingBalanceCredit
                            ])
                            dataRow.font = { bold: true, size: 11 }
                            dataRow.alignment = { horizontal: 'left' }

                            // 設定數值格式和對齊（金額欄位從第4列開始，因為前面有 No. 和 Attribute）
                            // 注意：Spacer 1 在第6列，Spacer 2 在第9列，所以需要跳過這些列
                            const amountValues = [
                                beginningBalanceDebit,    // 第4列
                                beginningBalanceCredit,   // 第5列
                                thisPeriodDebit,          // 第7列（跳過第6列 Spacer 1）
                                thisPeriodCredit,         // 第8列
                                endingBalanceDebit,       // 第10列（跳過第9列 Spacer 2）
                                endingBalanceCredit       // 第11列
                            ]
                            const amountColumnIndices = [4, 5, 7, 8, 10, 11] // 對應的列索引
                            amountValues.forEach((value: any, index: number) => {
                                if (typeof value === 'number' && dataRow) {
                                    const colIndex = amountColumnIndices[index]
                                    dataRow.getCell(colIndex).numFmt = '#,##0.00'
                                    dataRow.getCell(colIndex).alignment = { horizontal: 'right' as const }
                                }
                            })

                            // 加上邊框
                            dataRow.eachCell((cell) => {
                                cell.border = {
                                    top: { style: 'thin' },
                                    bottom: { style: 'thin' }
                                }
                            })
                        } else {
                            // 一般資料行 - 直接使用後端返回的 No. 和 Attribute
                            dataRow = worksheet.addRow([
                                no,
                                attribute,
                                accountName,
                                beginningBalanceDebit,
                                beginningBalanceCredit,
                                spacer1 || '',
                                thisPeriodDebit,
                                thisPeriodCredit,
                                spacer2 || '',
                                endingBalanceDebit,
                                endingBalanceCredit
                            ])
                            dataRow.alignment = { horizontal: 'left' }

                            // 設定數值格式和對齊（金額欄位靠右）
                            // 注意：Spacer 1 在第6列，Spacer 2 在第9列，所以需要跳過這些列
                            const amountValues = [
                                beginningBalanceDebit,    // 第4列
                                beginningBalanceCredit,   // 第5列
                                thisPeriodDebit,          // 第7列（跳過第6列 Spacer 1）
                                thisPeriodCredit,         // 第8列
                                endingBalanceDebit,       // 第10列（跳過第9列 Spacer 2）
                                endingBalanceCredit       // 第11列
                            ]
                            const amountColumnIndices = [4, 5, 7, 8, 10, 11] // 對應的列索引
                            amountValues.forEach((value: any, index: number) => {
                                if (typeof value === 'number' && dataRow) {
                                    const colIndex = amountColumnIndices[index]
                                    dataRow.getCell(colIndex).numFmt = '#,##0.00'
                                    dataRow.getCell(colIndex).alignment = { horizontal: 'right' as const }
                                }
                            })
                        }

                        // 確保 dataRow 已被創建
                        if (!dataRow) {
                            console.warn('未處理的行:', row)
                        }

                        rowIndex++
                    })

                    // 設定欄寬
                    worksheet.getColumn(1).width = 8   // No. 欄
                    worksheet.getColumn(2).width = 25  // Attribute 欄
                    worksheet.getColumn(3).width = 30  // Account Name 欄
                    worksheet.getColumn(4).width = 25  // Beginning Balance Debit 欄
                    worksheet.getColumn(5).width = 15  // Beginning Balance Credit 欄
                    worksheet.getColumn(6).width = 10   // Spacer 1 欄（空白間隔）
                    worksheet.getColumn(7).width = 18  // This Period Debit 欄
                    worksheet.getColumn(8).width = 18  // This Period Credit 欄
                    worksheet.getColumn(9).width = 10   // Spacer 2 欄（空白間隔）
                    worksheet.getColumn(10).width = 18  // Ending Balance Debit 欄
                    worksheet.getColumn(11).width = 18  // Ending Balance Credit 欄

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