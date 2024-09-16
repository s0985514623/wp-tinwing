import { useMany, HttpError, CrudFilters, CrudSorting } from '@refinedev/core'
import { useTable } from '@refinedev/antd'
import { Table } from 'antd'
import { DataType } from 'pages/debitNotes/types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TTerm } from 'pages/terms/types'
import { DataType as TRenewals } from 'pages/renewals/types'
import { getSortProps } from 'utils'
import dayjs from 'dayjs'
import DetailTable from './Components/DetailTable'
import { useColumnSearch } from 'hooks'
import Filter from './Components/Filter'

//設定排序與篩選初始化與搜尋條件
const termOptions = {
  sorters: {
    initial: [
      {
        field: 'date',
        order: 'desc',
      },
    ] as CrudSorting,
  },
  filters: {
    initial: [
      {
        field: 'meta_query[relation]',
        operator: 'eq',
        value: 'AND',
      },
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'is_archived',
      },
      {
        field: 'meta_query[0][value]',
        operator: 'eq',
        value: 0,
      },
      {
        field: 'meta_query[0][type]',
        operator: 'eq',
        value: 'NUMERIC',
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: '=',
      },
      {
        field: 'meta_query[1][key]',
        operator: 'eq',
        value: 'period_of_insurance_to',
      },
      {
        field: 'meta_query[1][value]',
        operator: 'eq',
        value: dayjs('2022-01-01').unix(),
      },
      {
        field: 'meta_query[1][compare]',
        operator: 'eq',
        value: '>',
      },
      {
        field: 'meta_query[1][type]',
        operator: 'eq',
        value: 'NUMERIC',
      },
    ] as CrudFilters,
  },
  onSearch: (values: any) => {
    // console.log("🚀 ~ values:", values)
    const filters = [
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'is_archived',
      },
      {
        field: 'meta_query[0][value]',
        operator: 'eq',
        value: values?.is_archived.toLowerCase() === 'true' ? 1 : 0,
      },
      {
        field: 'meta_query[0][type]',
        operator: 'eq',
        value: 'NUMERIC',
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: '=',
      },
      {
        field: 'meta_query[1][key]',
        operator: 'eq',
        value: 'period_of_insurance_to',
      },
      {
        field: 'meta_query[1][value][0]',
        operator: 'eq',
        value: values?.dateRange
          ? dayjs(values?.dateRange[0]?.startOf('day')).unix()
          : undefined,
      },
      {
        field: 'meta_query[1][value][1]',
        operator: 'eq',
        value: values?.dateRange
          ? dayjs(values?.dateRange[1]?.startOf('day')).unix()
          : undefined,
      },
      {
        field: 'meta_query[1][compare]',
        operator: 'eq',
        value: values?.dateRange ? 'BETWEEN' : '>',
      },
      {
        field: 'meta_query[2][key]',
        operator: 'eq',
        value: 'motor_engine_no',
      },
      {
        field: 'meta_query[2][value]',
        operator: 'eq',
        value:
          values?.motor_engine_no === '' ? undefined : values?.motor_engine_no,
      },
      {
        field: 'meta_query[2][compare]',
        operator: 'eq',
        value: '=',
      },
    ]
    return filters as CrudFilters
  },
}

export const ListView: React.FC = () => {
  //取得renewals的資料
  const { tableProps: renewalData, searchFormProps: renewalSearchForm } =
    useTable<TRenewals, HttpError>({
      resource: 'renewals',
      ...termOptions,
    })
  // console.log('🚀 ~ renewalData:', renewalData);
  //取得debit_notes的資料
  const { tableProps, searchFormProps } = useTable<DataType, HttpError>({
    resource: 'debit_notes',
    ...termOptions,
  })
  // console.log('🚀 ~ tableProps:', tableProps);
  //合併renewals 與 debit_notes資料
  const formatTableData = [
    ...(renewalData?.dataSource ?? []),
    ...(tableProps?.dataSource ?? []),
  ]
  // console.log('🚀 ~ formatTableData:', formatTableData)
  const formatSearchFormProps = {
    ...renewalSearchForm,
    ...searchFormProps,
    onFinish: async (values: any) => {
      if (renewalSearchForm?.onFinish && searchFormProps?.onFinish) {
        renewalSearchForm?.onFinish(values)
        searchFormProps?.onFinish(values)
      }
    },
  }
  const debitNotesResult = tableProps?.dataSource
  const debitNotes = (debitNotesResult || []) as DataType[]

  const templatesOptions = [
    {
      text: 'General',
      value: 'general',
    },
    {
      text: 'Motor',
      value: 'motor',
    },
    {
      text: 'Short Terms',
      value: 'shortTerms',
    },
    {
      text: 'Others',
      value: 'others',
    },
  ]

  const { data: termData, isLoading: _termIsLoading } = useMany({
    resource: 'terms',
    ids: debitNotes?.map((theRecord) => theRecord?.term_id || '0') ?? [],
    queryOptions: {
      enabled: debitNotes.length > 0,
    },
  })
  const terms = (termData?.data || []) as TTerm[]

  const { data: clientData, isLoading: clientIsLoading } = useMany({
    resource: 'clients',
    ids: formatTableData?.map((theRecord) => theRecord?.client_id || '0') ?? [],
    queryOptions: {
      enabled: formatTableData.length > 0,
    },
  })
  const clients = (clientData?.data || []) as TClient[]

  const { getColumnSearchProps } = useColumnSearch<DataType>()

  return (
    <>
      <Filter formProps={formatSearchFormProps} />
      <Table
        {...{
          dataSource: formatTableData,
          expandable: {
            expandedRowRender: (record: any) => {
              const theTerm = terms.find((term) => term.id === record.term_id)
              return <DetailTable record={record} term={theTerm} />
            },
          },
        }}
        rowKey={(record) => `${record.date}-${record.id}`}
        size="middle"
      >
        <Table.Column
          dataIndex="template"
          title="Type"
          render={(value) =>
            templatesOptions.find((item) => item.value === value)?.text
          }
          filters={templatesOptions}
          onFilter={(value, record: DataType) => {
            if (value === 'others')
              return (
                record?.template !== 'general' &&
                record?.template !== 'motor' &&
                record?.template !== 'shortTerms'
              )
            return (record?.template || undefined) === value
          }}
        />
        <Table.Column
          dataIndex="note_no"
          title="Note No."
          {...getColumnSearchProps({
            dataIndex: 'note_no',
          })}
        />
        <Table.Column
          dataIndex="client_id"
          title="Client No"
          {...getSortProps<DataType>('client_id')}
          {...getColumnSearchProps({
            dataIndex: 'client_id',
            render: (client_id) => {
              const client_number =
                clients.find((client) => client.id === client_id)
                  ?.client_number || 'N/A'
              return clientIsLoading && !client_number
                ? ((<>Loading...</>) as React.ReactNode)
                : (client_number.toString() as React.ReactNode)
            },
            renderText: (client_id) => {
              const client_number =
                clients.find((client) => client.id === client_id)
                  ?.client_number || 'N/A'
              return clientIsLoading && !client_number
                ? ''
                : (client_number.toString() as string)
            },
          })}
        />

        <Table.Column
          dataIndex="created_at"
          title="Display Name"
          {...getColumnSearchProps({
            dataIndex: 'created_at',
            render: (_, record) => {
              const client_id = record?.client_id || 0
              const theClient =
                clients.find((client) => client.id === client_id) ||
                defaultClient
              const display_nameDataIndex = theClient?.display_name || 'name_en'
              const display_name = theClient?.[display_nameDataIndex] || 'N/A'

              return clientIsLoading ? <>Loading...</> : display_name
            },
            renderText: (_, record) => {
              const client_id = record?.client_id || 0
              const theClient =
                clients.find((client) => client.id === client_id) ||
                defaultClient
              const display_nameDataIndex = theClient?.display_name || 'name_en'
              const display_name = theClient?.[display_nameDataIndex] || 'N/A'
              return clientIsLoading ? '' : display_name
            },
          })}
        />
        {/* <Table.Column
                    dataIndex="statusFiled"
                    title="Status Filed"
                    {...getColumnSearchProps({
                        dataIndex: 'statusFiled',
                    })}
                    render={(statusFiled) => {
                        if (statusFiled === 'quotations') return 'Quotation';
                        if (statusFiled === 'receipts') return 'Receipt';
                        if (statusFiled === 'renewals') return 'Renewal';
                        if (statusFiled === 'debit_notes') return 'Debit Note';
                        return 'N/A';
                    }}
                /> */}
        {/* <Table.Column dataIndex="term_id" title="Class" render={(term_id: number) => terms.find((term) => term.id === term_id)?.name || ''} filters={termOptions} onFilter={(value, record: DataType) => (record?.term_id || 0) === value} /> */}
        <Table.Column
          dataIndex="period_of_insurance_from"
          title="Effective Date"
          render={(period_of_insurance_from: number) =>
            period_of_insurance_from
              ? dayjs.unix(period_of_insurance_from).format('YYYY-MM-DD')
              : ''
          }
          {...getSortProps<DataType>('period_of_insurance_from')}
        />
        <Table.Column
          dataIndex="period_of_insurance_to"
          title="End Date"
          render={(period_of_insurance_to: number) =>
            period_of_insurance_to
              ? dayjs.unix(period_of_insurance_to).format('YYYY-MM-DD')
              : ''
          }
          {...getSortProps<DataType>('period_of_insurance_to')}
        />
        <Table.Column
          dataIndex="date"
          title="Bill Date"
          render={(period_of_insurance_to: number) =>
            period_of_insurance_to
              ? dayjs.unix(period_of_insurance_to).format('YYYY-MM-DD')
              : ''
          }
          {...getSortProps<DataType>('period_of_insurance_to')}
        />
      </Table>
    </>
  )
}
