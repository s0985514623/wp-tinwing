import React from 'react'
import { IResourceComponentsProps } from '@refinedev/core'
import { Create, useForm } from '@refinedev/antd'
import { Row, Col, Input, Form } from 'antd'

export const CreateView: React.FC<
    IResourceComponentsProps & { taxonomy: string }
> = ({ taxonomy = '' }) => {
    const { formProps, saveButtonProps } = useForm()

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item label="Name" name={['name']}>
                            <Input />
                        </Form.Item>

                        <Form.Item
                            hidden
                            name={['taxonomy']}
                            initialValue={taxonomy}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    )
}
