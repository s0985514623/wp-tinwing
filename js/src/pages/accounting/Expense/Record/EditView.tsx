import React from 'react';
import { IResourceComponentsProps, useOne } from '@refinedev/core';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Form, Row, Col, Spin, Input, Select } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { DataType } from '../types';
import { DataType as TTerms } from 'pages/terms/types';
import dayjs from 'dayjs';

const { TextArea } = Input;
export const EditView: React.FC<IResourceComponentsProps> = () => {
    //當前表單的props
    const { formProps, saveButtonProps, queryResult } = useForm();
    const expenseData = queryResult?.data?.data as DataType;
    //terms 資料
    const { data: termsData, isLoading: termsIsLoading } = useOne<TTerms>({
        resource: 'terms',
        id: expenseData?.termId || 0,
    });
    const { selectProps: termsProps } = useSelect<TTerms>({
        resource: 'terms',
        optionLabel: 'name',
        optionValue: 'id',
        filters: [
            {
                field: 'taxonomy',
                operator: 'eq',
                value: 'expense_class',
            },
        ],
    });

    const expenseDate = dayjs.unix(expenseData?.date).format('YYYY-MM-DD');
    const category = termsData?.data?.name || '';
    const amount = expenseData?.amount || 0;
    const remark = expenseData?.remark || '';

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Spin indicator={<LoadingOutlined className="text-2xl" spin />} tip="fetching data..." spinning={!!termsIsLoading}>
                    <Row gutter={0} className="mt-12">
                        <Col span={12}>
                            <div className="table table_td-flex-1 w-full">
                                <Form.Item noStyle hidden name={['id']}></Form.Item>
                                <div className="tr">
                                    <div className="th">Date</div>
                                    <div className="td">{expenseDate}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Category</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['termId']} initialValue={category}>
                                            <Select className="w-1/2" {...termsProps} allowClear />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <div className="th">Amount</div>
                                    <div className="td">
                                        <Form.Item name={['amount']} initialValue={amount}>
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
                                        <Form.Item noStyle name={['remark']} initialValue={remark}>
                                            <TextArea rows={4} />
                                        </Form.Item>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Spin>
            </Form>
        </Edit>
    );
};
