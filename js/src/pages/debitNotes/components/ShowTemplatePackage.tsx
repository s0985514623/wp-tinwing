import React from 'react';
import { Row, Col } from 'antd';
import { round } from 'lodash-es';

import { DataType } from '../types';
import { getGeneralTotalPremium, getPrice } from 'utils';

const ShowTemplateShortTerms: React.FC<{ data?: DataType }> = ({ data: debitNoteData }) => {
    const premium = debitNoteData?.premium || 0;
    const levy = debitNoteData?.levy || 0;
    const less = debitNoteData?.less || 0;
    const extra_fieldLabel = debitNoteData?.extra_field?.label || '';
    const extra_fieldValue = debitNoteData?.extra_field?.value || '';
    const extra_field2Label = debitNoteData?.extra_field2?.label || '';
    const extra_field2Value = debitNoteData?.extra_field2?.value || '';
    const totalPremium = getGeneralTotalPremium({
        premium,
        levy,
        less,
        extraValue: Number(extra_fieldValue),
        extraValue2: Number(extra_field2Value),
    });
    const particulars = debitNoteData?.package_content || '';
    const particularsArray = particulars.split('\n');
    return (
        <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black">
            <Row gutter={0}>
                <Col span={12} className="p-2">
                    <p>Particulars</p>
                    <div>{particularsArray?.map((particular, index) => <p key={index}>{particular}</p>) || ''}</div>
                </Col>

                <Col span={12} className="border-l-2 border-solid border-black pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">Premium</div>
                            <div className="td text-right"></div>
                            <div className="td">{getPrice(premium)}</div>
                        </div>
                        <div className={`${extra_fieldLabel ? '' : 'hidden'} tr`}>
                            <div className="th">{extra_fieldLabel}</div>
                            <div className="td text-right">{extra_fieldValue}%</div>
                            <div className="td text-right">{getPrice(round(premium * (Number(extra_fieldValue) / 100), 2))}</div>
                        </div>
                        <div className={`${extra_field2Label ? '' : 'hidden'} tr`}>
                            <div className="th">{extra_field2Label}</div>
                            <div className="td text-right">{extra_field2Value}%</div>
                            <div className="td text-right">{getPrice(round(premium * (Number(extra_field2Value) / 100), 2))}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500 print:text-inherit">Less</div>
                            <div className="td text-right"></div>
                            <div className="td">{getPrice(less)}</div>
                        </div>
                        <div className="tr  border-t-2 border-solid border-black flex-wrap">
                            <div className="w-full p-2 font-bold text-xs print:text-lg">請繳付此金額 Please pay this amount</div>
                            <div className="th font-bold">總保險費 TOTAL PREMIUM</div>
                            <div className="td text-right"></div>
                            <div className="td">{getPrice(totalPremium)}</div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ShowTemplateShortTerms;
