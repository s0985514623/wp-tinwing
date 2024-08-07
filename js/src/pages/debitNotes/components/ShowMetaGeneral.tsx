import React from 'react';
import { useShow, useOne } from '@refinedev/core';
import { Row, Col } from 'antd';
import { getGeneralTotalPremium, getPrice } from 'utils';
import { round } from 'lodash-es';
import { DataType } from '../types';

const ShowMetaGeneral = () => {
    const { queryResult } = useShow<DataType>();
    const debitNoteData = queryResult?.data?.data as DataType;
    // console.log('🚀 ~ debitNoteData:', debitNoteData);
    const premium = debitNoteData?.premium || 0;
    // console.log('🚀 ~ premium:', premium);
    const levy = debitNoteData?.levy || 0;
    const less = debitNoteData?.less || 0;
    const extraFieldLabel = debitNoteData?.extraField?.label || '';
    const extraFieldField = debitNoteData?.extraField?.value || '';
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
    const levyValue = round(premium * (levy / 100), 2);

    const totalPremium = getGeneralTotalPremium({
        premium,
        levy,
        less,
        extraValue: Number(extraFieldField),
    });

    const profit = totalPremium - (levyValue + extraFieldValue + round(totalPremium * (insurerPaymentRate / 100), 2)) - agentFee;
    const margin = round(profit / totalPremium, 2);

    const insurerTotalFee = levyValue + extraFieldValue + round(premium * (insurerPaymentRate / 100), 2);

    return (
        <>
            <div className="table table_td-flex-1 w-full mt-12">
                <div className="tr mt-4">
                    <div className="th">承保公司收取</div>
                    <div className="td flex">
                        <div>{insurerPaymentRate}%</div>
                        <div className="text-right">{getPrice(round(premium * (insurerPaymentRate / 100), 2))}</div>
                    </div>
                    <div className="th">除稅後款項</div>
                    <div className="td flex justify-end">{getPrice(totalPremium - levyValue - extraFieldValue)}</div>
                </div>
                <div className="tr">
                    <div className="th">IA Levy</div>
                    <div className="td flex">
                        <div>{levy}%</div>
                        <div className="text-right">{getPrice(levyValue)}</div>
                    </div>
                    <div className="th"></div>
                    <div className="td flex justify-end">{getPrice(levyValue)}</div>
                </div>
                <div className={`${extraFieldLabel ? '' : 'hidden'} tr `}>
                    <div className="th">{extraFieldLabel}</div>
                    <div className="td flex">
                        <div>{extraFieldField}%</div>
                        <div className="text-right">{getPrice(extraFieldValue)}</div>
                    </div>
                    <div className="th"></div>
                    <div className="td flex justify-end">{getPrice(extraFieldValue)}</div>
                </div>
                <div className="tr">
                    <div className="th">該付承保公司款項</div>
                    <div className="td flex">
                        <div></div>
                        <div className="text-right">{getPrice(insurerTotalFee)}</div>
                    </div>
                    <div className="th">實收</div>
                    <div className="td flex justify-end">{getPrice(totalPremium)}</div>
                </div>
            </div>
            <Row gutter={48} className="mt-12">
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

export default ShowMetaGeneral;
