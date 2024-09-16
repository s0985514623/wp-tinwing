import React from 'react'
import { IResourceComponentsProps } from '@refinedev/core'
import { Create, useForm } from '@refinedev/antd'
import { Row, Col, Input, Form, InputNumber } from 'antd'
import UniqueInput from 'components/UniqueInput'

export const CreateView: React.FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm()

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Row gutter={24}>
                    <Col span={12}>
                        <UniqueInput
                            formItemProps={{
                                label: 'Insurer No.',
                            }}
                            name={['insurer_number']}
                        />
                        <Form.Item label="Name" name={['name']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Payment Rate" name={['payment_rate']}>
                            <InputNumber addonAfter="%" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    )
}
