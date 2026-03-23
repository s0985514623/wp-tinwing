import React from 'react'
import dayjs from 'dayjs';
import { Form, Button, DatePicker,TimeRangePickerProps, FormProps, Input, Radio } from 'antd'
// import type { RadioChangeEvent } from 'antd';
const { RangePicker } = DatePicker
const rangePresets: TimeRangePickerProps['presets'] = [
  { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
  { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
  { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
  { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
  { label: 'Last 180 Days', value: [dayjs().add(-180, 'd'), dayjs()] },
  { label: 'Last 365 Days', value: [dayjs().add(-365, 'd'), dayjs()] },
];
const Filter: React.FC<{ formProps: FormProps ,isReceipts?: boolean}> = ({ formProps ,isReceipts=false}) => {
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
      <div className={`grid grid-cols-${isReceipts ? '2' : '3'} gap-x-4 gap-y-0`}>
        <IsArchivedFormItem />
        <Form.Item
          label="Bill DATE"
          name={['dateRange']}
           initialValue={[dayjs().add(-30, 'd'), dayjs()]}
        >
          <RangePicker presets={rangePresets} size="small" className="w-full" />
        </Form.Item>
        <Form.Item label="Engine" name={['motor_engine_no']} className={isReceipts ? 'tw-hidden' : ''}>
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
