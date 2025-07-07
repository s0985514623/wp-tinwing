import { useState } from 'react'
import { useMany, useExport, CrudFilters } from '@refinedev/core'
import {
  List,
  useTable,
  EditButton,
  ExportButton,
  CreateButton,
  DeleteButton,
  useModal,
} from '@refinedev/antd'
import { Space, Table, Button } from 'antd'
import { useRowSelection } from 'antd-toolkit'
import { DataType as TTerms } from 'pages/terms/types'
import { DataType, ZDataType } from '../types'
import { safeParse, getSortProps } from 'utils'
import dayjs, { Dayjs } from 'dayjs'
import Filter from '../../dashboard/Filter'
import { ModalEdit } from './ModalEdit'
export const ListView: React.FC<{ is_adjust_balance?: boolean }> = ({
  is_adjust_balance = false,
}) => {
  const { show, close, modalProps } = useModal()
  const { selectedRowKeys, rowSelection } = useRowSelection<DataType>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>(undefined)

  const { tableProps, searchFormProps } = useTable<DataType>({
    sorters: {
      initial: [
        {
          field: 'date',
          order: 'desc',
        },
      ],
    },
    filters: {
      permanent: [
        // {
        //   field: 'meta_query[0][key]',
        //   operator: 'eq',
        //   value: 'payment_date',
        // },
        // {
        //   field: 'meta_query[0][value][0]',
        //   operator: 'eq',
        //   value: dateRange ? dateRange[0].startOf('day').unix() : undefined,
        // },
        // {
        //   field: 'meta_query[0][value][1]',
        //   operator: 'eq',
        //   value: dateRange ? dateRange[1].endOf('day').unix() : undefined,
        // },
        // {
        //   field: 'meta_query[0][compare]',
        //   operator: 'eq',
        //   value: 'BETWEEN',
        // },
        {
          field: 'meta_query[1][key]',
          operator: 'eq',
          value: 'is_adjust_balance',
        },
        {
          field: 'meta_query[1][value]',
          operator: 'eq',
          value: 1,
        },
        {
          field: 'meta_query[1][compare]',
          operator: 'eq',
          value: is_adjust_balance ? '=' : '!=',
        },
      ],
    },
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'payment_date',
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
          value: 'is_adjust_balance',
        },
        {
          field: 'meta_query[1][value]',
          operator: 'eq',
          value: 1,
        },
        {
          field: 'meta_query[1][compare]',
          operator: 'eq',
          value: is_adjust_balance ? '=' : '!=',
        },
      ]
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

  const { data: termsData } = useMany<TTerms>({
    resource: 'terms',
    ids:
      parsedTableProps?.dataSource
        ?.map((r) => r?.term_id)
        .filter((id): id is number => typeof id === 'number') ?? [],
    queryOptions: {
      enabled: !!parsedTableProps?.dataSource && !is_adjust_balance,
    },
  })
  // 計算已選單的  Expense 總金額
  const selectedExpenses = selectedRowKeys.map((id) => {
    const receipt = parsedTableProps?.dataSource?.find((r) => r.id === id)
    return receipt?.amount
  })
  const totalExpense = selectedExpenses.reduce((acc, curr) => Number(acc) + Number(curr), 0)
  //如果没有数据，就禁用导出按钮
  const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false
  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    filters: [
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'payment_date',
      },
      {
        field: 'meta_query[0][value][0]',
        operator: 'eq',
        value: dateRange ? dateRange[0].startOf('day').unix() : undefined,
      },
      {
        field: 'meta_query[0][value][1]',
        operator: 'eq',
        value: dateRange ? dateRange[1].endOf('day').unix() : undefined,
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: 'BETWEEN',
      },
      {
        field: 'meta_query[1][key]',
        operator: 'eq',
        value: 'is_adjust_balance',
      },
      {
        field: 'meta_query[1][value]',
        operator: 'eq',
        value: 1,
      },
      {
        field: 'meta_query[1][compare]',
        operator: 'eq',
        value: is_adjust_balance ? '=' : '!=',
      },
    ]
    ,
    mapData: (item) => {
      return {
        Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
        'Payment Date': item.payment_date ? dayjs.unix(Number(item.payment_date)).format('YYYY-MM-DD') : '',
        Category: termsData?.data?.find((term) => term.id === item.term_id)
          ?.name,
        Amount: Number(item.amount).toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2, // 最少小數點後兩位
            maximumFractionDigits: 2, // 最多小數點後兩位
          },
        ),
        'Cheque No': item.cheque_no,
        'Bank': item.payment_receiver_account,
        Remark: item.remark,

      }
    },
  })
  return (
    <>
      {!is_adjust_balance && (
        <ModalEdit
          modalProps={modalProps}
          selectedRowKeys={selectedRowKeys}
          close={close}
        />
      )}
      <List
        headerButtons={() => (
          <>
            {!is_adjust_balance && (
              <Button
                size="small"
                type="primary"
                onClick={show}
                disabled={selectedRowKeys.length == 0}
              >
                Quick Edits
              </Button>
            )}
            <Filter
              dateRange={dateRange}
              setDateRange={setDateRange}
              formProps={searchFormProps}
            />
            <ExportButton
              onClick={triggerExport}
              loading={exportLoading}
              disabled={disabledBtn}
            />
            <CreateButton />
          </>
        )}
      >
        <Table
          {...parsedTableProps}
          rowKey="id"
          size="middle"
          rowSelection={!is_adjust_balance ? rowSelection : undefined}
          summary={(pageData) => {
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}></Table.Summary.Cell>
                <Table.Summary.Cell index={1}></Table.Summary.Cell>
                <Table.Summary.Cell index={2}>總計</Table.Summary.Cell>
                <Table.Summary.Cell index={3}>{totalExpense ? Number(totalExpense).toLocaleString() : 0}</Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}

      pagination={{
        pageSize: 30,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
        >
      <Table.Column
        width={120}
        dataIndex="date"
        title="Date"
        render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
        {...getSortProps<DataType>('date')}
      />
      {!is_adjust_balance && (
        <Table.Column
          width={120}
          dataIndex="term_id"
          title="Category"
          render={(term_id: number) => {
            const termData = termsData?.data?.find(
              (term) => term.id === term_id,
            )
            return termData?.name
          }}
          filters={termsData?.data?.map((term) => ({ text: term.name, value: term.id }))}
          onFilter={(value, record: DataType) => {
            return (record?.term_id || undefined) === value
          }}
        />
      )}

      <Table.Column
        width={120}
        dataIndex="amount"
        title="Amount"
        render={(amount) => Number(amount).toLocaleString(
          'en-US',
          {
            minimumFractionDigits: 2, // 最少小數點後兩位
            maximumFractionDigits: 2, // 最多小數點後兩位
          },
        )}
        {...getSortProps<DataType>('amount')}
      />
      {!is_adjust_balance && (
        <>
          <Table.Column
            width={120}
            dataIndex="cheque_no"
            title="Cheque No"
          />
        </>
      )}
      <Table.Column
        width={120}
        dataIndex="payment_receiver_account"
        title="Bank"
        filters={[{ text: '上海商業銀行', value: '上海商業銀行' }, { text: '中國銀行', value: '中國銀行' }]}
        onFilter={(value, record: DataType) => {
          return (record?.payment_receiver_account || undefined) === value
        }}
      />
      {!is_adjust_balance && (
        <Table.Column
          width={120}
          dataIndex="payment_date"
          title="Payment Date"
          render={(date: number) =>
            date ? dayjs.unix(date).format('YYYY-MM-DD') : ''
          }
        />
      )}
      <Table.Column width={120} dataIndex="remark" title="Remark" />
      <Table.Column
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
                />
                <DeleteButton
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
    </Table >
      </List >
    </>
  )
}
