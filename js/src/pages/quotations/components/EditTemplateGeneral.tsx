import React, { useState, useEffect } from 'react';
import { useSelect } from '@refinedev/antd';
import { Row, Col, Select, Form, Input, InputNumber, DatePicker, Tooltip } from 'antd';
import { round } from 'lodash-es';
import dayjs, { Dayjs } from 'dayjs';
import { RangeValue } from 'rc-picker/lib/interface';
import { DataType as TInsurer } from 'pages/insurers/types';
import { getGeneralTotalPremium, getPrice } from 'utils';
import { InfoCircleFilled } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const EditTemplateShortTerms = () => {
    const form = Form.useFormInstance();
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
    const watchPeriodOfInsuranceFrom = Form.useWatch(['period_of_insurance_from'], form);
    const watchPeriodOfInsuranceTo = Form.useWatch(['period_of_insurance_to'], form);

    const [periodOfInsuranceProps, setPeriodOfInsuranceProps] = useState<{
        value?: [Dayjs, Dayjs];
    }>({});

    const { selectProps: insurerSelectProps } = useSelect<TInsurer>({
        resource: 'insurers',
        optionLabel: 'name',
        optionValue: 'id',
    });

    const handlePeriodChange = (value: RangeValue<Dayjs>) => {
        if (!!value && !!value[0] && !!value[1]) {
            form.setFieldValue(['period_of_insurance_from'], value[0].unix());
            form.setFieldValue(['period_of_insurance_to'], value[1].unix());
            setPeriodOfInsuranceProps({
                value: [value[0], value[1]],
            });
        }
    };

    useEffect(() => {
        if (watchPeriodOfInsuranceFrom && watchPeriodOfInsuranceTo) {
            setPeriodOfInsuranceProps({
                value: [dayjs.unix(watchPeriodOfInsuranceFrom), dayjs.unix(watchPeriodOfInsuranceTo)],
            });
        }
    }, [watchPeriodOfInsuranceFrom, watchPeriodOfInsuranceTo]);

    return (
        <>
            <Row gutter={0} className="mt-12">
                <Col span={12}>
                    <div className="table table_td-flex-1 w-full">
                        <div className="tr">
                            <div className="th">承保公司 Insurer</div>
                            <div className="td">
                                <Form.Item noStyle name={['insurer_id']}>
                                    <Select {...insurerSelectProps} size="small" className="w-full" allowClear />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保單號碼 Policy No.</div>
                            <div className="td">
                                <Form.Item noStyle name={['policy_no']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">投保名稱 Name of Insured</div>
                            <div className="td">
                                <Form.Item noStyle name={['name_of_insured']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">投保金額 Sum Insured</div>
                            <div className="td">
                                <Form.Item noStyle name={['sum_insured']}>
                                    <InputNumber className="w-full" size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">
                                <RangePicker size="small" className="w-full" placeholder={['From', 'To']} onChange={handlePeriodChange} {...periodOfInsuranceProps} />
                                <Form.Item hidden name={['period_of_insurance_from']}>
                                    <InputNumber />
                                </Form.Item>
                                <Form.Item hidden name={['period_of_insurance_to']}>
                                    <InputNumber />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">Particulars</div>
                            <div className="td">
                                <Form.Item noStyle name={['particulars']}>
                                    <Input.TextArea className="h-32" />
                                </Form.Item>
                            </div>
                        </div>
                    </div>
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
                                <Form.Item noStyle name={['extra_field', 'label']}>
                                    <Input className="w-full" size="small" />
                                </Form.Item>
                            </div>
                            <div className="td">
                                <Form.Item noStyle name={['extra_field', 'value']}>
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

export default EditTemplateShortTerms;
