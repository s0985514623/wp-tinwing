import React from 'react';
import { IResourceComponentsProps } from '@refinedev/core';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Row, Col, Input, Form, Select, InputNumber } from 'antd';
import UniqueInput from 'components/UniqueInput';
import { DataType as TInsurer } from 'pages/insurers/types';
import { DataType as TTerm } from 'pages/terms/types';

export const EditView: React.FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm();

    const { selectProps: insurerSelectProps } = useSelect<TInsurer>({
        resource: 'insurers',
        optionLabel: 'name',
        optionValue: 'id',
    });

    const { selectProps: termSelectProps } = useSelect<TTerm>({
        resource: 'terms',
        optionLabel: 'name',
        optionValue: 'id',
        filters: [
            // {
            //     field: 'taxonomy',
            //     operator: 'eq',
            //     value: 'insurance_class',
            // },
						{
							field: 'meta_query[0][key]',
							operator: 'eq',
							value: 'taxonomy',
						},
						{
							field: 'meta_query[0][value]',
							operator: 'eq',
							value: 'insurance_class',
						},
						{
							field: 'meta_query[0][compare]',
							operator: 'eq',
							value: '=',
						},
        ],
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Row gutter={24}>
                    <Col span={12}>
                        <UniqueInput
                            formItemProps={{
                                label: 'Insurer Product No.',
                            }}
                            name={['insurer_products_number']}
                        />
                        <Form.Item label="Package" name={['name']}>
                            <Input />
                        </Form.Item>
                        {/* TODO: term_id */}

                        <Form.Item label="Class of Insurance" name={['term_id']}>
                            <Select {...termSelectProps} allowClear />
                        </Form.Item>
                        <Form.Item label="Policy Number" name={['policy_no']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Insurance Amount" name={['insurance_amount']}>
                            <InputNumber className="w-full" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Remark" name={['remark']}>
                            <Input.TextArea autoSize={{ minRows: 6 }} />
                        </Form.Item>
                        {/* TODO: debit_note_ids */}
                        <Form.Item label="Debit Notes" name={['debit_note_ids']}>
                            <Input disabled />
                        </Form.Item>

                        <Form.Item label="Insurer Id" name={['insurer_id']}>
                            <Select {...insurerSelectProps} allowClear />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Edit>
    );
};
