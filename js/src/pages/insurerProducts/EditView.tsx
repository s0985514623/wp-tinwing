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
            {
                field: 'taxonomy',
                operator: 'eq',
                value: 'insurance_class',
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
                            name={['insurerProductsNumber']}
                        />
                        <Form.Item label="Package" name={['name']}>
                            <Input />
                        </Form.Item>
                        {/* TODO: termId */}

                        <Form.Item label="Class of Insurance" name={['termId']}>
                            <Select {...termSelectProps} allowClear />
                        </Form.Item>
                        <Form.Item label="Policy Number" name={['policyNo']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Insurance Amount" name={['insuranceAmount']}>
                            <InputNumber className="w-full" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Remark" name={['remark']}>
                            <Input.TextArea autoSize={{ minRows: 6 }} />
                        </Form.Item>
                        {/* TODO: debitNoteIds */}
                        <Form.Item label="Debit Notes" name={['debitNoteIds']}>
                            <Input disabled />
                        </Form.Item>

                        <Form.Item label="Insurer Id" name={['insurerId']}>
                            <Select {...insurerSelectProps} allowClear />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Edit>
    );
};
