import React from 'react'
import { IResourceComponentsProps } from '@refinedev/core'
import { Edit, useForm } from '@refinedev/antd'
import { Row, Col, Form, Input } from 'antd'
import UniqueInput from 'components/UniqueInput'

export const EditView: React.FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm()

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Row gutter={24}>
                    <Col span={12}>
                        <UniqueInput
                            formItemProps={{
                                label: 'Agent No.',
                            }}
                            name={['agent_number']}
                        />
                        <Form.Item label="Name" name={['name']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Contact Person 1" name={['contact1']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Contact Number 1" name={['tel1']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Contact Person 2" name={['contact2']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Contact Number 2" name={['tel2']}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Edit>
    )
}
