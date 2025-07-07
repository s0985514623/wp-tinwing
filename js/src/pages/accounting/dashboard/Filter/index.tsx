import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Button, DatePicker, TimeRangePickerProps, FormProps } from 'antd';

// 定义 props 的类型
interface FilterProps {
    dateRange: [Dayjs , Dayjs]|undefined;
    setDateRange?: React.Dispatch<React.SetStateAction<[Dayjs, Dayjs]|undefined>>;
    formProps?: FormProps;
}
const { RangePicker } = DatePicker;
const rangePresets: TimeRangePickerProps['presets'] = [
    { label: 'Last 7 Days', value: [dayjs().add(-7, 'd'), dayjs()] },
    { label: 'Last 14 Days', value: [dayjs().add(-14, 'd'), dayjs()] },
    { label: 'Last 30 Days', value: [dayjs().add(-30, 'd'), dayjs()] },
    { label: 'Last 90 Days', value: [dayjs().add(-90, 'd'), dayjs()] },
    { label: 'Last 180 Days', value: [dayjs().add(-180, 'd'), dayjs()] },
    { label: 'Last 365 Days', value: [dayjs().add(-365, 'd'), dayjs()] },
];

const Filter: React.FC<FilterProps> = ({ dateRange, setDateRange, formProps }) => {
    
    const [form] = Form.useForm();
    
    // 同步外部 dateRange 到 Form 中
    useEffect(() => {
        form.setFieldsValue({ dateRange });
    }, [dateRange, form]);
    
    const handleOnFieldsChange = (changedFields: any) => {
        if (setDateRange) setDateRange(changedFields.dateRange);
        if (formProps) formProps?.onFinish?.(changedFields);
    };
    
    const handleShowAllTime = () => {
        // 直接更新状态，不依赖Form的值
        // console.log("🚀 ~ dateRange:", dateRange)
        if (setDateRange) setDateRange(undefined);
        if (formProps) formProps?.onFinish?.({ dateRange: undefined });
        // console.log("🚀 ~ handleShowAllTime ~ formProps:", formProps)
    };
    
    return (
        <Form form={form} layout="vertical" onValuesChange={handleOnFieldsChange}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                <Form.Item label="Date" name={['dateRange']} noStyle>
                    <RangePicker presets={rangePresets} size="small" className="w-full" />
                </Form.Item>
                <div className="">
                    <Button size="small" type="primary" className="w-full " onClick={handleShowAllTime}>
                        Show All time
                    </Button>
                </div>
            </div>
        </Form>
    );
};

export default Filter;
