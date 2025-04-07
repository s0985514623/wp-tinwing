import React from 'react';
import { Row, Col, Form, InputNumber } from 'antd';
import { getGrossPremium, getMotorTotalPremium } from 'utils';
import { round } from 'lodash-es';

const EditMetaMotor = () => {
    const form = Form.useFormInstance();
    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLs = Form.useWatch(['motor_attr', 'ls'], form) || 0;
    const watchNcb = Form.useWatch(['motor_attr', 'ncb'], form) || 0;
    const watchMib = Form.useWatch(['motor_attr', 'mib'], form) || 0;
    const watchExtraLabel = Form.useWatch(['extra_field', 'label'], form) || '';
    const watchExtraField = Form.useWatch(['extra_field', 'value'], form) || 0;
    const watchExtraValue = round(watchPremium * (watchExtraField / 100), 2);
    const watchLess = Form.useWatch(['less'], form) || 0;
    const watchAgentFee = Form.useWatch(['agent_fee'], form) || 0;
    const watchInsurerFeePercent = Form.useWatch(['insurer_fee_percent'], form) || 0;

    const grossPremium = getGrossPremium({
        premium: watchPremium,
        ls: watchLs,
        ncb: watchNcb,
    });

    const mibValue = round(grossPremium * (watchMib / 100), 2);

    const totalPremium = getMotorTotalPremium({
        grossPremium,
        mib: watchMib,
        less: watchLess,
        extraValue: watchExtraField,
    });

    const profit = totalPremium - (mibValue + watchExtraValue + round(grossPremium * (watchInsurerFeePercent / 100), 2)) - watchAgentFee;
    // console.log('🚀 ~ profit:', profit);
    const margin = round(profit *100 / totalPremium, 2);

    const insurerFee = round(grossPremium * (watchInsurerFeePercent / 100), 2);
    const insurerTotalFee = mibValue + watchExtraValue + round(grossPremium * (watchInsurerFeePercent / 100), 2);

    return (
        <>
            <div className="table table_td-flex-1 w-full mt-12">
                <div className="tr mt-4">
                    <div className="th">承保公司收取</div>
                    <div className="td flex">
                        <div>
                            <Form.Item noStyle name={['insurer_fee_percent']}>
                                <InputNumber className="w-full" size="small" min={0} addonAfter="%" step="0.01"/>
                            </Form.Item>
                        </div>
                        <div>
                            {isNaN(insurerFee)
                                ? ''
                                : insurerFee.toLocaleString('en-US', {
                                      minimumFractionDigits: 2, // 最少小數點後兩位
                                      maximumFractionDigits: 2, // 最多小數點後兩位
                                  })}
                        </div>
                    </div>
                    <div className="th">除稅後款項</div>
                    <div className="td">
                        {(totalPremium - mibValue - watchExtraValue).toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </div>
                </div>
                <div className="tr">
                    <div className="th">MIB</div>
                    <div className="td flex">
                        <div>{watchMib}%</div>
                        <div>
                            {mibValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2, // 最少小數點後兩位
                                maximumFractionDigits: 2, // 最多小數點後兩位
                            })}
                        </div>
                    </div>
                    <div className="th"></div>
                    <div className="td">
                        {mibValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </div>
                </div>
                <div className={`${watchExtraLabel ? '' : 'hidden'} tr `}>
                    <div className="th">{watchExtraLabel}</div>
                    <div className="td flex">
                        <div>{watchExtraField}%</div>
                        <div>
                            {watchExtraValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2, // 最少小數點後兩位
                                maximumFractionDigits: 2, // 最多小數點後兩位
                            })}
                        </div>
                    </div>
                    <div className="th"></div>
                    <div className="td">
                        {watchExtraValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </div>
                </div>
                <div className="tr">
                    <div className="th">該付承保公司款項</div>
                    <div className="td flex">
                        <div></div>
                        <div>
                            {isNaN(insurerTotalFee)
                                ? ''
                                : insurerTotalFee.toLocaleString('en-US', {
                                      minimumFractionDigits: 2, // 最少小數點後兩位
                                      maximumFractionDigits: 2, // 最多小數點後兩位
                                  })}
                        </div>
                    </div>
                    <div className="th">實收</div>
                    <div className="td">
                        {totalPremium.toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </div>
                </div>
            </div>
            <Row gutter={24} className="mt-12">
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">AGENT FEE</p>
                    <div>
                        <Form.Item noStyle name={['agent_fee']}>
                            <InputNumber className="w-full" size="large" min={0} />
                        </Form.Item>
                    </div>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Profit</p>
                    <p className="font-black text-4xl">
                        {profit.toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </p>
                </Col>
                <Col span={8} className="text-center">
                    <p className="text-[#555] font-light">Margin</p>
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default EditMetaMotor;
