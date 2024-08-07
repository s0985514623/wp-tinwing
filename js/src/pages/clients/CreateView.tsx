import React, { useState, useEffect } from 'react';
import { IResourceComponentsProps } from '@refinedev/core';
import { Create, useForm, useSelect } from '@refinedev/antd';
import { Row, Col, Divider, Form, Input, Select } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import { DataType as TAgent } from 'pages/agents/types';
import UniqueInput from 'components/UniqueInput';

export const CreateView: React.FC<IResourceComponentsProps> = () => {
    const [nameEn, setNameEn] = useState<string>('');
    const [nameZh, setNameZh] = useState<string>('');
    const [company, setCompany] = useState<string>('');
    const { formProps, saveButtonProps, form } = useForm();
    const { selectProps } = useSelect<TAgent>({
        resource: 'agents',
        optionLabel: 'name',
        optionValue: 'id',
    });
    const nameEnEid = Form.useWatch('nameEn', form);
    const nameZhEid = Form.useWatch('nameZh', form);
    const companyEid = Form.useWatch('company', form);
    useEffect(() => {
        setNameEn(nameEnEid);
        setNameZh(nameZhEid);
        setCompany(companyEid);
    }, [nameEnEid, nameZhEid, companyEid]);

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Row gutter={24}>
                    <Col span={12}>
                        <UniqueInput
                            formItemProps={{
                                label: 'Client No.',
                            }}
                            name={['clientNumber']}
                        />
                        <Form.Item label="Chinese Name" name={['nameZh']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="English Name" name={['nameEn']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Address" initialValue={''} name={['addressArr', 0]}>
                            <Input />
                        </Form.Item>
                        <Form.Item initialValue={''} name={['addressArr', 1]}>
                            <Input />
                        </Form.Item>
                        <Form.Item initialValue={''} name={['addressArr', 2]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Company" name={['company']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Office Gen. Line" name={['officeGenLine']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Direct Line" name={['directLine']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Tel" name={['mobile1']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Mobile" name={['mobile2']} rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Display Name" name={['displayName']} initialValue={'nameEn'}>
                            <Select
                                options={[
                                    {
                                        label: (
                                            <div className="flex justify-between">
                                                <span>{nameEn}</span>
                                                <span className="text-gray-500">- English Name</span>
                                            </div>
                                        ),
                                        value: 'nameEn',
                                    },
                                    {
                                        label: (
                                            <div className="flex justify-between">
                                                <span>{nameZh}</span>
                                                <span className="text-gray-500">- Chinese Name</span>
                                            </div>
                                        ),
                                        value: 'nameZh',
                                    },
                                    {
                                        label: (
                                            <div className="flex justify-between">
                                                <span>{company}</span>
                                                <span className="text-gray-500">- Company</span>
                                            </div>
                                        ),
                                        value: 'company',
                                    },
                                ]}
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item label="Remark" name={['remark']}>
                            <Input.TextArea autoSize={{ minRows: 6 }} />
                        </Form.Item>
                        <Form.Item label="Agent" name={['agentId']}>
                            <Select {...selectProps} allowClear />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider plain className="mt-16 mb-8">
                    <IdcardOutlined className="mr-2" />
                    Contacts
                </Divider>
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item label="Contact 2" name={['contact2']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Tel 2" name={['tel2']}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Contact 3" name={['contact3']}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Tel 3" name={['tel3']}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Create>
    );
};
