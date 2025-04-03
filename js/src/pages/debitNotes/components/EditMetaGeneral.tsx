import { useEffect, useState } from 'react';
import { Row, Col, Form, InputNumber } from 'antd';
import { getGeneralTotalPremium } from 'utils';
import { round } from 'lodash-es';

const EditMetaGeneral = () => {
    const [insurerFee, setInsurerFee] = useState(0);
    const form = Form.useFormInstance();
    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLevy = Form.useWatch(['levy'], form) || 0;
    const watchLess = Form.useWatch(['less'], form) || 0;
    const watchInsurerFeePercent = Form.useWatch(['insurer_fee_percent'], form) || 0;
    const watchExtraField = Form.useWatch(['extra_field', 'value'], form) || 0;
    const watchExtraLabel = Form.useWatch(['extra_field', 'label'], form) || '';
    const watchExtraValue = round(watchPremium * (watchExtraField / 100), 2);
    // console.log('🚀 ~ watchExtraValue:', watchExtraValue);
    const watchAgentFee = Form.useWatch(['agent_fee'], form) || 0;

    const levyValue = round(watchPremium * (watchLevy / 100), 2);

    const totalPremium = getGeneralTotalPremium({
        premium: watchPremium,
        levy: watchLevy,
        less: watchLess,
        extraValue: watchExtraField,
    });

    const profit = totalPremium - (levyValue + watchExtraValue + round(totalPremium * (watchInsurerFeePercent / 100), 2)) - watchAgentFee;
    // console.log('🚀 ~ totalPremium:', totalPremium);
    // console.log('🚀 ~ profit:', profit);
    const margin = round(profit / totalPremium, 2);

    const insurerTotalFee = levyValue + watchExtraValue + round(watchPremium * (watchInsurerFeePercent / 100), 2);

    useEffect(() => {
        setInsurerFee(round(watchPremium * (watchInsurerFeePercent / 100),2));
    }, [watchInsurerFeePercent]);

    const handleChange = (value: number | null) => {
        if (value) {
            setInsurerFee(value);
        }
    };
    const handleBlur = () => {
        form.setFieldValue(['insurer_fee_percent'], round((insurerFee / watchPremium) * 100, 2));
    };

    return (
        <>
            <div className="table table_td-flex-1 w-full mt-12">
                <div className="tr mt-4">
                    <div className="th">承保公司收取</div>
                    <div className="td flex">
                        <div className="mr-2">
                            <Form.Item noStyle name={['insurer_fee_percent']}>
                                <InputNumber className="w-full" size="small" min={0} addonAfter="%" stringMode step="0.01" />
                            </Form.Item>
                        </div>
                        <div>
                            <InputNumber className="w-full" size="small" min={0} addonBefore="HKD" value={insurerFee} onChange={handleChange} onBlur={handleBlur} step="0.01"/>
                        </div>
                    </div>
                    <div className="th">除稅後款項</div>
                    <div className="td">
                        {(totalPremium - levyValue - watchExtraValue).toLocaleString('en-US', {
                            minimumFractionDigits: 2, // 最少小數點後兩位
                            maximumFractionDigits: 2, // 最多小數點後兩位
                        })}
                    </div>
                </div>
                <div className="tr">
                    <div className="th">IA Levy</div>
                    <div className="td flex">
                        <div>{watchLevy}%</div>
                        <div>
                            {levyValue.toLocaleString('en-US', {
                                minimumFractionDigits: 2, // 最少小數點後兩位
                                maximumFractionDigits: 2, // 最多小數點後兩位
                            })}
                        </div>
                    </div>
                    <div className="th"></div>
                    <div className="td">
                        {levyValue.toLocaleString('en-US', {
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
                    <p className="font-black text-4xl">{isNaN(margin) ? 'N/A' : `${margin * 100}%`}</p>
                </Col>
            </Row>
        </>
    );
};

export default EditMetaGeneral;
