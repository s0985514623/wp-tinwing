import React from 'react';
import { Row, Col } from 'antd';
import { round } from 'lodash-es';

import { DataType } from '../types';
import { getGeneralTotalPremium, getPrice } from 'utils';

const ShowTemplatePackage: React.FC<{ data?: DataType }> = ({ data: debitNoteData }) => {
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
            <Row gutter={24}>
                <Col span={14} className="p-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">
                                <p>詳情 Particulars</p>
                            </div>
                            <div className="td">
                                <p>{particularsArray?.map((particular, index) => <p key={index}>{particular}</p>) || ''}</p>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col span={10} className="border-l-2 border-solid border-black pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th w-[18rem]">保費 Premium</div>
                            {/* <div className="td text-right"></div> */}
                            <div className="td text-right">{getPrice(premium, 'w-full')}</div>
                        </div>
                        <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr`}>
                            <div className="th w-[18rem]">{extra_fieldLabel} {extra_fieldValue ? ` ${round(Number(extra_fieldValue), 2).toFixed(2)}%` : ''}</div>
                            {/* <div className="td text-right">{round(Number(extra_fieldValue), 2)}%</div> */}
                            <div className="td text-right">{getPrice(round(premium * (Number(extra_fieldValue) / 100), 2), 'w-full')}</div>
                        </div>
                        <div className={`${extra_field2Label ? '' : 'tw-hidden'} tr`}>
                            <div className="th w-[18rem]">{extra_field2Label} {extra_field2Value ? ` ${round(Number(extra_field2Value), 2).toFixed(2)}%` : ''}</div>
                            {/* <div className="td text-right">{extra_field2Value}%</div> */}
                            <div className="td text-right">{getPrice(round(premium * (Number(extra_field2Value) / 100), 2), 'w-full')}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500 print:text-inherit w-[18rem]">折扣 Less</div>
                            {/* <div className="td text-right"></div> */}
                            <div className="td">{getPrice(less, 'w-full')}</div>
                        </div>
                        <div className="tr  border-t-2 border-solid border-black flex-wrap">
                            <div className="w-full font-semibold p-2 text-xs print:text-lg">退回此金額 The amount return</div>
                            <div className="th w-[18rem]">退回保費 RETURN PREMIUM</div>
                            {/* <div className="td text-right"></div> */}
                            <div className="td">{getPrice(totalPremium, 'w-full')}</div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ShowTemplatePackage;
