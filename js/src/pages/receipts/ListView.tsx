import { useMany, CrudFilters, useExport } from '@refinedev/core'
import {
  List,
  useTable,
  EditButton,
  DeleteButton,
  ShowButton,
  ExportButton,
} from '@refinedev/antd'
import { Space, Table } from 'antd'
import { DataType, ZDataType } from './types'
import { safeParse, getTotalPremiumByDebitNote, getSortProps, getInsurerPayment } from 'utils'
import dayjs from 'dayjs'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import Filter from '../clientsSummary/Components/Filter'
import { useColumnSearch } from 'hooks'
import { useState } from 'react'
import { DataType as TRenewal } from 'pages/renewals/types'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType as TClient } from 'pages/clients/types'

export const ListView: React.FC = () => {
  const [pageSize, setPageSize] = useState(30);
  const [current, setCurrent] = useState(1);

  const { tableProps, searchFormProps } = useTable<DataType>({
    sorters: {
      initial: [
        {
          field: 'meta_value_num',
          order: 'desc',
        },
      ],
    },
    filters: {
      initial: [
        {
          field: 'meta_key',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[relation]',
          operator: 'eq',
          value: 'AND',
        },
      ] as CrudFilters,
    },
    onSearch: (values: any) => {
      const filters = [
        // {
        //   field: 'date[0]',
        //   operator: 'eq',
        //   value: values?.dateRange
        //     ? dayjs(values?.dateRange[0]?.startOf('day')).unix()
        //     : undefined,
        // },
        // {
        //   field: 'date[1]',
        //   operator: 'eq',
        //   value: values?.dateRange
        //     ? dayjs(values?.dateRange[1]?.startOf('day')).unix()
        //     : undefined,
        // },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[0][value][0]',
          operator: 'eq',
          value: values?.dateRange
            ? dayjs(values?.dateRange[0]?.startOf('day')).unix()
            : undefined,
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: values?.dateRange
            ? dayjs(values?.dateRange[1]?.endOf('day')).unix()
            : undefined,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: values?.dateRange ? 'BETWEEN' : '>',
        },
        // {
        //   field: 'meta_query[1][relation]',
        //   operator: 'eq',
        //   value: 'OR',
        // },
        // {
        //   field: 'meta_query[1][0][key]',
        //   operator: 'eq',
        //   value: 'motor_engine_no',
        // },
        // {
        //   field: 'meta_query[1][0][value]',
        //   operator: 'eq',
        //   value:
        //     values?.motor_engine_no === ''
        //       ? undefined
        //       : values?.motor_engine_no,
        // },
        // {
        //   field: 'meta_query[1][0][compare]',
        //   operator: 'eq',
        //   value: '=',
        // },
        // {
        //   field: 'meta_query[1][1][key]',
        //   operator: 'eq',
        //   value: 'motor_attr',
        // },
        // {
        //   field: 'meta_query[1][1][value]',
        //   operator: 'eq',
        //   value:
        //     values?.motor_engine_no === ''
        //       ? undefined
        //       : values?.motor_engine_no,
        // },
        // {
        //   field: 'meta_query[1][1][compare]',
        //   operator: 'eq',
        //   value: 'LIKE',
        // },
        // {
        //   field: 'meta_query[1][2][key]',
        //   operator: 'eq',
        //   value: 'chassi',
        // },
        // {
        //   field: 'meta_query[1][2][value]',
        //   operator: 'eq',
        //   value:
        //     values?.motor_engine_no === ''
        //       ? undefined
        //       : values?.motor_engine_no,
        // },
        // {
        //   field: 'meta_query[1][2][compare]',
        //   operator: 'eq',
        //   value: '=',
        // },
      ]
      return filters as CrudFilters
    },
    pagination: {
      pageSize: -1, // 一次取得所有資料
      mode: "off", // 關閉服務端分頁
    }
  })
  const parsedTableProps = safeParse<DataType>({
    tableProps,
    ZDataType: ZDataType,
  })
  // console.log('🚀 ~ parsedTableProps:', parsedTableProps);
  const { data: debitNoteData } = useMany<TDebitNote>({
    resource: 'debit_notes',
    ids:
      parsedTableProps?.dataSource?.map(
        (theRecord) => theRecord?.debit_note_id || '0',
      ) ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const debitNotes = debitNoteData?.data || []
  const { data: creditNoteData } = useMany<TDebitNote>({
    resource: 'credit_notes',
    ids:
      parsedTableProps?.dataSource?.map(
        (theRecord) => theRecord?.created_from_credit_note_id || '0',
      ) ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const creditNotes = creditNoteData?.data || []
  const { data: renewalsData } = useMany<TRenewal>({
    resource: 'renewals',
    ids:
      parsedTableProps?.dataSource?.map(
        (theRecord) => theRecord?.created_from_renewal_id || '0',
      ) ?? [],
  })
  const renewals = renewalsData?.data || []

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

  // 取得client資料
  const { data: clientData } = useMany<TClient>({
    resource: 'clients',
    ids: getInsurersIds?.map((theRecord) => theRecord?.client_id || '0') ?? [],
  })
  const clients = clientData?.data || []

  const { getColumnSearchProps } = useColumnSearch<DataType>()


  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    mapData: (item) => {
      const sourceData = item?.created_from_credit_note_id ? creditNotes : debitNotes;
      const id = item?.created_from_credit_note_id ? item?.created_from_credit_note_id : item?.debit_note_id;
      const note = sourceData.find((note) => note.id === id);

      const insurerData = insurers?.find(
        (insurer) => insurer.id === note?.insurer_id,
      )
      const insurerName = note ? insurerData?.name : ''
      let paymentToInsurer = note
        ? getInsurerPayment(
          item,
          note as TDebitNote,
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
        'id': item?.id,
        'DN/CN': note?.note_no || 'N/A',
        'Bill Date': note?.date ? dayjs.unix(note?.date as number).format('YYYY-MM-DD') : 'N/A',
        'Receipt No': item?.receipt_no,
        'Receipt Date': dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
        'Payment Date': dayjs
          .unix(item?.payment_date as number)
          .format('YYYY-MM-DD'),
        'Client Name': clientName(),
        'Policy No': policyNo(),
        'Insurer': insurerName,
        'Payment Method': item?.payment_method || 'N/A',
        'Remark': item?.remark || 'N/A',
        'Premium': item?.premium || 'N/A',
        'Payment Receiver Account': item?.payment_receiver_account || 'N/A',
        'Is Paid': item?.is_paid ? 'Yes' : 'No',
        'Payment to Insurer': paymentToInsurer.toLocaleString() || 'N/A',
        'Pay to Insurer By Bank': item?.pay_to_insurer_by_bank || 'N/A',
        'Pay to Insurer By Cheque': item?.pay_to_insurer_by_cheque || 'N/A',
        'Insurer_Invoice_No': item?.pay_to_insurer_by_invoice || 'N/A',
        'Payment Date(to Insurer)': dayjs
          .unix(item?.pay_to_insurer_by_payment_date as number)
          .format('YYYY-MM-DD'),
        'Code No': item?.code_no || 'N/A',
        'Created At': dayjs.unix(Number(item?.created_at)).format('YYYY-MM-DD HH:mm:ss'),
        'Debit Note ID': item?.debit_note_id || 'N/A',
        'Is Archived': item?.is_archived ? 'True' : 'False',
      }
    },
  })
  return (
    <List
      headerButtons={
        <ExportButton onClick={triggerExport} loading={exportLoading} />
      }
    >
      <Filter formProps={searchFormProps} isReceipts={true} />
      <Table
        {...parsedTableProps}
        //Refine的onChange會重新送出request,這邊複寫onChange,避免重新送出request
        // onChange={() => {
        //   return
        // }}
        rowKey="id"
        size="middle"
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
          title="Receipt ID."
          sorter={(a: DataType, b: DataType) => a?.receipt_no?.localeCompare(b?.receipt_no || '') || 0}
        />
        <Table.Column
          width={120}
          dataIndex="debit_note_id"
          title="DN/CN"
          // render={(id: number) => {
          //     const debitNote = debitNotes.find((dn) => dn.id === id);
          //     return debitNote ? <>{debitNote?.note_no}</> : '';
          // }}
          {...getColumnSearchProps({
            dataIndex: 'debit_note_id',
            render: (_id, record?: DataType) => {
              // 根據 record 決定要從哪個數組中查找
              const sourceData = record?.created_from_credit_note_id ? creditNotes : debitNotes;
              const id = record?.created_from_credit_note_id ? record?.created_from_credit_note_id : record?.debit_note_id;
              const note = sourceData.find((note) => note.id === id);
              return note ? <>{note?.note_no}</> : ''
            },
            renderText: (_id, record?: DataType) => {
              const sourceData = record?.created_from_credit_note_id ? creditNotes : debitNotes;
              const id = record?.created_from_credit_note_id ? record?.created_from_credit_note_id : record?.debit_note_id;
              const note = sourceData.find((note) => note.id === id);
              return note ? (note?.note_no as string) : ''
            },
          })}
        />

        <Table.Column
          width={120}
          dataIndex="date"
          title="Date"
          render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
          {...getSortProps<DataType>('date')}
        />

        <Table.Column
          width={140}
          dataIndex="payment_date"
          title="Payment Date"
          render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
          {...getSortProps<DataType>('payment_date')}
        />
        <Table.Column dataIndex="payment_method" title="Payment Method" />
        <Table.Column dataIndex="cheque_no" title="Cheque No" />
        <Table.Column
          dataIndex="premium"
          title="Premium"
          render={(premium, record: DataType) => {
            const debitNote = debitNotes.find(
              (dn) => dn.id === record?.debit_note_id,
            )
            return premium
              ? Number(premium).toLocaleString()
              : getTotalPremiumByDebitNote(debitNote).toLocaleString()
          }}
        />
        <Table.Column dataIndex="remark" title="Remark" />
        <Table.Column dataIndex="payment_receiver_account" title="Bank" filters={[{ text: '上海商業銀行', value: '上海商業銀行' }, { text: '中國銀行', value: '中國銀行' }]}
          onFilter={(value, record: DataType) => {
            return (record?.payment_receiver_account || undefined) === value
          }} />
        <Table.Column
          width={120}
          dataIndex="id"
          title=""
          render={(id) => {
            return (
              <>
                <Space>
                  <ShowButton
                    resource="receipts"
                    type="primary"
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                  <EditButton
                    resource="receipts"
                    type="primary"
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                  <DeleteButton
                    resource="receipts"
                    type="primary"
                    danger
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                </Space>
              </>
            )
          }}
        />
      </Table>
    </List>
  )
}
