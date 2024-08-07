import React from 'react';
import { Row, Col, Form, InputNumber } from 'antd';
import { getGrossPremium, getMotorTotalPremium } from 'utils';
import { round } from 'lodash-es';

const EditMetaMotor = () => {
    const form = Form.useFormInstance();
    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLs = Form.useWatch(['motorAttr', 'ls'], form) || 0;
    const watchNcb = Form.useWatch(['motorAttr', 'ncb'], form) || 0;
    const watchMib = Form.useWatch(['motorAttr', 'mib'], form) || 0;
    const watchExtraLabel = Form.useWatch(['extraField', 'label'], form) || '';
    const watchExtraField = Form.useWatch(['extraField', 'value'], form) || 0;
    const watchExtraValue = round(watchPremium * (watchExtraField / 100), 2);
    const watchLess = Form.useWatch(['less'], form) || 0;
    const watchAgentFee = Form.useWatch(['agentFee'], form) || 0;
    const watchInsurerFeePercent = Form.useWatch(['insurerFeePercent'], form) || 0;

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
    const margin = round(profit / totalPremium, 2);

    const insurerFee = round(grossPremium * (watchInsurerFeePercent / 100), 2);
    const insurerTotalFee = mibValue + watchExtraValue + round(grossPremium * (watchInsurerFeePercent / 100), 2);

    return (
        <>
            <div className="table table_td-flex-1 w-full mt-12">
                <div className="tr mt-4">
                    <div className="th">承保公司收取</div>
                    <div className="td flex">
                        <div>
                            <Form.Item noStyle name={['insurerFeePercent']}>
                                <InputNumber className="w-full" size="small" min={0} addonAfter="%" />
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
                        <Form.Item noStyle name={['agentFee']}>
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
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin * 100}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default EditMetaMotor;
