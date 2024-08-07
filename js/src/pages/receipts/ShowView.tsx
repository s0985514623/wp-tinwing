import React, { useRef } from 'react';
import { IResourceComponentsProps, useOne, useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Row, Col, Alert, Button, Spin } from 'antd';
import { LoadingOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataType } from './types';
import { DataType as TClient, defaultClient } from 'pages/clients/types';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import { getDisplayName, getTotalPremiumByDebitNote, getTemplateText } from 'utils';
import ReactToPrint from 'react-to-print';
import logo from 'assets/images/logo.jpg';
import DetailFooter from 'components/DetailFooter';
import { ToWords } from 'to-words';
import autograph from 'assets/images/autograph.jpg';
import { ReceiptBankSelect } from 'components/ReceiptBankSelect';

export const ShowView: React.FC<IResourceComponentsProps> = () => {
    const toWords = new ToWords();
    const { queryResult } = useShow<DataType>();
    const receiptData = queryResult?.data?.data as DataType;
    const isLoading = queryResult?.isLoading;

    const { data: debitNoteData } = useOne<TDebitNote>({
        resource: 'debit_notes',
        id: receiptData?.debitNoteId || 0,
        queryOptions: {
            enabled: !!receiptData,
        },
    });
    const receiptPremium = queryResult?.data?.data.premium;
    const debitNote = debitNoteData?.data;
    const debitNoteNo = debitNote?.noteNo || '';
    const templateText = getTemplateText(debitNote?.template || 'general');

    const { data: clientData } = useOne<TClient>({
        resource: 'clients',
        id: debitNote?.clientId || 0,
        queryOptions: {
            enabled: !!debitNote,
        },
    });
    const client = clientData?.data || defaultClient;
    const displayName = getDisplayName(client);

    const printRef = useRef<HTMLDivElement>(null);
    //檢查selectedClient?.addressArr是否為array
    if (!Array.isArray(client?.addressArr)) {
        try {
            client.addressArr = JSON.parse(client.addressArr);
        } catch (error) {
            client.addressArr = [];
            console.log('🚀 ~ error:', error);
        }
    }
    return (
        <Show
            title="Preview Print"
            isLoading={isLoading}
            footerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <ReactToPrint
                        trigger={() => (
                            <Button type="primary" size="large" className="px-12" danger icon={<PrinterOutlined />}>
                                Print
                            </Button>
                        )}
                        content={() => printRef.current}
                    />
                </>
            )}>
            <div className="table table_td-flex-1 w-full">
                <div className="tr">
                    <div className="th">Connected Debit Note</div>
                    <div className="td flex justify-between">
                        <span>{debitNoteNo}</span>
                        <span>{displayName}</span>
                    </div>
                    <div className="th"></div>
                    <div className="td"></div>
                </div>
            </div>

            <Alert className="my-24" message="The following content will be printed out" type="warning" showIcon />

            <Spin indicator={<LoadingOutlined className="text-2xl" spin />} tip="fetching data..." spinning={isLoading}>
                <div ref={printRef} className="w-full">
                    <div className="table table_td-flex-1 w-full">
                        <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
                            <div className="w-full">
                                <img src={logo} className="print:w-1/3 min-w-[400px]" />
                            </div>
                            <div className="text-right text-xl font-semibold w-full flex flex-col justify-end">
                                <p>{templateText.zh}</p>
                                <p>{templateText.en}</p>
                            </div>
                        </div>

                        <div className="text-center font-bold mb-8 print:mb-16 print:mt-8">
                            <h1 className="text-xl">OFFICIAL RECEIPT</h1>
                        </div>
                        <div className="tr">
                            <div className="th">To 致</div>
                            <div className="td">
                                <p>{client?.company}</p>
                                <p>{client?.nameEn || client?.nameZh || ' '}</p>
                            </div>
                            <div className="th">Receipt No 號碼</div>
                            <div className="td">{receiptData?.receiptNo}</div>
                        </div>

                        <div className="tr">
                            <div className="th">Address 地址</div>
                            <div className="td">
                                <p>{client?.addressArr?.map((address, index) => <p key={index}>{address}</p>) || ' '}</p>
                            </div>
                            <div className="th">Date 日期</div>
                            <div className="td">{!!receiptData?.date ? dayjs.unix(receiptData?.date).format('YYYY-MM-DD') : ''}</div>
                        </div>
                    </div>

                    <Row gutter={0} className="mt-12 pb-6 border-2 border-solid border-black">
                        <Col span={12}>
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr mt-4">
                                    <div className="th">Received From 茲收到</div>
                                    <div className="td">{displayName}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">THE SUM OF 款項</div>
                                    <div className="td">{toWords.convert(getTotalPremiumByDebitNote(debitNote))}</div>
                                </div>
                                <div className="tr">
                                    <div className="th w-60">BEING PAYMENT OF 用以支付項目</div>
                                </div>
                                <div className="tr">
                                    <div className="th w-60">POLICY 保單號碼</div>
                                    <div className="td">{debitNote?.policyNo}</div>
                                </div>
                                <div className="tr">
                                    <div className="th w-60">DEBIT NOTE NO. 保費單號碼</div>
                                    <div className="td">{debitNoteNo}</div>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={0} className="">
                        <Col span={12} className="pt-6 border-l-2 border-b-2 border-solid border-black">
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr mt-4">
                                    <div className="th">Payment Date</div>
                                    <div className="td">{!!receiptData?.paymentDate ? dayjs.unix(receiptData?.paymentDate).format('YYYY-MM-DD') : ''}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Payment Method</div>
                                    <div className="td">{receiptData?.paymentMethod}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Cheque No</div>
                                    <div className="td">{receiptData?.chequeNo}</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Code No</div>
                                    <div className="td">{receiptData?.codeNo}</div>
                                </div>
                            </div>
                        </Col>
                        <Col span={12} className="pt-6 border-r-2 border-b-2 border-solid border-black">
                            <div className="table table_td-flex-1 w-full">
                                <div className="tr mt-4">
                                    <div className="th">PREMIUM 保費</div>
                                    <div className="td">
                                        HKD{' '}
                                        {Number(
                                            receiptPremium ??
                                                getTotalPremiumByDebitNote(debitNote).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2, // 最少小數點後兩位
                                                    maximumFractionDigits: 2, // 最多小數點後兩位
                                                }),
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col span={12} offset={12}>
                            <div className="p-8">
                                <p>For and on behalf of </p>
                                <p>POTENTIAL INSURANCE AGENCY COMPANY</p>
                            </div>
                            <div className="p-8 block">
                                <div>
                                    <img src={autograph} alt="" className=" w-20" />
                                </div>
                                <span className="border-0 border-t border-solid border-black">Authorized Signature</span>
                            </div>
                        </Col>
                    </Row>
                </div>
                <Alert className="my-24" message="The following content will NOT be printed out" type="warning" showIcon />
                <ReceiptBankSelect data={receiptData} model="show" />
                <DetailFooter model={false} />
            </Spin>
        </Show>
    );
};
