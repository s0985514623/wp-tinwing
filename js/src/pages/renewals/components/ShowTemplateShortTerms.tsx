import React from 'react';
import { Row, Col } from 'antd';
import { round } from 'lodash-es';

import { DataType } from '../types';
import { getGeneralTotalPremium, getPrice } from 'utils';

const ShowTemplateShortTerms: React.FC<{ data?: DataType }> = ({ data: debitNoteData }) => {
    const premium = debitNoteData?.premium || 0;
    const levy = debitNoteData?.levy || 0;
    const less = debitNoteData?.less || 0;
    const extraFieldLabel = debitNoteData?.extraField?.label || '';
    const extraFieldValue = debitNoteData?.extraField?.value || '';
    const totalPremium = getGeneralTotalPremium({
        premium,
        levy,
        less,
        extraValue: Number(extraFieldValue),
    });
    const particulars = debitNoteData?.shortTermsContent || '';
    const particularsArray = particulars.split('\n');
    return (
        <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black ">
            <Row gutter={0}>
                <Col span={12} className="p-2">
                    <p>Particulars</p>
                    <div>{particularsArray?.map((particular, index) => <p key={index}>{particular}</p>) || ''}</div>
                </Col>

                <Col span={12} className="border-l-2 border-solid border-black pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr ">
                            <div className="th">Premium</div>
                            <div className="td text-right"></div>
                            <div className="td">{getPrice(premium)}</div>
                        </div>
                        <div className="tr ">
                            <div className="th">IA Levy</div>
                            <div className="td text-right">{levy}%</div>
                            <div className="td">{getPrice(round(premium * (levy / 100), 2))}</div>
                        </div>
                        <div className={`${extraFieldLabel ? '' : 'hidden'} tr `}>
                            <div className="th">{extraFieldLabel}</div>
                            <div className="td text-right">{extraFieldValue}%</div>
                            <div className="td text-right">{getPrice(round(premium * (Number(extraFieldValue) / 100), 2))}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500 print:text-inherit">Less</div>
                            <div className="td text-right"></div>
                            <div className="td">{getPrice(less)}</div>
                        </div>
                        <div className="tr border-t-2 border-solid border-black flex-wrap">
                            <div className="w-full p-2 font-bold text-xs">請繳付此金額 Please pay this amount</div>
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
