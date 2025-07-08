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
    const extra_fieldLabel = debitNoteData?.extra_field?.label || '';
    const extra_fieldField = debitNoteData?.extra_field?.value || '';
    const extra_fieldField2 = debitNoteData?.extra_field2?.value || '';
    const extra_fieldLabel2 = debitNoteData?.extra_field2?.label || '';
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
    const extra_fieldValue2 = round(premium * (Number(extra_fieldField2) / 100), 2);
    const levyValue = round(premium * (levy / 100), 2);

    const totalPremium = getGeneralTotalPremium({
        premium,
        levy,
        less,
        extraValue: Number(extra_fieldField),
        extraValue2: Number(extra_fieldField2),
    });

	const insurerTotalFee = levyValue + extra_fieldValue + round(premium * (insurerPaymentRate / 100), 2);
    const profit = totalPremium - insurerTotalFee - agent_fee;
    const margin = round(profit *100 / totalPremium, 2);



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
                    <div className="td flex justify-end">{getPrice(totalPremium - levyValue - extra_fieldValue)}</div>
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
                <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr `}>
                    <div className="th">{extra_fieldLabel}</div>
                    <div className="td flex">
                        <div>{extra_fieldField}%</div>
                        <div className="text-right">{getPrice(extra_fieldValue)}</div>
                    </div>
                    <div className="th"></div>
                    <div className="td flex justify-end">{getPrice(extra_fieldValue)}</div>
                </div>
                <div className={`${extra_fieldLabel2 ? '' : 'tw-hidden'} tr `}>
                    <div className="th">{extra_fieldLabel2}</div>
                    <div className="td flex">
                        <div>{extra_fieldField2}%</div>
                        <div className="text-right">{getPrice(extra_fieldValue2)}</div>
                    </div>
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
                    <p className="font-black text-4xl">{getPrice(agent_fee, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Profit</p>
                    <p className="font-black text-4xl">{getPrice(profit, 'w-full')}</p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Margin</p>
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default ShowMetaGeneral;
