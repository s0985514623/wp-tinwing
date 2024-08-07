import React, { useState } from 'react';
import { IResourceComponentsProps } from '@refinedev/core';
import { Create, useForm, useSelect } from '@refinedev/antd';
import { Form, Select, DatePicker, InputNumber, Input, Alert, Col, Row } from 'antd';
import { Dayjs } from 'dayjs';
import EditTemplateGeneral from './components/EditTemplateGeneral';
import EditTemplateMotor from './components/EditTemplateMotor';
import EditTemplateShortTerms from './components/EditTemplateShortTerms';
import EditTemplatePackage from './components/EditTemplatePackage';
import DebitNoteHeader from './components/EditDebitNoteHeader';
import DetailFooter from 'components/DetailFooter';
import EditMetaMotor from './components/EditMetaMotor';
import EditMetaGeneral from './components/EditMetaGeneral';
import { TTemplate } from './types';
import { DataType as TClient, defaultClient } from 'pages/clients/types';
import { DataType as TAgent } from 'pages/agents/types';
import { DataType as TTerm } from 'pages/terms/types';
import logo from 'assets/images/logo.jpg';
import { getTemplateText } from 'utils';
import { RemarkTextArea } from 'components/RemarkTextArea';
import { useNavigate } from 'react-router-dom';

export const CreateView: React.FC<IResourceComponentsProps> = () => {
    const navigate = useNavigate();
    const { formProps, saveButtonProps, form } = useForm({
        //使新增後跳轉到clientsSummary
        redirect: false,
        onMutationSuccess: () => {
            navigate('/clientsSummary');
        },
    });
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<TTemplate>('general');

    const { selectProps: clientSelectProps, queryResult: clientQueryResult } = useSelect<TClient>({
        resource: 'clients',
        optionLabel: 'displayName', //出來的是nameEn or nameZh 透過這個再去取得真實displayName
        optionValue: 'id',
    });
    //轉換新的clientSelectProps options
    const fxnClientSelectProps = {
        ...clientSelectProps,
        options: clientSelectProps?.options?.map((option) => {
            const displayName = option.label as 'nameEn' | 'nameZh' | 'company';
            return {
                label: clientQueryResult?.data?.data.find((client) => client.id === option.value)?.[displayName],
                value: option.value,
            };
        }),
    };
    const filterOption = (input: string, option?: { label: string; value: string }) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const clients = clientQueryResult?.data?.data || [];
    const selectedClient = clients.find((theClient) => theClient?.id === selectedClientId) || defaultClient;
    //檢查selectedClient?.addressArr是否為array
    if (!Array.isArray(selectedClient?.addressArr)) {
        try {
            selectedClient.addressArr = JSON.parse(selectedClient.addressArr);
        } catch (error) {
            selectedClient.addressArr = [];
            console.log('🚀 ~ error:', error);
        }
    }
    const handleClientSelect = (value: any) => {
        setSelectedClientId(value);
    };

    const { selectProps: agentSelectProps } = useSelect<TAgent>({
        resource: 'agents',
        optionLabel: 'agentNumber',
        optionValue: 'id',
    });

    const handleDateChange = (value: Dayjs | null) => {
        if (!!value) {
            form.setFieldValue(['date'], value.unix());
        }
    };

    const templateText = getTemplateText(selectedTemplate);

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
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <DebitNoteHeader setSelectedTemplate={setSelectedTemplate} />
                <div className="table table_td-flex-1 w-full">
                    <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
                        <div className="w-full">
                            <img src={logo} className="print:w-1/3 min-w-[320px]" />
                        </div>
                        <div className="text-right text-xl font-semibold w-full flex flex-col justify-end">
                            <p>{templateText.zh}</p>
                            <p>{templateText.en}</p>
                        </div>
                    </div>

                    <div className="w-full mb-4 flex justify-between">
                        <div className="flex flex-col justify-end">
                            <p>保險名稱 / 通訊地址</p>
                            <p>Insured / correspondence Address</p>
                        </div>
                        <div className="text-center text-lg font-semibold border-2 border-solid border-black py-2 px-12">
                            <p>到期通知書</p>
                            <p>Expiry Notice</p>
                        </div>
                    </div>
                    <Row gutter={24}>
                        <Col span={12}>
                            <div className="w-full">
                                <Form.Item noStyle name={['clientId']}>
                                    <Select
                                        {...fxnClientSelectProps}
                                        size="small"
                                        className="w-full"
                                        allowClear
                                        onChange={handleClientSelect}
                                        onSearch={(_value: string) => {
                                            // console.log('search:', value);
                                        }}
                                        //TODO 類型問題
                                        filterOption={filterOption as any}
                                    />
                                </Form.Item>
                                <p>{selectedClient?.company || ' '}</p>
                                <p>{selectedClient?.displayName ? selectedClient[selectedClient?.displayName] : ''}</p>
                                {selectedClient?.addressArr?.map((address, index) => <p key={index}>{address}</p>) || ' '}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr">
                                    <div className="th">日期 Date</div>
                                    <div className="td">
                                        <DatePicker className="w-full" size="small" onChange={handleDateChange} />
                                        <Form.Item hidden name={['date']}>
                                            <InputNumber />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <div className="th">號碼 Note No</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['noteNo']}>
                                            <Input className="w-full" size="small" />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <div className="th">保險類別 Class of Insurance</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['termId']}>
                                            <Select {...termSelectProps} size="small" className="w-full" allowClear />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <div className="th">代理 Agent</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['agentId']}>
                                            <Select {...agentSelectProps} size="small" className="w-full" allowClear />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <div className="th">客戶編號 Client No</div>
                                    <div className="td">{selectedClient?.clientNumber || ' '}</div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
                {selectedTemplate === 'general' && <EditTemplateGeneral />}
                {selectedTemplate === 'motor' && <EditTemplateMotor />}
                {selectedTemplate === 'shortTerms' && <EditTemplateShortTerms />}
                {selectedTemplate === 'package' && <EditTemplatePackage />}
                <DetailFooter />
                <Alert className="my-24" message="The following content will NOT be printed out" type="warning" showIcon />
                <RemarkTextArea />
                {selectedTemplate === 'general' && <EditMetaGeneral />}
                {selectedTemplate === 'motor' && <EditMetaMotor />}
            </Form>
        </Create>
    );
};
