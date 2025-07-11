import { useMany, CrudFilters, useExport, BaseKey } from '@refinedev/core'
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
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TTerm } from 'pages/terms/types'
import { DataType as TReceipt } from 'pages/receipts/types'
import { safeParse, getSortProps, getTotalPremiumByDebitNote, getGrossPremium } from 'utils'
import Filter from '../clientsSummary/Components/Filter'
import dayjs from 'dayjs'
import { round } from 'lodash'
import { useColumnSearch } from 'hooks'
import { useState } from 'react'

export const ListView: React.FC = () => {
  const [pageSize, setPageSize] = useState(30);
  const [current, setCurrent] = useState(1);

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
        // 不搜尋is_archived欄位
        // {
        // 	field: 'meta_query[0][key]',
        // 	operator: 'eq',
        // 	value: 'is_archived',
        // },
        // {
        // 	field: 'meta_query[0][value]',
        // 	operator: 'eq',
        // 	value: 0,
        // },
        // {
        // 	field: 'meta_query[0][type]',
        // 	operator: 'eq',
        // 	value: 'NUMERIC',
        // },
        // {
        // 	field: 'meta_query[0][compare]',
        // 	operator: 'eq',
        // 	value: '=',
        // },
        // {
        //   field: 'meta_query[1][key]',
        //   operator: 'eq',
        //   value: 'period_of_insurance_to',
        // },
        // {
        //   field: 'meta_query[1][value]',
        //   operator: 'eq',
        //   value: dayjs('2022-01-01').unix(),
        // },
        // {
        //   field: 'meta_query[1][compare]',
        //   operator: 'eq',
        //   value: '>',
        // },
        // {
        //   field: 'meta_query[1][type]',
        //   operator: 'eq',
        //   value: 'NUMERIC',
        // },
      ] as CrudFilters,
    },
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'meta_query[relation]',
          operator: 'eq',
          value: 'AND',
        },
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'period_of_insurance_to',
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
            ? dayjs(values?.dateRange[1]?.startOf('day')).unix()
            : undefined,
        },
        {
          field: 'meta_query[0][compare]',
          operator: 'eq',
          value: values?.dateRange ? 'BETWEEN' : '>',
        },
        {
          field: 'meta_query[1][relation]',
          operator: 'eq',
          value: 'OR',
        },
        {
          field: 'meta_query[1][0][key]',
          operator: 'eq',
          value: 'motor_engine_no',
        },
        {
          field: 'meta_query[1][0][value]',
          operator: 'eq',
          value:
            values?.motor_engine_no === ''
              ? undefined
              : values?.motor_engine_no,
        },
        {
          field: 'meta_query[1][0][compare]',
          operator: 'eq',
          value: '=',
        },
        {
          field: 'meta_query[1][1][key]',
          operator: 'eq',
          value: 'motor_attr',
        },
        {
          field: 'meta_query[1][1][value]',
          operator: 'eq',
          value:
            values?.motor_engine_no === ''
              ? undefined
              : values?.motor_engine_no,
        },
        {
          field: 'meta_query[1][1][compare]',
          operator: 'eq',
          value: 'LIKE',
        },
        {
          field: 'meta_query[1][2][key]',
          operator: 'eq',
          value: 'chassi',
        },
        {
          field: 'meta_query[1][2][value]',
          operator: 'eq',
          value:
            values?.motor_engine_no === ''
              ? undefined
              : values?.motor_engine_no,
        },
        {
          field: 'meta_query[1][2][compare]',
          operator: 'eq',
          value: '=',
        },
        // 不搜尋is_archived欄位
        // {
        // 	field: 'meta_query[2][key]',
        // 	operator: 'eq',
        // 	value: 'is_archived',
        // },
        // {
        // 	field: 'meta_query[2][value]',
        // 	operator: 'eq',
        // 	value: values?.is_archived.toLowerCase() === "true"? 1 : 0,
        // },
        // {
        // 	field: 'meta_query[2][type]',
        // 	operator: 'eq',
        // 	value: 'NUMERIC',
        // },
        // {
        // 	field: 'meta_query[2][compare]',
        // 	operator: 'eq',
        // 	value: '=',
        // },
      ]
      return filters as CrudFilters
    },
    pagination: {
      pageSize: -1, // 一次取得所有資料
      mode: "off", // 關閉服務端分頁
    }
  })
  const formattedTableProps = {
    ...tableProps,
    dataSource: tableProps?.dataSource?.map((theRecord) => {
      const motor_attr = theRecord?.motor_attr
      const formattedMotorAttr = motor_attr
        ? {
          ...motor_attr,
          ls: motor_attr?.ls ? Number(motor_attr?.ls) : undefined,
          mib: motor_attr?.mib ? Number(motor_attr?.mib) : undefined,
          ncb: motor_attr?.ncb ? Number(motor_attr?.ncb) : undefined,
        }
        : null

      return {
        ...theRecord,
        motor_attr: formattedMotorAttr,
      }
    }) as DataType[],
  }

  const parsedTableProps = safeParse<DataType>({
    tableProps: formattedTableProps,
    ZDataType: ZDataType,
  })
  const { data: termData, isLoading: termIsLoading } = useMany<TTerm>({
    resource: 'terms',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.term_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })

  const { data: insurerData, isLoading: insurerIsLoading } = useMany({
    resource: 'insurers',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.insurer_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })

  const { data: clientData, isLoading: clientIsLoading } = useMany<TClient>({
    resource: 'clients',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.client_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })
  const { data: receiptData, isLoading: receiptIsLoading } = useMany<TReceipt>({
    resource: 'receipts',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.receipt_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource,
    },
  })

  const clients = (clientData?.data || []) as TClient[]

  const { getColumnSearchProps } = useColumnSearch<DataType>()

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
      text: 'Package',
      value: 'package',
    },
    // {
    //   text: 'Others',
    //   value: 'others',
    // },
  ]
  const InsuranceClassOptions = termData?.data?.map((item) => ({
    text: item.name,
    value: item.id,
  }))

  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    mapData: (item) => {
      // 取得client資料
      const theClient =
        clients.find((client) => client.id === item?.client_id) ||
        defaultClient
      const display_nameDataIndex = theClient?.display_name || 'name_en'
      const display_name = theClient?.[display_nameDataIndex] || 'N/A'
      // 取得insurer資料
      const theInsurer =
        insurerData?.data?.find(
          (theInsurer) => theInsurer.id === item?.insurer_id,
        )?.name
      const insurer_name = theInsurer || 'N/A'

      let paymentToInsurer = 'N/A';

      if (item?.template === 'motor') {
        const insurerPaymentRate = Number(item?.insurer_fee_percent ?? theInsurer?.payment_rate ?? 0);
        const extra_fieldValue = round(Number(item?.premium ?? 0) * (Number(item?.extra_field?.value ?? 0) / 100), 2);
        const grossPremium = getGrossPremium({
          premium: Number(item?.premium ?? 0),
          ls: Number(item?.motor_attr?.ls ?? 0),
          ncb: Number(item?.motor_attr?.ncb ?? 0),
        });
        const mibValue = round(grossPremium * (Number(item?.motor_attr?.mib ?? 0) / 100), 2);
        const insurerTotalFee = mibValue + extra_fieldValue + round(grossPremium * (insurerPaymentRate / 100), 2);
        paymentToInsurer = insurerTotalFee.toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2, // 最少小數點後兩位
            maximumFractionDigits: 2, // 最多小數點後兩位
          },
        );
      }
      else {
        const insurerPaymentRate = Number(item?.insurer_fee_percent ?? theInsurer?.payment_rate ?? 0);
        const extra_fieldValue = round(Number(item?.premium ?? 0) * (Number(item?.extra_field?.value ?? 0) / 100), 2);
        const levyValue = round(Number(item?.premium ?? 0) * (Number(item?.levy ?? 0) / 100), 2);
        const insurerTotalFee = levyValue + extra_fieldValue + round(Number(item?.premium ?? 0) * (insurerPaymentRate / 100), 2);
        paymentToInsurer = insurerTotalFee.toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2, // 最少小數點後兩位
            maximumFractionDigits: 2, // 最多小數點後兩位
          },
        );
      }

      // 取得receipt資料
      const theReceipt =
        receiptData?.data?.find(
          (theReceipt) => theReceipt.id === item?.receipt_id,
        )
      const receipt_no = theReceipt?.receipt_no || 'N/A'
      const receipt_date = theReceipt?.date ? dayjs.unix(theReceipt?.date as number).format('YYYY-MM-DD') : 'N/A'
      const payment_date = theReceipt?.payment_date ? dayjs.unix(theReceipt?.payment_date as number).format('YYYY-MM-DD') : 'N/A'

      // 取得totalPremium
      const totalPremium = getTotalPremiumByDebitNote(item)
      return {
        id: item?.id,
        'DN/CN': item?.note_no,
        'Bill Date': dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
        'Receipt No': receipt_no,
        'Receipt Date': receipt_date,
        'Payment Date': payment_date,
        'Client No': theClient?.client_number || 'N/A',
        'Client': display_name,
        'Insurer': insurer_name,
        'Premium': totalPremium || 'N/A',
        'Insurer Fee Percent': item?.insurer_fee_percent || 'N/A',
        'Payment to Insurer': paymentToInsurer,
        'Remark': item?.remark || 'N/A',
        'Period of Insurance From': dayjs
          .unix(item?.period_of_insurance_from as number)
          .format('YYYY-MM-DD'),
        'Period of Insurance To': dayjs
          .unix(item?.period_of_insurance_to as number)
          .format('YYYY-MM-DD'),
        'Sum Insured': item?.sum_insured || 'N/A',
        'Is Archived': item?.is_archived ? 'True' : 'False',
        'Policy No.': item?.policy_no || 'N/A',
        'Created At': dayjs.unix(Number(item?.created_at)).format('YYYY-MM-DD'),
        'Template': item?.template || 'N/A',
        'Teem ID': item?.term_id || 'N/A',
        'Agent ID': item?.agent_id || 'N/A',
        'Client ID': item?.client_id || 'N/A',
        'Insurer ID': item?.insurer_id || 'N/A',
        'Motor Attr': JSON.stringify(item?.motor_attr),
        'Extra Field': JSON.stringify(item?.extra_field),
      }
    },
  })

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
          width={100}
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
          width={100}
          dataIndex="note_no"
          title="Note No."
          sorter={(a, b) => a?.note_no?.localeCompare(b?.note_no || '') || 0}
          {...getColumnSearchProps({
            dataIndex: 'note_no',
          })}
        />
        <Table.Column
          width={120}
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
          title="Client"
          {...getColumnSearchProps({
            dataIndex: 'id',
            render: (id, record) => {
              const client_id = record?.client_id
              const theClient =
                clients.find((client) => client.id === client_id) ||
                defaultClient
              const display_nameDataIndex = theClient?.display_name || 'name_en'
              const display_name = theClient?.[display_nameDataIndex] || 'N/A'
              return clientIsLoading && !display_name
                ? ((<>Loading...</>) as React.ReactNode)
                : display_name
            },
            renderText: (id, record) => {
              const client_id = record?.client_id
              const theClient =
                clients.find((client) => client.id === client_id) ||
                defaultClient
              const display_nameDataIndex = theClient?.display_name || 'name_en'
              const display_name = theClient?.[display_nameDataIndex] || 'N/A'
              return clientIsLoading && !display_name ? '' : display_name
            },
          })}
        />
        <Table.Column
          dataIndex="id"
          title="Total Premium"
          render={(id: number, record: DataType) => {
            const totalPremium = getTotalPremiumByDebitNote(record)
            return totalPremium
          }}
          sorter={(a, b) =>
            getTotalPremiumByDebitNote(a) - getTotalPremiumByDebitNote(b)
          }
        />
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
          dataIndex="term_id"
          title="Class of Insurance"
          filters={InsuranceClassOptions}
          onFilter={(value, record: DataType) => {
            return (record?.term_id || undefined) === value
          }}
          render={(term_id: number) =>
            termIsLoading ? (
              <>Loading...</>
            ) : (
              termData?.data?.find((theTerm) => theTerm.id === term_id)?.name
            )
          }
        />
        <Table.Column
          dataIndex="name_of_insured"
          title="Name of Insured"
          {...getColumnSearchProps({
            dataIndex: 'name_of_insured',
          })}
        />
        <Table.Column
          dataIndex="insurer_id"
          title="Insurer"
          {...getColumnSearchProps({
            dataIndex: 'insurer_id',
            render: (insurer_id) =>
              insurerIsLoading ? (
                <>Loading...</>
              ) : (
                insurerData?.data?.find(
                  (theInsurer) => theInsurer.id === insurer_id,
                )?.name
              ),
            renderText: (insurer_id) =>
              insurerIsLoading
                ? ''
                : insurerData?.data?.find(
                  (theInsurer) => theInsurer.id === insurer_id,
                )?.name || '',
          })}
        />
        <Table.Column
          dataIndex="policy_no"
          title="Policy Number"
          {...getColumnSearchProps({
            dataIndex: 'policy_no',
          })}
        />
        <Table.Column
          width={120}
          dataIndex="id"
          title=""
          render={(id) => {
            return (
              <>
                <Space>
                  <ShowButton
                    resource="debit_notes"
                    type="primary"
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                  <EditButton
                    resource="debit_notes"
                    type="primary"
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                  <DeleteButton
                    resource="debit_notes"
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
