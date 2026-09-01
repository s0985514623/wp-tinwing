import React from 'react'
import { Create, useForm, useSelect } from '@refinedev/antd'
import { Form, Row, Col, Input, Select, DatePicker, Switch } from 'antd'
import { DataType as TTerms } from 'pages/terms/types'
import dayjs from 'dayjs'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'
import { AmountInput } from 'components/AmountInput'

const { TextArea } = Input


export const CreateView: React.FC<{
  is_adjust_balance?: boolean
  is_other_earning?: boolean
}> = ({ is_adjust_balance = false, is_other_earning = false }) => {
  // Adjust Balance 與 Other Earning 共用同一份精簡表單（沒有 Category / Cheque No.）
  const isSimpleForm = is_adjust_balance || is_other_earning
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
      enabled: !isSimpleForm,
    },
  })
  // console.log('🚀 ~ selectProps:', termsProps)
  //重新定義onFinish函數
  const newOnFinish = (values: any) => {
    // 處理 amount 值，將符號和數值組合
    const processedValues = {
      ...values,
      date: values.date.unix(),
    };

    // 如果 amount 是對象（包含 sign 和 amount），則進行處理
    if (values.amount && typeof values.amount === 'object') {
      const { sign, amount } = values.amount;
      processedValues.amount = sign === 'minus' ? -amount : amount;
    }


    formProps?.onFinish?.(processedValues);
  }
  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} onFinish={newOnFinish} layout="vertical">
        <Row gutter={0} className="mt-12">
          <Col span={12}>
            <div className="table table_td-flex-1 w-full">
              {/* other_earnings 是獨立 CPT，沒有 is_adjust_balance 這個 meta */}
              {!is_other_earning && (
                <Form.Item
                  noStyle
                  hidden
                  name={['is_adjust_balance']}
                  initialValue={is_adjust_balance}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              )}
              <div className="tr">
                <div className="th">Date</div>
                <div className="td">
                  <Form.Item noStyle name={['date']} initialValue={dayjs()}>
                    <DatePicker size="small" className="w-full" />
                  </Form.Item>
                </div>
              </div>
              {!isSimpleForm && (
                <div className="tr">
                  <div className="th">Category</div>
                  <div className="td">
                    <Form.Item noStyle name={['term_id']}>
                      <Select className="w-full" {...termsProps} allowClear />
                    </Form.Item>
                  </div>
                </div>
              )}
              <div className="tr">
                <div className="th">Amount</div>
                <div className="td">
                  <Form.Item name={['amount']}>
                    <AmountInput className="w-full" />
                  </Form.Item>
                </div>
              </div>
              {!isSimpleForm && (
                <>
                  <div className="tr">
                    <div className="th">Cheque No.</div>
                    <div className="td">
                      <Form.Item name={['cheque_no']}>
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
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
                <div className="th">Payment Date</div>
                <div className="td">
                  <Form.Item 
                    noStyle 
                    name={['payment_date']} 
                    getValueFromEvent={(value) => value}
                    getValueProps={(value) => ({
                      value: value ? dayjs.unix(value) : undefined
                    })}
                    normalize={(value) => value ? dayjs(value).unix() : undefined}
                  >
                    <DatePicker size="small" className="w-full" />
                  </Form.Item>
                </div>
              </div>
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
