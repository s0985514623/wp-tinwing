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
import { safeParse, getTotalPremiumByDebitNote, getSortProps } from 'utils'
import dayjs from 'dayjs'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import Filter from '../clientsSummary/Components/Filter'
import { useColumnSearch } from 'hooks'

export const ListView: React.FC = () => {
  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    mapData: (item) => {
      return {
        ...item,
        date: dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
        payment_date: dayjs
          .unix(item?.payment_date as number)
          .format('YYYY-MM-DD'),
      }
    },
  })
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
          field: 'meta_query[relation]',
          operator: 'eq',
          value: 'AND',
        },
      ] as CrudFilters,
    },
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'date[0]',
          operator: 'eq',
          value: values?.dateRange
            ? dayjs(values?.dateRange[0]?.startOf('day')).unix()
            : undefined,
        },
        {
          field: 'date[1]',
          operator: 'eq',
          value: values?.dateRange
            ? dayjs(values?.dateRange[1]?.startOf('day')).unix()
            : undefined,
        },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'motor_engine_no',
        },
        {
          field: 'meta_query[0][value]',
          operator: 'eq',
          value:
            values?.motor_engine_no === ''
              ? undefined
              : values?.motor_engine_no,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: '=',
        },
      ]
      return filters as CrudFilters
    },
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
  const { getColumnSearchProps } = useColumnSearch<DataType>()
  return (
    <List
      headerButtons={
        <ExportButton onClick={triggerExport} loading={exportLoading} />
      }
    >
      <Filter formProps={searchFormProps} />
      <Table
        {...parsedTableProps}
        //Refine的onChange會重新送出request,這邊複寫onChange,避免重新送出request
        // onChange={() => {
        //   return
        // }}
        rowKey="id"
        size="middle"
      >
        <Table.Column
          width={120}
          dataIndex="receipt_no"
          title="Receipt ID."
          {...getSortProps<DataType>('receipt_no')}
        />
        <Table.Column
          width={120}
          dataIndex="debit_note_id"
          title="Debit Note"
          // render={(id: number) => {
          //     const debitNote = debitNotes.find((dn) => dn.id === id);
          //     return debitNote ? <>{debitNote?.note_no}</> : '';
          // }}
          {...getColumnSearchProps({
            dataIndex: 'debit_note_id',
            render: (id) => {
              const debitNote = debitNotes.find((dn) => dn.id === id)
              return debitNote ? <>{debitNote?.note_no}</> : ''
            },
            renderText: (id) => {
              const debitNote = debitNotes.find((dn) => dn.id === id)
              return debitNote ? (debitNote?.note_no as string) : ''
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
        <Table.Column dataIndex="code_no" title="Code No" />
        <Table.Column dataIndex="payment_receiver_account" title="Bank" />
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
