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
import { safeParse } from 'utils'
import dayjs, { Dayjs } from 'dayjs'
import Filter from '../../dashboard/Filter'
import { ModalEdit } from './ModalEdit'
export const ListView: React.FC<{ is_adjust_balance?: boolean }> = ({
  is_adjust_balance = false,
}) => {
  const { show, close, modalProps } = useModal()
  const { selectedRowKeys, rowSelection } = useRowSelection<DataType>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().add(-30, 'd'),
    dayjs(),
  ])

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
        {
          field: 'meta_query[0][key]',
          operator: 'eq',
          value: 'date',
        },
        {
          field: 'meta_query[0][value][0]',
          operator: 'eq',
          value: dateRange ? dateRange[0].unix() : undefined,
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: dateRange ? dateRange[1].unix() : undefined,
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
          value: values?.dateRange ? values?.dateRange[0]?.unix() : undefined,
        },
        {
          field: 'meta_query[0][value][1]',
          operator: 'eq',
          value: values?.dateRange ? values?.dateRange[1]?.unix() : undefined,
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
		pagination:{
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
  //如果没有数据，就禁用导出按钮
  const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false
  //Export CSV
  const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    filters: dateRange
      ? [
          {
            field: 'date',
            operator: 'gt',
            value: dateRange[0]?.unix(),
          },
          {
            field: 'date',
            operator: 'lt',
            value: dateRange[1]?.unix(),
          },
        ]
      : [],
    mapData: (item) => {
      return {
        Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
        Category: termsData?.data?.find((term) => term.id === item.term_id)
          ?.name,
        Amount: item.amount.toLocaleString(),
        Remark: item.remark,
        'Cheque No': item.cheque_no,
        'Bank': item.payment_receiver_account,
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
            />
          )}

          <Table.Column
            width={120}
            dataIndex="amount"
            title="Amount"
            render={(amount) => amount.toLocaleString()}
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
        </Table>
      </List>
    </>
  )
}
