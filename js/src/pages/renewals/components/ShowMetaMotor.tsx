import React from 'react';
import { useShow, useOne } from '@refinedev/core';
import { Row, Col } from 'antd';
import { getGrossPremium, getMotorTotalPremium, getPrice } from 'utils';
import { round } from 'lodash-es';
import { DataType } from '../types';

const ShowMetaMotor = () => {
    const { queryResult } = useShow<DataType>();
    const debitNoteData = queryResult?.data?.data as DataType;

    const premium = debitNoteData?.premium || 0;
    const ls = debitNoteData?.motorAttr?.ls || 0;
    const ncb = debitNoteData?.motorAttr?.ncb || 0;
    const mib = debitNoteData?.motorAttr?.mib || 0;
    const extraFieldLabel = debitNoteData?.extraField?.label || '';
    const extraFieldField = debitNoteData?.extraField?.value || '';
    const less = debitNoteData?.less || 0;
    const insurerId = debitNoteData?.insurerId || 0;
    const insurerFeePercent = debitNoteData?.insurerFeePercent || 0;
    const { data: insurerData } = useOne({
        resource: 'insurers',
        id: insurerId,
        queryOptions: {
            enabled: !!insurerId,
        },
    });
    const insurer = insurerData?.data;

    const insurerPaymentRate = insurerFeePercent ?? insurer?.paymentRate;
    const agentFee = debitNoteData?.agentFee || 0;
    const extraFieldValue = round(premium * (Number(extraFieldField) / 100), 2);
    const grossPremium = getGrossPremium({
        premium,
        ls,
        ncb,
    });

    const mibValue = round(grossPremium * (mib / 100), 2);

    const totalPremium = getMotorTotalPremium({
        grossPremium,
        mib,
        less,
        extraValue: Number(extraFieldField),
    });

    const profit = totalPremium - (mibValue + extraFieldValue + round(grossPremium * (insurerPaymentRate / 100), 2)) - agentFee;
    const margin = round(profit / totalPremium, 2);

    const insurerTotalFee = mibValue + extraFieldValue + round(grossPremium * (insurerPaymentRate / 100), 2);
    return (
        <>
            <Row gutter={24}>
                <Col span={12}>
                    <div className="table table_td-flex-1 w-full mt-12">
                        <div className="tr mt-4">
                            <div className="th">承保公司收取</div>
                            <div className="td text-right">{insurerPaymentRate ? `${insurerPaymentRate}%` : ''}</div>
                            <div className="td text-right">{getPrice(round(grossPremium * (insurerPaymentRate / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th">MIB</div>
                            <div className="td text-right">{mib ? `${mib}%` : ''}</div>
                            <div className="td text-right">{getPrice(mibValue)}</div>
                        </div>
                        <div className={`${extraFieldLabel ? '' : 'hidden'} tr `}>
                            <div className="th">{extraFieldLabel}</div>
                            <div className="td text-right">{extraFieldField}%</div>
                            <div className="td text-right">{getPrice(extraFieldValue)}</div>
                        </div>
                        <div className="tr">
                            <div className="th">該付承保公司款項</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(insurerTotalFee)}</div>
                        </div>
                    </div>
                </Col>
                <Col span={12}>
                    <div className="table table_td-flex-1 w-full mt-12">
                        <div className="tr mt-4">
                            <div className="th">除稅後款項</div>
                            <div className="td text-right">{getPrice(totalPremium - mibValue - extraFieldValue)}</div>
                        </div>
                        <div className="tr">
                            <div className="th"></div>
                            <div className="td text-right">{getPrice(mibValue)}</div>
                        </div>
                        <div className={`${extraFieldLabel ? '' : 'hidden'} tr `}>
                            <div className="th"></div>
                            <div className="td text-right">{getPrice(extraFieldValue)}</div>
                        </div>
                        <div className="tr">
                            <div className="th">實收</div>
                            <div className="td text-right">{getPrice(totalPremium)}</div>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row gutter={24} className="mt-12">
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">AGENT FEE</p>
                    <p className="font-black text-4xl">{getPrice(agentFee, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Profit</p>
                    <p className="font-black text-4xl">{getPrice(profit, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Margin</p>
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin * 100}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default ShowMetaMotor;
