import React from 'react'
import { IResourceComponentsProps } from '@refinedev/core'
import { Create, useForm, useSelect } from '@refinedev/antd'
import { Form, Row, Col, Input, Select, DatePicker } from 'antd'
import { DataType as TTerms } from 'pages/terms/types'
import dayjs from 'dayjs'

const { TextArea } = Input
export const CreateView: React.FC<IResourceComponentsProps> = () => {
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
  })
  console.log('🚀 ~ selectProps:', termsProps)
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
              <div className="tr">
                <div className="th">Date</div>
                <div className="td">
                  <Form.Item noStyle name={['date']} initialValue={dayjs()}>
                    <DatePicker size="small" className="w-full" />
                  </Form.Item>
                </div>
              </div>
              <div className="tr">
                <div className="th">Category</div>
                <div className="td">
                  <Form.Item noStyle name={['term_id']}>
                    <Select className="w-1/2" {...termsProps} allowClear />
                  </Form.Item>
                </div>
              </div>
              <div className="tr">
                <div className="th">Amount</div>
                <div className="td">
                  <Form.Item name={['amount']}>
                    <Input />
                  </Form.Item>
                </div>
              </div>
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
