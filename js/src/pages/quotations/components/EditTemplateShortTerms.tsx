import React from 'react';
import { useForm } from '@refinedev/antd';
import { Row, Col, Form, Input, InputNumber, Tooltip } from 'antd';
import { round } from 'lodash-es';
import { InfoCircleFilled } from '@ant-design/icons';
import { getGeneralTotalPremium, getPrice } from 'utils';

const { TextArea } = Input;

const EditTemplateGeneral = () => {
    const form = Form.useFormInstance();
    const { queryResult } = useForm();
    const extra_fieldLabel = queryResult?.data?.data?.extra_field?.label || '';
    const extra_fieldValue = queryResult?.data?.data?.extra_field?.value || '';
    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLevy = Form.useWatch(['levy'], form) || 0;
    const watchExtraField = Form.useWatch(['extra_field', 'value'], form) || 0;
    const watchLess = Form.useWatch(['less'], form) || 0;
    const totalPremium = getGeneralTotalPremium({
        premium: watchPremium,
        levy: watchLevy,
        less: watchLess,
        extraValue: watchExtraField,
    });

    return (
        <>
            <Row gutter={0} className="mt-12">
                <Col span={12} className="pr-2">
                    <p>Particulars</p>
                    <Form.Item noStyle name={['short_terms_content']}>
                        <TextArea showCount className="h-60 mb-6" />
                    </Form.Item>
                </Col>

                <Col span={12}>
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">Premium</div>
                            <div className="td"></div>
                            <div className="td">
                                <Form.Item noStyle name={['premium']}>
                                    <InputNumber addonBefore="HKD" className="w-full" size="small" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">IA Levy</div>
                            <div className="td">
                                <Form.Item noStyle name={['levy']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(watchPremium * (watchLevy / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th">
                                <Form.Item noStyle name={['extra_field', 'label']} initialValue={extra_fieldLabel}>
                                    <Input className="w-full" size="small" />
                                </Form.Item>
                            </div>
                            <div className="td">
                                <Form.Item noStyle name={['extra_field', 'value']} initialValue={extra_fieldValue}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(watchPremium * (watchExtraField / 100), 2))}</div>
                        </div>
                        <div className="tr mt-10">
                            <div className="th text-red-500">
                                Less
                                <Tooltip title="請輸入負數，若填寫大於0的數字會自動變為0">
                                    <InfoCircleFilled className="ml-2 text-orange-400" />
                                </Tooltip>
                            </div>
                            <div className="td"></div>
                            <div className="td">
                                <Form.Item noStyle name={['less']}>
                                    <InputNumber addonBefore="HKD" className="w-full" size="small" max={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr absolute bottom-0">
                            <div className="th font-bold">總保險費 TOTAL PREMIUM</div>
                            <div className="td"></div>
                            <div className="td">{getPrice(totalPremium)}</div>
                        </div>
                    </div>
                </Col>
            </Row>
        </>
    );
};

export default EditTemplateGeneral;
