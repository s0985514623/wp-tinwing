import { useState, useMemo } from 'react'
import { useMany, CrudFilters, useExport, useLink } from '@refinedev/core'
import { List, useTable, ExportButton, useModal } from '@refinedev/antd'
import { Table, Button } from 'antd'
import { DataType, ZDataType } from 'pages/receipts/types'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType as TRenewal } from 'pages/renewals/types'
import { DataType as TClient } from 'pages/clients/types'
import {
  safeParse,
  getTotalPremiumByDebitNote,
  getInsurerPayment,
  getSortProps,
} from 'utils'
import dayjs, { Dayjs } from 'dayjs'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import Filter from '../../dashboard/Filter'
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons'
import { useColumnSearch } from 'hooks'
import { useRowSelection } from 'antd-toolkit'
import { ModalEdit } from './ModalEdit'
import { round } from 'lodash'

export const ListView: React.FC = () => {
  const { show, close, modalProps } = useModal()
  const { getColumnSearchProps } = useColumnSearch<DataType>()
  const Link = useLink()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>([
    dayjs().add(-30, 'd'),
    dayjs(),
  ])
  const [pageSize, setPageSize] = useState(30);
  const [current, setCurrent] = useState(1);
  const { selectedRowKeys, rowSelection } = useRowSelection<DataType>()

  // Receipt 資料
  const { tableProps, searchFormProps } = useTable<DataType>({
    sorters: {
      initial: [
        {
          field: 'id',
          order: 'desc',
        },
      ],
    },
    filters: {
      initial: [
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[0][value][0]',
          operator: 'eq',
          value: dateRange ? dateRange[0]?.startOf('day').unix() : undefined,
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: dateRange ? dateRange[1]?.endOf('day').unix() : undefined,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: 'BETWEEN',
        },
        {
          field: 'meta_query[1][key]',
          operator: 'eq',
          value: 'is_paid',
        },
        {
          field: 'meta_query[1][value]',
          operator: 'eq',
          value: 0,
        },
        {
          field: 'meta_query[1][compare]',
          operator: 'eq',
          value: '=',
        },
      ],
    },
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[0][value][0]',
          operator: 'eq',
          value: values?.dateRange ? values?.dateRange[0]?.startOf('day').unix() : undefined,
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: values?.dateRange ? values?.dateRange[1]?.endOf('day').unix() : undefined,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: 'BETWEEN',
        },
        {
          field: 'meta_query[1][key]',
          operator: 'eq',
          value: 'is_paid',
        },
        {
          field: 'meta_query[1][value]',
          operator: 'eq',
          value: values?.is_paid === '' ? undefined : values?.is_paid,
        },
        {
          field: 'meta_query[1][compare]',
          operator: 'eq',
          value: '=',
        },
      ]
      // console.log('🚀 ~ filters:', filters)
      return filters as CrudFilters
    },
    pagination: {
      pageSize: -1,
      mode: "off" as const,
    }
  })

  const parsedTableProps = safeParse<DataType>({
    tableProps,
    ZDataType: ZDataType,
  })
  //TODO useMany 未來要改掉變成其他方式,這樣跟get all 一樣
  // DebitNote 資料
  const { data: debitNoteData } = useMany<TDebitNote>({
    resource: 'debit_notes',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.debit_note_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const debitNotes = debitNoteData?.data || []

  // Renewal 資料
  const { data: renewalsData } = useMany<TRenewal>({
    resource: 'renewals',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.created_from_renewal_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const renewals = renewalsData?.data || []
  // CreditNote 資料
  const { data: creditNoteData } = useMany<TDebitNote>({
    resource: 'credit_notes',
    ids:
      parsedTableProps?.dataSource?.map((r) => r?.created_from_credit_note_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
  })
  const creditNotes = creditNoteData?.data || []

  //取得所有的insurer_id
  const getInsurersIds = [...debitNotes, ...renewals, ...creditNotes]
  // Insurer 資料
  const { data: insurersData } = useMany<TInsurer>({
    resource: 'insurers',
    ids: getInsurersIds?.map((theRecord) => theRecord?.insurer_id || '0') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const insurers = insurersData?.data || []
  // console.log("🚀 ~ insurers:", insurers)

  // 取得client資料
  const { data: clientData } = useMany<TClient>({
    resource: 'clients',
    ids: getInsurersIds?.map((theRecord) => theRecord?.client_id || '0') ?? [],
  })
  const clients = clientData?.data || []

  // 計算實際相關的保險公司列表（用於篩選選項）
  const relevantInsurers = useMemo(() => {
    if (!parsedTableProps?.dataSource) return []

    const insurerIds = new Set<number>()

    parsedTableProps.dataSource.forEach((record) => {
      const renewal = renewals.find(r => r.id === record.created_from_renewal_id)
      const debitNote = debitNotes.find(dn => dn.id === record.debit_note_id)
      const creditNote = creditNotes.find(cn => cn.id === record.created_from_credit_note_id)

      if (renewal?.insurer_id) {
        insurerIds.add(renewal.insurer_id)
      } else if (debitNote?.insurer_id) {
        insurerIds.add(debitNote.insurer_id)
      } else if (creditNote?.insurer_id) {
        insurerIds.add(creditNote.insurer_id)
      }
    })

    return insurers.filter(insurer => insurerIds.has(insurer.id))
  }, [parsedTableProps?.dataSource, renewals, debitNotes, insurers, creditNotes])

  //如果没有数据，就禁用导出按钮
  const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false
  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    filters: [
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'date',
      },
      {
        field: 'meta_query[0][value][0]',
        operator: 'eq',
        value: dateRange ? dateRange[0]?.startOf('day').unix() : undefined,
      },
      {
        field: 'meta_query[0][value][1]',
        operator: 'eq',
        value: dateRange ? dateRange[1]?.endOf('day').unix() : undefined,
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: 'BETWEEN',
      },
    ],
    mapData: (item) => {
      if (!item) return
      const fine_the_note = () => {
        if (item?.created_from_renewal_id) {
          const renewal = renewals.find((r) => r.id === item.created_from_renewal_id)
          return renewal
        } else if (item?.created_from_credit_note_id) {
          const creditNote = creditNotes.find((cn) => cn.id === item.created_from_credit_note_id)
          return creditNote
        } else {
          const debitNote = debitNotes.find((dn) => dn.id === item.debit_note_id)
          return debitNote
        }
      }
      const the_note = fine_the_note()
      const insurerData = insurers?.find(
        (insurer) => insurer.id === the_note?.insurer_id,
      )
      const insurerName = the_note ? insurerData?.name : ''
      const receipt = parsedTableProps?.dataSource?.find(
        (r) => r.id === item.id,
      )
      const premium =
        receipt?.premium ??
        getTotalPremiumByDebitNote(
          (
            debitNotes?.filter(
              (dn) => dn?.id === receipt?.debit_note_id,
            ) as TDebitNote[]
          )[0] ?? {},
        )
      let paymentToInsurer = the_note
        ? getInsurerPayment(
          item,
          the_note as TDebitNote,
          insurerData as TInsurer,
        )
        : 0
      if (item?.created_from_credit_note_id) {
        paymentToInsurer = -paymentToInsurer
      }
      const clientName = () => {
        if (item?.created_from_renewal_id) {
          const renewal = renewals.find((r) => r.id === item.created_from_renewal_id)
          const client = clients.find((c) => c.id === renewal?.client_id)
          return client?.company || client?.name_en || client?.name_zh
        }
        if (item?.created_from_credit_note_id) {
          const creditNote = creditNotes.find((cn) => cn.id === item.created_from_credit_note_id)
          const client = clients.find((c) => c.id === creditNote?.client_id)
          return client?.company || client?.name_en || client?.name_zh
        }
        if (item?.debit_note_id) {
          const debitNote = debitNotes.find((dn) => dn.id === item.debit_note_id)
          const client = clients.find((c) => c.id === debitNote?.client_id)
          return client?.company || client?.name_en || client?.name_zh
        }
        return 'N/A'
      }

      const policyNo = () => {
        if (item?.created_from_renewal_id) {
          const renewal = renewals.find((r) => r.id === item.created_from_renewal_id)
          return renewal?.policy_no
        }
        if (item?.created_from_credit_note_id) {
          const creditNote = creditNotes.find((cn) => cn.id === item.created_from_credit_note_id)
          return creditNote?.policy_no
        }
        if (item?.debit_note_id) {
          const debitNote = debitNotes.find((dn) => dn.id === item.debit_note_id)
          return debitNote?.policy_no
        }
        return 'N/A'
      }
      return {
        'Receipt No': item?.receipt_no,
        'Receipt Date': dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
        'Client Name': clientName(),
        'Policy No': policyNo(),
        Insurer: insurerName,
        Premium: Number(premium).toLocaleString(),
        'Payment to Insurer': Number(paymentToInsurer).toLocaleString(),
        Paid: item.is_paid ? 'Yes' : 'No',
        Bank: item.is_paid ? item.pay_to_insurer_by_bank : '',
        'Cheque No': item.pay_to_insurer_by_cheque,
        'Invoice No': item.pay_to_insurer_by_invoice,
        'Payment Date': item.pay_to_insurer_by_payment_date
          ? dayjs.unix(item.pay_to_insurer_by_payment_date).format('YYYY-MM-DD')
          : '',
        Remark: item.remark,
      }
    },
  })

  // 計算已選單的 Payment to Insurer 總金額
  const selectedInsurers = selectedRowKeys.map((id) => {
    const receipt = parsedTableProps?.dataSource?.find((r) => r.id === id)
    const debitNote = debitNotes.find((dn) => dn.id === receipt?.debit_note_id)
    const renewal = renewals.find(
      (r) => r.id === receipt?.created_from_renewal_id,
    )
    const creditNote = creditNotes.find((cn) => cn.id === receipt?.created_from_credit_note_id)
    const insurerData = insurers?.find((insurer) => {
      if (renewal) {
        return insurer.id === renewal.insurer_id
      } else if (creditNote) {
        return insurer.id === creditNote.insurer_id
      } else {
        return insurer.id === debitNote?.insurer_id
      }
    })
    const paymentToInsurer = insurerData
      ? getInsurerPayment(
        receipt as DataType,
        renewal ?? (creditNote as TDebitNote) ?? (debitNote as TDebitNote),
        insurerData as TInsurer,
      )
      : 0
    if (creditNote) {
      return -paymentToInsurer
    }
    return paymentToInsurer
  })
  // console.log('🚀 ~ selectedInsurers ~ selectedInsurers:', selectedInsurers)
  return (
    <>
      <ModalEdit
        modalProps={modalProps}
        selectedRowKeys={selectedRowKeys}
        close={close}
        paymentToInsurer={selectedInsurers}
      />
      <List
        headerButtons={
          <>
            <Button
              size="small"
              type="primary"
              onClick={show}
              disabled={selectedRowKeys.length == 0}
            >
              Quick Edits
            </Button>
            <Filter
              dateRange={dateRange}
              setDateRange={setDateRange}
              formProps={searchFormProps}
            />
            <Button
              size="small"
              type="primary"
              onClick={() => searchFormProps.onFinish?.({ is_paid: 1 })}
            >
              Paid
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => searchFormProps.onFinish?.({ is_paid: 0 })}
            >
              Unpaid
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => searchFormProps.onFinish?.({ is_paid: undefined })}
            >
              Show All
            </Button>
            <Button
              size="small"
              type="primary"
              // is_paid: 2 是永遠不會有的值，用來當作無資料查詢
              onClick={() => searchFormProps.onFinish?.({ is_paid: 2 })}
            >
              Show None
            </Button>
            <ExportButton
              onClick={triggerExport}
              loading={exportLoading}
              disabled={disabledBtn}
            />
          </>
        }
      >
        <Table
          {...parsedTableProps}
          rowKey="id"
          size="middle"
          rowSelection={rowSelection}
          summary={(pageData) => {
            const paymentToInsurer = selectedInsurers.reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0,
            )
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}></Table.Summary.Cell>
                <Table.Summary.Cell index={3}></Table.Summary.Cell>
                <Table.Summary.Cell index={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={5}></Table.Summary.Cell>
                <Table.Summary.Cell index={6}>總計</Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  {round(paymentToInsurer, 2).toLocaleString()}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
          pagination={{
            current: current,
            pageSize: pageSize,
            total: parsedTableProps?.dataSource?.length || 0,
            showSizeChanger: true,
            onChange: (current, pageSize) => {
              setCurrent(current);
              setPageSize(pageSize);
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        >
          <Table.Column
            width={120}
            dataIndex="receipt_no"
            title="Note No."
            {...getColumnSearchProps({
              dataIndex: 'receipt_no',
            })}
            // {...getSortProps<DataType>('receipt_no')}
            // 複寫render方法
            render={(renderReceiptNo: number, record: DataType) => {
              //取得receipt_no, 如果沒有則顯示id
              const receipt_no = parsedTableProps?.dataSource?.find(
                (r) => r.id === record?.id,
              )?.receipt_no
              return (
                <Link to={`/receipts/show/${record?.id}`}>
                  {receipt_no ?? record?.id}
                </Link>
              )
            }}
            sorter={(a: DataType, b: DataType) => {
              const a_note = a.receipt_no ?? a.id.toString()
              const b_note = b.receipt_no ?? b.id.toString()
              return a_note.localeCompare(b_note)
            }}
          />
          <Table.Column
            width={120}
            title="Client Name"
            {...getColumnSearchProps({
              dataIndex: 'id',
              //複寫render方法
              render: (_text: string | number, _record?: DataType) => {
                if (!_record) return ''
                if (_record.created_from_renewal_id) {
                  const renewal = renewals.find((r) => r.id === _record.created_from_renewal_id)
                  const client = clients.find((c) => c.id === renewal?.client_id)
                  return client?.company || client?.name_en || client?.name_zh
                } else if (_record.created_from_credit_note_id) {
                  const creditNote = creditNotes.find((cn) => cn.id === _record.created_from_credit_note_id)
                  const client = clients.find((c) => c.id === creditNote?.client_id)
                  return client?.company || client?.name_en || client?.name_zh
                } else if (_record.debit_note_id) {
                  const debitNote = debitNotes.find((dn) => dn.id === _record.debit_note_id)
                  const client = clients.find((c) => c.id === debitNote?.client_id)
                  return client?.company || client?.name_en || client?.name_zh
                }
                return ''
              },
              renderText: (_text: string | number, _record?: DataType) => {
                if (_record?.created_from_renewal_id) {
                  const renewal = renewals.find((r) => r.id === _record.created_from_renewal_id)
                  const client = clients.find((c) => c.id === renewal?.client_id)
                  return client?.company || client?.name_en || client?.name_zh || ''
                } else if (_record?.created_from_credit_note_id) {
                  const creditNote = creditNotes.find((cn) => cn.id === _record.created_from_credit_note_id)
                  const client = clients.find((c) => c.id === creditNote?.client_id)
                  return client?.company || client?.name_en || client?.name_zh || ''
                } else if (_record?.debit_note_id) {
                  const debitNote = debitNotes.find((dn) => dn.id === _record.debit_note_id)
                  const client = clients.find((c) => c.id === debitNote?.client_id)
                  return client?.company || client?.name_en || client?.name_zh || ''
                }
                return ''
              }
            })}
            sorter={(a: DataType, b: DataType) => {
              //取得a company name 
              let aName = ''
              let bName = ''
              if (a.created_from_renewal_id) {
                const renewal = renewals.find((r) => r.id === a.created_from_renewal_id)
                const client = clients.find((c) => c.id === renewal?.client_id)
                aName = client?.company || client?.name_en || client?.name_zh || ''
              } else if (a.created_from_credit_note_id) {
                const creditNote = creditNotes.find((cn) => cn.id === a.created_from_credit_note_id)
                const client = clients.find((c) => c.id === creditNote?.client_id)
                aName = client?.company || client?.name_en || client?.name_zh || ''
              } else if (a.debit_note_id) {
                const debitNote = debitNotes.find((dn) => dn.id === a.debit_note_id)
                const client = clients.find((c) => c.id === debitNote?.client_id)
                aName = client?.company || client?.name_en || client?.name_zh || ''
              }
              if (b.created_from_renewal_id) {
                const renewal = renewals.find((r) => r.id === b.created_from_renewal_id)
                const client = clients.find((c) => c.id === renewal?.client_id)
                bName = client?.company || client?.name_en || client?.name_zh || ''
              } else if (b.created_from_credit_note_id) {
                const creditNote = creditNotes.find((cn) => cn.id === b.created_from_credit_note_id)
                const client = clients.find((c) => c.id === creditNote?.client_id)
                bName = client?.company || client?.name_en || client?.name_zh || ''
              } else if (b.debit_note_id) {
                const debitNote = debitNotes.find((dn) => dn.id === b.debit_note_id)
                const client = clients.find((c) => c.id === debitNote?.client_id)
                bName = client?.company || client?.name_en || client?.name_zh || ''
              }
              // 空值永遠排到最後
              if (!aName && bName) return 1
              if (aName && !bName) return -1
              if (!aName && !bName) return 0

              return aName.localeCompare(bName)
            }}
          />
          <Table.Column
            width={120}
            title="Policy Number"
            {...getColumnSearchProps({
              dataIndex: 'id',
              //複寫render方法
              render: (_text: string | number, _record?: DataType) => {
                if (!_record) return ''
                if (_record.created_from_renewal_id) {
                  const renewal = renewals.find((r) => r.id === _record.created_from_renewal_id)
                  return renewal?.policy_no || ''
                } else if (_record.created_from_credit_note_id) {
                  const creditNote = creditNotes.find((cn) => cn.id === _record.created_from_credit_note_id)
                  return creditNote?.policy_no || ''
                } else if (_record.debit_note_id) {
                  const debitNote = debitNotes.find((dn) => dn.id === _record.debit_note_id)
                  return debitNote?.policy_no || ''
                }
                return ''
              },
              renderText: (_text: string | number, _record?: DataType) => {
                if (_record?.created_from_renewal_id) {
                  const renewal = renewals.find((r) => r.id === _record.created_from_renewal_id)
                  return renewal?.policy_no || ''
                } else if (_record?.created_from_credit_note_id) {
                  const creditNote = creditNotes.find((cn) => cn.id === _record.created_from_credit_note_id)
                  return creditNote?.policy_no || ''
                } else if (_record?.debit_note_id) {
                  const debitNote = debitNotes.find((dn) => dn.id === _record.debit_note_id)
                  return debitNote?.policy_no || ''
                }
                return ''
              }
            })}
            sorter={(a: DataType, b: DataType) => {
              //取得a company name 
              let aName = ''
              let bName = ''
              if (a.created_from_renewal_id) {
                const renewal = renewals.find((r) => r.id === a.created_from_renewal_id)
                aName = renewal?.policy_no || ''
              } else if (a.created_from_credit_note_id) {
                const creditNote = creditNotes.find((cn) => cn.id === a.created_from_credit_note_id)
                aName = creditNote?.policy_no || ''
              } else if (a.debit_note_id) {
                const debitNote = debitNotes.find((dn) => dn.id === a.debit_note_id)
                aName = debitNote?.policy_no || ''
              }
              if (b.created_from_renewal_id) {
                const renewal = renewals.find((r) => r.id === b.created_from_renewal_id)
                bName = renewal?.policy_no || ''
              } else if (b.created_from_credit_note_id) {
                const creditNote = creditNotes.find((cn) => cn.id === b.created_from_credit_note_id)
                bName = creditNote?.policy_no || ''
              } else if (b.debit_note_id) {
                const debitNote = debitNotes.find((dn) => dn.id === b.debit_note_id)
                bName = debitNote?.policy_no || ''
              }
              // 空值永遠排到最後
              if (!aName && bName) return 1
              if (aName && !bName) return -1
              if (!aName && !bName) return 0

              return aName.localeCompare(bName)
            }}
          />
          <Table.Column
            width={120}
            dataIndex="date"
            title="Note Date"
            render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
            {...getSortProps<DataType>('date')}
          />
          <Table.Column
            width={120}
            title="Insurer"
            render={(id: number, record: DataType) => {
              const renewal = renewals.find(
                (r) => r.id === record.created_from_renewal_id,
              )
              const debitNote = debitNotes.find(
                (dn) => dn.id === record.debit_note_id,
              )
              const creditNote = creditNotes.find(
                (cn) => cn.id === record.created_from_credit_note_id,
              )
              const haveData = Boolean(renewal) || Boolean(debitNote) || Boolean(creditNote)
              const insurerData = insurers?.find((insurer) => {
                if (creditNote) {
                  return insurer.id === creditNote.insurer_id
                } else if (renewal) {
                  return insurer.id === renewal.insurer_id
                } else {
                  return insurer.id === debitNote?.insurer_id
                }
              })
              return haveData ? <>{insurerData?.name}</> : ''
            }}
            filters={relevantInsurers.map((insurer) => ({
              text: insurer?.name,
              value: insurer?.id,
            }))}
            onFilter={(value, record) => {
              // value = insurer.id
              const renewal = renewals.find(
                (r) => r.id === record.created_from_renewal_id,
              )
              const debitNote = debitNotes.find(
                (dn) => dn.id === record.debit_note_id,
              )
              const creditNote = creditNotes.find(
                (cn) => cn.id === record.created_from_credit_note_id,
              )
              // 如果兩個都沒有值，就不顯示
              if (!renewal && !debitNote && !creditNote) return false

              // 比對 insurer_id
              const insurerId = creditNote?.insurer_id ?? renewal?.insurer_id ?? debitNote?.insurer_id
              return insurerId === value
            }}
          />
          <Table.Column
            width={120}
            dataIndex="id"
            title="Premium"
            render={(id: number) => {
              const receipt = parsedTableProps?.dataSource?.find(
                (r) => r.id === id,
              )
              const premium =
                receipt?.premium ??
                getTotalPremiumByDebitNote(
                  (
                    debitNotes?.filter(
                      (debitNote) => debitNote?.id === receipt?.debit_note_id,
                    ) as TDebitNote[]
                  )[0] ?? {},
                )

              return Number(premium).toLocaleString()
            }}
          />
          <Table.Column
            width={120}
            dataIndex="id"
            title="Payment to Insurer"
            render={(id: number, record: DataType) => {
              // console.log("🚀 ~ record:", record)
              const debitNote = debitNotes.find(
                (dn) => dn.id === record.debit_note_id,
              )
              const renewal = renewals.find(
                (r) => r.id === record.created_from_renewal_id,
              )
              // console.log("🚀 ~ renewal:", renewal)
              const creditNote = creditNotes.find(
                (cn) => cn.id === record.created_from_credit_note_id,
              )
              // console.log("🚀 ~ creditNote:", creditNote)
              const insurer = insurersData?.data?.find((insurer) => {
                if (creditNote) {
                  return insurer.id === creditNote.insurer_id
                } else if (renewal) {
                  return insurer.id === renewal.insurer_id
                } else {
                  return insurer.id === debitNote?.insurer_id
                }
              })
              // console.log("🚀 ~ insurer ~ insurer:", insurer)
              let premium = insurer
                ? getInsurerPayment(
                  record,
                  creditNote ?? renewal ?? (debitNote as TDebitNote),
                  insurer as TInsurer,
                )
                : 0
              if (creditNote) {
                //premium為負數
                premium = -premium
              }
              // console.log("🚀 ~ premium:", premium)
              return Number(premium).toLocaleString()
            }}
          />
          <Table.Column
            width={120}
            dataIndex="pay_to_insurer_by_invoice"
            title="Invoice No"
            {...getColumnSearchProps({
              dataIndex: 'pay_to_insurer_by_invoice',
            })}
            {...getSortProps<DataType>('pay_to_insurer_by_invoice')}
          />

          <Table.Column
            width={120}
            dataIndex="pay_to_insurer_by_cheque"
            title="Cheque No"
            {...getColumnSearchProps({
              dataIndex: 'pay_to_insurer_by_cheque',
            })}
            {...getSortProps<DataType>('pay_to_insurer_by_cheque')}
          />
          <Table.Column
            width={120}
            dataIndex="pay_to_insurer_by_bank"
            title="Bank"
            render={(payment_receiver_account: string, record: DataType) => {
              if (record.is_paid) {
                return payment_receiver_account
              }
            }}
          />
          {/* <Table.Column width={120} dataIndex="remark" title="Remark" /> */}
          <Table.Column
            width={120}
            dataIndex="pay_to_insurer_by_payment_date"
            title="Payment Date"
            render={(date: number) =>
              date ? dayjs.unix(date).format('YYYY-MM-DD') : ''
            }
            {...getSortProps<DataType>('pay_to_insurer_by_payment_date')}
          />
          <Table.Column
            width={120}
            dataIndex="is_paid"
            title="Paid"
            render={(is_paid: boolean) => {
              return is_paid ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : (
                <CloseCircleTwoTone twoToneColor="red" />
              )
            }}
          />
          {/* 編輯按鈕 */}
          {/* <Table.Column
            width={120}
            dataIndex="id"
            title=""
            render={(id) => {
              return (
                <>
                  <Space>
                    <EditButton
                      type="primary"
                      hideText
                      shape="circle"
                      size="small"
                      recordItemId={id}
                      resource="insurer_payment_record"
                    />
                  </Space>
                </>
              )
            }}
          /> */}
        </Table>
      </List>
    </>
  )
}
