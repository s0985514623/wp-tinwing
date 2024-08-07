import React from 'react';
import { IResourceComponentsProps, useOne } from '@refinedev/core';
import { Edit, useForm } from '@refinedev/antd';
import { Form, Row, Col, Spin, Switch, Input } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { DataType } from 'pages/receipts/types';
import { DataType as TClient, defaultClient } from 'pages/clients/types';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import { DataType as TInsurer } from 'pages/insurers/types';
import { ReceiptBankSelect } from 'components/ReceiptBankSelect';
import dayjs from 'dayjs';
import { getTotalPremiumByDebitNote, getInsurerPayment } from 'utils';

const { TextArea } = Input;
export const EditView: React.FC<IResourceComponentsProps> = () => {
    //當前表單的props
    const { formProps, saveButtonProps, queryResult } = useForm();
    const receiptData = queryResult?.data?.data as DataType;
    //debitNote 資料
    const { data: debitNoteData, isLoading: debitNoteIsLoading } = useOne<TDebitNote>({
        resource: 'debit_notes',
        id: receiptData?.debitNoteId || 0,
    });
    //insurer 資料
    const { data: insurersData } = useOne<TInsurer>({
        resource: 'insurers',
        id: debitNoteData?.data?.insurerId || 0,
    });
    //client 資料
    const { data: clientResult, isLoading: clientIsLoading } = useOne<TClient>({
        resource: 'clients',
        id: debitNoteData?.data?.clientId || 0,
        queryOptions: {
            enabled: !!debitNoteData?.data?.clientId,
        },
    });
    const debitNoteNo = debitNoteData?.data?.noteNo || '';
    const debitNoteId = receiptData?.debitNoteId || 0;
    const noteNo = receiptData?.receiptNo || receiptData?.id;
    const premium = receiptData?.premium ?? getTotalPremiumByDebitNote(debitNoteData?.data);
    const insurerPayment = getInsurerPayment(receiptData, debitNoteData?.data as TDebitNote, insurersData?.data as TInsurer);
    const selectedClient = clientResult?.data || defaultClient;
    //檢查selectedClient?.addressArr是否為array
    if (!Array.isArray(selectedClient?.addressArr)) {
        try {
            selectedClient.addressArr = JSON.parse(selectedClient.addressArr);
        } catch (error) {
            selectedClient.addressArr = [];
            console.log('🚀 ~ error:', error);
        }
    }
    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <div className="table table_td-flex-1 w-full">
                    <div className="tr">
                        <div className="th">Connected Debit Note</div>
                        <div className="td">
                            <Form.Item noStyle hidden name={['debitNoteId']}></Form.Item>
                            {debitNoteNo || debitNoteId}
                        </div>
                    </div>
                </div>
                <Spin indicator={<LoadingOutlined className="text-2xl" spin />} tip="fetching data..." spinning={!!clientIsLoading && !!debitNoteIsLoading}>
                    <Row gutter={0} className="mt-12">
                        <Col span={12}>
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr mt-4">
                                    <div className="th">Note No</div>
                                    <div className="td">{noteNo}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Note Date</div>
                                    <div className="td">{dayjs.unix(receiptData?.date as number).format('YYYY-MM-DD')}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Insurer</div>
                                    <div className="td">{insurersData?.data?.name}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Premium</div>
                                    <div className="td">{Number(premium).toLocaleString()}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Payment to Insurer</div>
                                    <div className="td">{insurerPayment.toLocaleString()}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Paid</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['isPaid']} initialValue={receiptData?.isPaid} valuePropName="checked">
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                                <div className="tr">
                                    <ReceiptBankSelect className="table table_td-flex-1 w-full" data={receiptData} />
                                </div>
                            </div>
                        </Col>
                        <Col span={12}>
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr mt-4">
                                    <div className="th">Remark:</div>
                                    <div className="td">
                                        <Form.Item noStyle name={['remark']} initialValue={receiptData?.remark}>
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
