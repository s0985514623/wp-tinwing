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
export const ListView: React.FC<{
  is_adjust_balance?: boolean
  is_other_earning?: boolean
}> = ({ is_adjust_balance = false, is_other_earning = false }) => {
  // Adjust Balance 與 Other Earning 共用同一份精簡列表（沒有 Category / Cheque No. / 批次編輯）
  const isSimpleForm = is_adjust_balance || is_other_earning
  // other_earnings 是獨立 CPT，沒有 is_adjust_balance 這個 meta，送出這組條件會查不到任何資料
  const adjustBalanceFilters: CrudFilters = is_other_earning
    ? []
    : [
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
  const { show, close, modalProps } = useModal()
  const { selectedRowKeys, rowSelection } = useRowSelection<DataType>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]|undefined>(undefined)
  const [pageSize, setPageSize] = useState(30);
  const [current, setCurrent] = useState(1);
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
        ...adjustBalanceFilters,
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
        ...adjustBalanceFilters,
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
      enabled: !!parsedTableProps?.dataSource && !isSimpleForm,
    },
  })
  // 總計：有勾選時顯示勾選的合計，沒勾選時顯示全部合計
  // Adjust Balance 與 Other Earning 沒有勾選框，原本會永遠停在 0
  const allRows = parsedTableProps?.dataSource ?? []
  const sumAmount = (rows: readonly DataType[]) =>
    rows.reduce((acc, row) => acc + Number(row?.amount ?? 0), 0)
  const hasSelection = selectedRowKeys.length > 0
  const totalExpense = hasSelection
    ? sumAmount(allRows.filter((row) => selectedRowKeys.includes(row.id)))
    : sumAmount(allRows)
  const totalLabel = hasSelection ? `已選 ${selectedRowKeys.length} 筆` : '總計'
  const totalText = totalExpense.toLocaleString('en-US', {
    minimumFractionDigits: 2, // 最少小數點後兩位
    maximumFractionDigits: 2, // 最多小數點後兩位
  })
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
      ...adjustBalanceFilters,
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
      {!isSimpleForm && (
        <ModalEdit
          modalProps={modalProps}
          selectedRowKeys={selectedRowKeys}
          close={close}
        />
      )}
      <List
        headerButtons={() => (
          <>
            {!isSimpleForm && (
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
          rowSelection={!isSimpleForm ? rowSelection : undefined}
          summary={() => {
            // 讓合計對齊 Amount 欄。完整模式的欄序是 勾選 / Date / Category / Amount，
            // 精簡模式沒有勾選欄與 Category 欄，欄序是 Date / Amount，
            // 前面要少墊兩格，否則數字會落到 Bank、Remark 底下。
            const leadingCells = isSimpleForm ? 1 : 3
            return (
              <Table.Summary.Row>
                {Array.from({ length: leadingCells - 1 }, (_, i) => (
                  <Table.Summary.Cell key={i} index={i}></Table.Summary.Cell>
                ))}
                <Table.Summary.Cell index={leadingCells - 1}>
                  {totalLabel}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={leadingCells}>
                  {totalText}
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
        dataIndex="date"
        title="Date"
        render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
        {...getSortProps<DataType>('date')}
      />
      {!isSimpleForm && (
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
      {!isSimpleForm && (
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
          {...getSortProps<DataType>('payment_date')}
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
