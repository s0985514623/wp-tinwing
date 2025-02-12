import React from 'react'
import { Create, useForm, useSelect } from '@refinedev/antd'
import { Form, Row, Col, Input, Select, DatePicker,Switch } from 'antd'
import { DataType as TTerms } from 'pages/terms/types'
import dayjs from 'dayjs'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'

const { TextArea } = Input
export const CreateView: React.FC<{ is_adjust_balance?: boolean }> = ({
  is_adjust_balance = false,
}) => {
  //當前表單的props
  const { formProps, saveButtonProps } = useForm()
  //terms 資料
  const { selectProps: termsProps } = useSelect<TTerms>({
    resource: 'terms',
    optionLabel: 'name',
    optionValue: 'id',
    filters: [
      // {
      //   field: 'taxonomy',
      //   operator: 'eq',
      //   value: 'expense_class',
      // },
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
  // console.log('🚀 ~ selectProps:', termsProps)
  //重新定義onFinish函數
  const newOnFinish = (values: any) => {
    formProps?.onFinish?.({
      ...values,
      date: values.date.unix(),
    })
  }
  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} onFinish={newOnFinish} layout="vertical">
        <Row gutter={0} className="mt-12">
          <Col span={12}>
            <div className="table table_td-flex-1 w-full">
              <Form.Item
                noStyle
								hidden
                name={['is_adjust_balance']}
                initialValue={is_adjust_balance}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <div className="tr">
                <div className="th">Date</div>
                <div className="td">
                  <Form.Item noStyle name={['date']} initialValue={dayjs()}>
                    <DatePicker size="small" className="w-full" />
                  </Form.Item>
                </div>
              </div>
              {!is_adjust_balance && (
                <div className="tr">
                  <div className="th">Category</div>
                  <div className="td">
                    <Form.Item noStyle name={['term_id']}>
                      <Select className="w-1/2" {...termsProps} allowClear />
                    </Form.Item>
                  </div>
                </div>
              )}
              <div className="tr">
                <div className="th">Amount</div>
                <div className="td">
                  <Form.Item name={['amount']}>
                    <Input />
                  </Form.Item>
                </div>
              </div>
              {!is_adjust_balance && (
                <>
                  <div className="tr">
                    <div className="th">Cheque No.</div>
                    <div className="td">
                      <Form.Item name={['cheque_no']}>
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
                  <ReceiptBankSelect className="table table_td-flex-1 w-full" />
                </>
              )}
							<ReceiptBankSelect
                  className="table table_td-flex-1 w-full"
                />
            </div>
          </Col>
          <Col span={12}>
            <div className="table table_td-flex-1 w-full">
              <div className="tr">
                <div className="th">Remark:</div>
                <div className="td">
                  <Form.Item noStyle name={['remark']}>
                    <TextArea rows={4} />
                  </Form.Item>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </Create>
  )
}
