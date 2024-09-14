import React from 'react';
import { useOne } from '@refinedev/core';
import { Row, Col } from 'antd';
import { round } from 'lodash-es';
import dayjs from 'dayjs';
import { DataType as TInsurer } from 'pages/insurers/types';
import { DataType } from '../types';
import { getGrossPremium, getMotorTotalPremium, getPrice } from 'utils';

const ShowTemplateMotor: React.FC<{ data?: DataType }> = ({ data: debitNoteData }) => {
    const premium = debitNoteData?.premium || 0;
    const ls = debitNoteData?.motor_attr?.ls || 0;
    const ncb = debitNoteData?.motor_attr?.ncb || 0;
    const mib = debitNoteData?.motor_attr?.mib || 0;
    const less = debitNoteData?.less || 0;
    const extra_fieldLabel = debitNoteData?.extra_field?.label || '';
    const extra_fieldValue = debitNoteData?.extra_field?.value || '';

    const grossPremium = getGrossPremium({
        premium,
        ls,
        ncb,
    });
    const totalPremium = getMotorTotalPremium({
        grossPremium,
        mib,
        less,
        extraValue: Number(extra_fieldValue),
    });

    const { data: insurerData } = useOne<TInsurer>({
        resource: 'insurers',
        id: debitNoteData?.insurer_id || 0,
        queryOptions: {
            enabled: !!debitNoteData,
        },
    });
    const insurer = insurerData?.data;

    return (
        <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black">
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
                            <div className="th">製造年份 Manufacturing Year</div>
                            <div className="td">{debitNoteData?.motor_attr?.manufacturingYear}</div>
                        </div>
                        <div className="tr">
                            <div className="th">登記號碼 Registration No.</div>
                            <div className="td">{debitNoteData?.motor_attr?.registrationNo}</div>
                        </div>
                        <div className="tr">
                            <div className="th">廠名及型號 Make & Model</div>
                            <div className="td">{debitNoteData?.motor_attr?.model}</div>
                        </div>
                        <div className="tr">
                            <div className="th">容量 / 噸數 CC./ Tonnes </div>
                            <div className="td">{debitNoteData?.motor_attr?.tonnes}</div>
                        </div>
                        <div className="tr">
                            <div className="th">車身 Body</div>
                            <div className="td">{debitNoteData?.motor_attr?.body}</div>
                        </div>
                        <div className="tr">
                            <div className="th">底盤 Chassi</div>
                            <div className="td">{debitNoteData?.motor_attr?.chassi}</div>
                        </div>
                        <div className="tr">
                            <div className="th">引擎號 Engine Number</div>
                            <div className="td">{debitNoteData?.motor_engine_no}</div>
                        </div>
                        <div className="tr">
                            <div className="th">附加設備 Additional Values</div>
                            <div className="td">{debitNoteData?.motor_attr?.additionalValues}</div>
                        </div>
                        <div className="tr">
                            <div className="th">記名司機 Named Driver</div>
                            <div className="td">{debitNoteData?.motor_attr?.namedDriver}</div>
                        </div>
                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">{`From ${dayjs.unix(debitNoteData?.period_of_insurance_from || dayjs().unix()).format('YYYY-MM-DD')}   To ${dayjs.unix(debitNoteData?.period_of_insurance_to || dayjs().unix()).format('YYYY-MM-DD')}`}</div>
                        </div>
                    </div>
                </Col>

                <Col span={12} className="border-l-2 border-solid border-black pt-2">
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">Premium</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(premium)}</div>
                        </div>
                        <div className="tr">
                            <div className="th">LS</div>
                            <div className="td text-right">{ls ? `${ls}%` : ''}</div>
                            <div className="td text-right">{getPrice(round(premium * (ls / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th text-red-500 print:text-inherit">NCB</div>
                            <div className="td text-right">{ncb ? `${ncb}%` : ''}</div>
                            <div className="td text-right">{getPrice(round(premium * (1 + ls / 100) * (ncb / 100), 2))}</div>
                        </div>

                        <div className="tr mt-10">
                            <div className="th">Gross Premium</div>
                            <div className="td text-right"></div>
                            <div className="td text-right">{getPrice(grossPremium)}</div>
                        </div>
                        <div className="tr">
                            <div className="th">MIB</div>
                            <div className="td text-right">{mib ? `${mib}%` : ''}</div>
                            <div className="td text-right">{getPrice(round(grossPremium * (mib / 100), 2))}</div>
                        </div>
                        <div className={`${extra_fieldLabel ? '' : 'hidden'} tr`}>
                            <div className="th">{extra_fieldLabel}</div>
                            <div className="td text-right">{extra_fieldValue}%</div>
                            <div className="td text-right">{getPrice(round(grossPremium * (Number(extra_fieldValue) / 100), 2))}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500 print:text-inherit">Less</div>
                            <div className="td"></div>
                            <div className="td text-right">{getPrice(less)}</div>
                        </div>
                        <div className="tr absolute bottom-0 border-t-2 border-solid border-black flex-wrap">
                            <div className="w-full p-2 font-bold text-xs">請繳付此金額 Please pay this amount</div>
                            <div className="th font-bold">總保險費 TOTAL PREMIUM</div>
                            <div className="td text-right mr-6">{getPrice(totalPremium)}</div>
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ShowTemplateMotor;
