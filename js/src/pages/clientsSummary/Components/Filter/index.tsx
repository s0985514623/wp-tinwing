import React from 'react'
// import dayjs from 'dayjs';
import { Form, Button, DatePicker, FormProps, Input, Radio } from 'antd'
// import type { RadioChangeEvent } from 'antd';
const { RangePicker } = DatePicker

const Filter: React.FC<{ formProps: FormProps }> = ({ formProps }) => {
  const IsArchivedFormItem = () => {
    if (window.location.hash === '#/clientsSummary') {
      return (
        <div className="col-span-full place-items-center z-0">
          <Form.Item
            name={['is_archived']}
            className="text-center"
            initialValue="false"
          >
            <Radio.Group>
              <Radio.Button value="false">Current</Radio.Button>
              <Radio.Button value="true">Archived</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>
      )
    }
    return <></>
  }
  return (
    <Form {...formProps} layout="vertical">
      <div className="grid grid-cols-3 gap-x-4 gap-y-0">
        <IsArchivedFormItem />
        <Form.Item
          label="END DATE"
          name={['dateRange']}
          //  initialValue={[dayjs('2022-01-01'), dayjs()]}
        >
          <RangePicker size="small" className="w-full" />
        </Form.Item>
        <Form.Item label="Engine" name={['motor_engine_no']}>
          <Input className="w-full" size="small" allowClear={true} />
        </Form.Item>
        <Form.Item className="self-end">
          <Button
            size="small"
            type="primary"
            htmlType="submit"
            className="w-full"
          >
            Search
          </Button>
        </Form.Item>
      </div>
    </Form>
  )
}

export default Filter
