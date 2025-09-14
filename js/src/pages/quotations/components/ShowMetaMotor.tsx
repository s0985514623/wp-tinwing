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
    const ls = debitNoteData?.motor_attr?.ls || 0;
    const ncb = debitNoteData?.motor_attr?.ncb || 0;
    const mib = debitNoteData?.motor_attr?.mib || 0;
    const extra_fieldLabel = debitNoteData?.extra_field?.label || '';
    const extra_fieldField = debitNoteData?.extra_field?.value || '';
    const less = debitNoteData?.less || 0;
    const insurer_id = debitNoteData?.insurer_id || 0;
    const insurer_fee_percent = debitNoteData?.insurer_fee_percent || 0;
    const { data: insurerData } = useOne({
        resource: 'insurers',
        id: insurer_id,
        queryOptions: {
            enabled: !!insurer_id,
        },
    });
    const insurer = insurerData?.data;

    const insurerPaymentRate = insurer_fee_percent ?? insurer?.payment_rate;
    const agent_fee = debitNoteData?.agent_fee || 0;
    const extra_fieldValue = round(premium * (Number(extra_fieldField) / 100), 2);
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
        extraValue: Number(extra_fieldField),
    });

    const profit = totalPremium - (mibValue + extra_fieldValue + round(grossPremium * (insurerPaymentRate / 100), 2)) - agent_fee;
    const margin = round(profit *100 / totalPremium, 2);

    const insurerTotalFee = mibValue + extra_fieldValue + round(grossPremium * (insurerPaymentRate / 100), 2);
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
                        <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr `}>
                            <div className="th">{extra_fieldLabel}</div>
                            <div className="td text-right">{extra_fieldField}%</div>
                            <div className="td text-right">{getPrice(extra_fieldValue)}</div>
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
                            <div className="td text-right">{getPrice(totalPremium - mibValue - extra_fieldValue)}</div>
                        </div>
                        <div className="tr">
                            <div className="th"></div>
                            <div className="td text-right">{getPrice(mibValue)}</div>
                        </div>
                        <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr `}>
                            <div className="th"></div>
                            <div className="td text-right">{getPrice(extra_fieldValue)}</div>
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
                    <p className="text-[#000] font-light">AGENT FEE</p>
                    <p className="font-black text-4xl">{getPrice(agent_fee, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#000] font-light">Profit</p>
                    <p className="font-black text-4xl">{getPrice(profit, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#000] font-light">Margin</p>
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default ShowMetaMotor;
