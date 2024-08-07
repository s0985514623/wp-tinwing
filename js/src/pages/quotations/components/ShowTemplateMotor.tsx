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
    const ls = debitNoteData?.motorAttr?.ls || 0;
    const ncb = debitNoteData?.motorAttr?.ncb || 0;
    const mib = debitNoteData?.motorAttr?.mib || 0;
    const less = debitNoteData?.less || 0;
    const extraFieldLabel = debitNoteData?.extraField?.label || '';
    const extraFieldValue = debitNoteData?.extraField?.value || '';

    const grossPremium = getGrossPremium({
        premium,
        ls,
        ncb,
    });
    const totalPremium = getMotorTotalPremium({
        grossPremium,
        mib,
        less,
        extraValue: Number(extraFieldValue),
    });

    const { data: insurerData } = useOne<TInsurer>({
        resource: 'insurers',
        id: debitNoteData?.insurerId || 0,
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
                            <div className="td">{debitNoteData?.policyNo}</div>
                        </div>
                        <div className="tr">
                            <div className="th">投保名稱 Name of Insured</div>
                            <div className="td">{debitNoteData?.nameOfInsured}</div>
                        </div>
                        <div className="tr">
                            <div className="th">投保金額 Sum Insured</div>
                            <div className="td">{debitNoteData?.sumInsured}</div>
                        </div>
                        <div className="tr">
                            <div className="th">製造年份 Manufacturing Year</div>
                            <div className="td">{debitNoteData?.motorAttr?.manufacturingYear}</div>
                        </div>
                        <div className="tr">
                            <div className="th">登記號碼 Registration No.</div>
                            <div className="td">{debitNoteData?.motorAttr?.registrationNo}</div>
                        </div>
                        <div className="tr">
                            <div className="th">廠名及型號 Make & Model</div>
                            <div className="td">{debitNoteData?.motorAttr?.model}</div>
                        </div>
                        <div className="tr">
                            <div className="th">容量 / 噸數 CC./ Tonnes </div>
                            <div className="td">{debitNoteData?.motorAttr?.tonnes}</div>
                        </div>
                        <div className="tr">
                            <div className="th">車身 Body</div>
                            <div className="td">{debitNoteData?.motorAttr?.body}</div>
                        </div>
                        <div className="tr">
                            <div className="th">底盤 Chassi</div>
                            <div className="td">{debitNoteData?.motorAttr?.chassi}</div>
                        </div>
                        <div className="tr">
                            <div className="th">引擎號 Engine Number</div>
                            <div className="td">{debitNoteData?.motorEngineNo}</div>
                        </div>
                        <div className="tr">
                            <div className="th">附加設備 Additional Values</div>
                            <div className="td">{debitNoteData?.motorAttr?.additionalValues}</div>
                        </div>
                        <div className="tr">
                            <div className="th">記名司機 Named Driver</div>
                            <div className="td">{debitNoteData?.motorAttr?.namedDriver}</div>
                        </div>
                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">{`From ${dayjs.unix(debitNoteData?.periodOfInsuranceFrom || dayjs().unix()).format('YYYY-MM-DD')}   To ${dayjs.unix(debitNoteData?.periodOfInsuranceTo || dayjs().unix()).format('YYYY-MM-DD')}`}</div>
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
                        <div className={`${extraFieldLabel ? '' : 'hidden'} tr`}>
                            <div className="th">{extraFieldLabel}</div>
                            <div className="td text-right">{extraFieldValue}%</div>
                            <div className="td text-right">{getPrice(round(grossPremium * (Number(extraFieldValue) / 100), 2))}</div>
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
