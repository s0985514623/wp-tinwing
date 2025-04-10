import { useState } from 'react'
import { useMany, CrudFilters, useExport, useLink } from '@refinedev/core'
import { List, useTable, ExportButton, useModal } from '@refinedev/antd'
import { Table, Button } from 'antd'
import { DataType, ZDataType } from 'pages/receipts/types'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType as TRenewal } from 'pages/renewals/types'
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

export const ListView: React.FC = () => {
  const { show, close, modalProps } = useModal()
  const { getColumnSearchProps } = useColumnSearch<DataType>()
  const Link = useLink()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().add(-30, 'd'),
    dayjs(),
  ])

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
          field: 'date[0]',
          operator: 'eq',
          value: dateRange ? dateRange[0] : undefined,
        },
        {
          field: 'date[1]',
          operator: 'eq',
          value: dateRange ? dateRange[1] : undefined,
        },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'is_paid',
        },
        {
          field: 'meta_query[0][value]',
          operator: 'eq',
          value: 0,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: '=',
        },
      ],
    },
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'date[0]',
          operator: 'eq',
          value: values?.dateRange ? dayjs(values?.dateRange[0]) : undefined,
        },
        {
          field: 'date[1]',
          operator: 'eq',
          value: values?.dateRange ? dayjs(values?.dateRange[1]) : undefined,
        },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'is_paid',
        },
        {
          field: 'meta_query[0][value]',
          operator: 'eq',
          value: values?.is_paid === '' ? undefined : values?.is_paid,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: '=',
        },
      ]
      // console.log('🚀 ~ filters:', filters)
      return filters as CrudFilters
    },
		pagination:{
			pageSize: 30,
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

  //取得所有的insurer_id
  const getInsurersIds = [...debitNotes, ...renewals]
  // Insurer 資料
  const { data: insurersData } = useMany<TInsurer>({
    resource: 'insurers',
    ids: getInsurersIds?.map((theRecord) => theRecord?.insurer_id || '0') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const insurers = insurersData?.data || []

  //如果没有数据，就禁用导出按钮
  const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false
  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    filters: dateRange
      ? [
          {
            field: 'date[0]',
            operator: 'eq',
            value: dateRange[0].startOf('day').unix(),
          },
          {
            field: 'date[1]',
            operator: 'eq',
            value: dateRange[1].startOf('day').unix(),
          },
        ]
      : undefined,
    mapData: (item) => {
      if (!item) return
      const note_no =
        parsedTableProps?.dataSource?.find((r) => r.id === item.id)
          ?.receipt_no ?? item.id
      const noteDate = dayjs.unix(item?.date as number).format('YYYY-MM-DD')
      const debitNote = debitNotes.find((dn) => dn.id === item.debit_note_id)
      const insurerData = insurers?.find(
        (insurer) => insurer.id === debitNote?.insurer_id,
      )
      const insurerName = debitNote ? insurerData?.name : ''
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
      const paymentToInsurer = debitNote
        ? getInsurerPayment(
            item,
            debitNote as TDebitNote,
            insurerData as TInsurer,
          )
        : 0
      return {
        'Note No': `'${note_no}'`, //加上單引號才不會被省略前導0
        'Note Date': noteDate,
        Insurer: insurerName,
        Premium: Number(premium).toLocaleString(),
        'Payment to Insurer': Number(paymentToInsurer).toLocaleString(),
        Paid: item.is_paid ? 'Yes' : 'No',
        Bank: item.payment_receiver_account,
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
    const insurerData = insurers?.find((insurer) => {
      if (renewal) {
        return insurer.id === renewal.insurer_id
      } else {
        return insurer.id === debitNote?.insurer_id
      }
    })
    const paymentToInsurer = insurerData
      ? getInsurerPayment(
          receipt as DataType,
          renewal ?? (debitNote as TDebitNote),
          insurerData as TInsurer,
        )
      : 0

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
                <Table.Summary.Cell index={4}>總計</Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  {paymentToInsurer}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        >
          <Table.Column
            width={120}
            dataIndex="receipt_no"
            title="Note No."
            {...getColumnSearchProps({
              dataIndex: 'receipt_no',
            })}
            {...getSortProps<DataType>('receipt_no')}
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
          />

          <Table.Column
            width={120}
            dataIndex="date"
            title="Note Date"
            render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
          />
          <Table.Column
            width={120}
            dataIndex="id"
            title="Insurer"
            render={(id: number, record: DataType) => {
              const renewal = renewals.find(
                (r) => r.id === record.created_from_renewal_id,
              )
              const debitNote = debitNotes.find(
                (dn) => dn.id === record.debit_note_id,
              )
              const haveData = Boolean(renewal) || Boolean(debitNote)
              const insurerData = insurers?.find((insurer) => {
                if (renewal) {
                  return insurer.id === renewal.insurer_id
                } else {
                  return insurer.id === debitNote?.insurer_id
                }
              })
              return haveData ? <>{insurerData?.name}</> : ''
            }}
            filters={insurers.map((insurer) => ({
              text: insurer?.name,
              value: insurer?.id,
            }))}
            onFilter={(value, record) => {
              // value = insurer.id
              const isFromRenewal = Boolean(record.created_from_renewal_id)
              const isFromDebitNote = Boolean(record.debit_note_id)
              // 如果兩個都沒有值，就不顯示
              if (!isFromRenewal && !isFromRenewal) return false
              // 如果是從renewal來的，就比對renewal的insurer_id
              if (isFromRenewal) {
                const renewal = renewals.find(
                  (r) => r.id === record.created_from_renewal_id,
                )
                return renewal?.insurer_id === value
              }
              // 如果是從debitNote來的，就比對debitNote的insurer_id
              if (isFromDebitNote) {
                const debitNote = debitNotes.find(
                  (dn) => dn.id === record?.debit_note_id,
                )
                return debitNote?.insurer_id === value
              }
              return false
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
              const debitNote = debitNotes.find(
                (dn) => dn.id === record.debit_note_id,
              )
              const renewal = renewals.find(
                (r) => r.id === record.created_from_renewal_id,
              )
              const insurer = insurersData?.data?.find((insurer) => {
                if (renewal) {
                  return insurer.id === renewal.insurer_id
                } else {
                  return insurer.id === debitNote?.insurer_id
                }
              })
              const premium = insurer
                ? getInsurerPayment(
                    record,
                    renewal ?? (debitNote as TDebitNote),
                    insurer as TInsurer,
                  )
                : 0
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
                      resource="receipts_record"
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
