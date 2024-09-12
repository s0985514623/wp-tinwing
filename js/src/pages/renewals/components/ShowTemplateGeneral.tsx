import React from 'react';
import { useOne } from '@refinedev/core';
import { Row, Col } from 'antd';
import { round } from 'lodash-es';
import dayjs from 'dayjs';
import { DataType as TInsurer } from 'pages/insurers/types';
import { DataType } from '../types';
import { getGeneralTotalPremium, getPrice } from 'utils';

const ShowTemplateGeneral: React.FC<{ data?: DataType }> = ({ data: debitNoteData }) => {
    const { data: insurerData } = useOne<TInsurer>({
        resource: 'insurers',
        id: debitNoteData?.insurer_id || 0,
        queryOptions: {
            enabled: !!debitNoteData,
        },
    });
    const insurer = insurerData?.data;

    const premium = debitNoteData?.premium || 0;
    const levy = debitNoteData?.levy || 0;
    const less = debitNoteData?.less || 0;
    const extra_fieldLabel = debitNoteData?.extra_field?.label || '';
    const extra_fieldValue = debitNoteData?.extra_field?.value || '';
    const particulars = debitNoteData?.particulars || '';
    const particularsArray = particulars.split('\n');
    const totalPremium = getGeneralTotalPremium({
        premium,
        levy,
        less,
        extraValue: Number(extra_fieldValue),
    });

    return (
        <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black ">
            <Row gutter={0}>
                <Col span={12} className="pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">承保公司 Insurer</div>
                            <div className="td">{insurer?.name}</div>
                        </div>
                        <div className="tr">
                            <div className="th">保單號碼 Policy No.</div>
                            <div className="td">{debitNoteData?.policy_no}</div>
                        </div>
                        <div className="tr">
                            <div className="th">投保名稱 Name of Insured</div>
                            <div className="td">{debitNoteData?.name_of_insured}</div>
                        </div>
                        <div className="tr">
                            <div className="th">投保金額 Sum Insured</div>
                            <div className="td">{debitNoteData?.sum_insured}</div>
                        </div>

                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">{`From ${dayjs.unix(debitNoteData?.period_of_insurance_from || dayjs().unix()).format('YYYY-MM-DD')}   To ${dayjs.unix(debitNoteData?.period_of_insurance_to || dayjs().unix()).format('YYYY-MM-DD')}`}</div>
                        </div>
                        <div className="tr">
                            <div className="th">Particulars</div>
                            <div className="td">{particularsArray?.map((particular, index) => <p key={index}>{particular}</p>) || ''}</div>
                        </div>
                    </div>
                </Col>

                <Col span={12} className="border-l-2 border-solid border-black pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr ">
                            <div className="th">Premium</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(premium)}</div>
                        </div>
                        <div className="tr ">
                            <div className="th">IA Levy</div>
                            <div className="td text-right">{levy}%</div>
                            <div className="td text-right">{getPrice(round(premium * (levy / 100), 2))}</div>
                        </div>
                        <div className={`${extra_fieldLabel ? '' : 'hidden'} tr `}>
                            <div className="th">{extra_fieldLabel}</div>
                            <div className="td text-right">{extra_fieldValue}%</div>
                            <div className="td text-right">{getPrice(round(premium * (Number(extra_fieldValue) / 100), 2))}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500 print:text-inherit">Less</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(less)}</div>
                        </div>
                        <div className="tr border-t-2 border-solid border-black flex-wrap">
                            <div className="w-full p-2 font-bold text-xs">請繳付此金額 Please pay this amount</div>
                            <div className="th font-bold">總保險費 TOTAL PREMIUM</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(totalPremium)}</div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ShowTemplateGeneral;
