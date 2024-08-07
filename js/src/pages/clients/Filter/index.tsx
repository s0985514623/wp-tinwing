import React from 'react';
import { Form, Button, FormProps, Input } from 'antd';

const Filter: React.FC<{ formProps: FormProps }> = ({ formProps }) => {
    return (
        <Form {...formProps} layout="vertical">
            <div className="grid grid-cols-6 gap-x-4 gap-y-0">
                <Form.Item label="Client No." name={['clientNumber']}>
                    <Input className="w-full" size="small" allowClear={true} />
                </Form.Item>
                <Form.Item label="English Name" name={['nameEn']}>
                    <Input className="w-full" size="small" allowClear={true} />
                </Form.Item>
                <Form.Item label="Chinese Name" name={['nameZh']}>
                    <Input className="w-full" size="small" allowClear={true} />
                </Form.Item>
                <Form.Item label="Company" name={['company']}>
                    <Input className="w-full" size="small" allowClear={true} />
                </Form.Item>
                <Form.Item label="Mobile" name={['mobile']}>
                    <Input className="w-full" size="small" allowClear={true} />
                </Form.Item>
                <Form.Item className="self-end">
                    <Button size="small" type="primary" htmlType="submit" className="w-full">
                        Search
                    </Button>
                </Form.Item>
            </div>
        </Form>
    );
};

export default Filter;
