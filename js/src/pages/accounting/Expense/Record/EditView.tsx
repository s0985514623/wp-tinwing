import React from 'react'
import { useOne } from '@refinedev/core'
import { Edit, useForm, useSelect } from '@refinedev/antd'
import { Form, Row, Col, Spin, Input, Select, InputNumber } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { DataType } from '../types'
import { DataType as TTerms } from 'pages/terms/types'
import dayjs from 'dayjs'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'

const { TextArea } = Input
export const EditView: React.FC<{ is_adjust_balance?: boolean }> = ({
  is_adjust_balance = false,
}) => {
  //當前表單的props
  const { formProps, saveButtonProps, queryResult } = useForm()
  const expenseData = queryResult?.data?.data as DataType
  // console.log("🚀 ~ expenseData:", expenseData)
  //terms 資料
  const { data: termsData, isLoading: termsIsLoading } = useOne<TTerms>({
    resource: 'terms',
    id: expenseData?.term_id || 0,
    queryOptions: {
      enabled: !is_adjust_balance,
    },
  })
  const { selectProps: termsProps } = useSelect<TTerms>({
    resource: 'terms',
    optionLabel: 'name',
    optionValue: 'id',
    filters: [
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'taxonomy',
      },
      {
        field: 'meta_query[0][value]',
        operator: 'eq',
        value: 'expense_class',
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: '=',
      },
    ],
    queryOptions: {
      enabled: !is_adjust_balance,
    },
  })

  const expenseDate = dayjs.unix(expenseData?.date).format('YYYY-MM-DD')
  const category = termsData?.data?.name || ''
  const amount = expenseData?.amount || 0
  const remark = expenseData?.remark || ''
  const cheque_no = expenseData?.cheque_no || ''

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Spin
          indicator={<LoadingOutlined className="text-2xl" spin />}
          tip="fetching data..."
          spinning={!!termsIsLoading && !is_adjust_balance}
        >
          <Row gutter={0} className="mt-12">
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <Form.Item noStyle hidden name={['id']}></Form.Item>
                <div className="tr">
                  <div className="th">Date</div>
                  <div className="td">{expenseDate}</div>
                </div>
                {!is_adjust_balance && (
                  <div className="tr">
                    <div className="th">Category</div>
                    <div className="td">
                      <Form.Item
                        noStyle
                        name={['term_id']}
                        initialValue={category}
                      >
                        <Select className="w-full" {...termsProps} allowClear />
                      </Form.Item>
                    </div>
                  </div>
                )}
                <div className="tr">
                  <div className="th">Amount</div>
                  <div className="td">
                    <Form.Item name={['amount']} initialValue={amount}>
                      <InputNumber className="w-full" min={0} stringMode step="0.01" />
                    </Form.Item>
                  </div>
                </div>
                {!is_adjust_balance && (
                  <>
                    <div className="tr">
                      <div className="th">Cheque No.</div>
                      <div className="td">
                        <Form.Item
                          name={['cheque_no']}
                          initialValue={cheque_no}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                    </div>
                  </>
                )}
                <ReceiptBankSelect
                  data={expenseData}
                  className="table table_td-flex-1 w-full"
                />
              </div>
            </Col>
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr">
                  <div className="th">Remark:</div>
                  <div className="td">
                    <Form.Item noStyle name={['remark']} initialValue={remark}>
                      <TextArea rows={4} />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Spin>
      </Form>
    </Edit>
  )
}
