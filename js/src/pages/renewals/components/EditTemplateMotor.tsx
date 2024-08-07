import React, { useState, useEffect } from 'react';
import { useSelect } from '@refinedev/antd';
import { Row, Col, Select, Form, Input, InputNumber, DatePicker, Tooltip } from 'antd';
import { round } from 'lodash-es';
import dayjs, { Dayjs } from 'dayjs';
import { RangeValue } from 'rc-picker/lib/interface';
import { DataType as TInsurer } from 'pages/insurers/types';
import { getGrossPremium, getMotorTotalPremium, getPrice } from 'utils';
import { InfoCircleFilled } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const EditTemplateMotor = () => {
    const form = Form.useFormInstance();
    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLs = Form.useWatch(['motorAttr', 'ls'], form) || 0;
    const watchNcb = Form.useWatch(['motorAttr', 'ncb'], form) || 0;
    const watchMib = Form.useWatch(['motorAttr', 'mib'], form) || 0;
    const watchExtraField = Form.useWatch(['extraField', 'value'], form) || 0;
    const watchLess = Form.useWatch(['less'], form) || 0;
    const watchPeriodOfInsuranceFrom = Form.useWatch(['periodOfInsuranceFrom'], form);
    const watchPeriodOfInsuranceTo = Form.useWatch(['periodOfInsuranceTo'], form);
    const [periodOfInsuranceProps, setPeriodOfInsuranceProps] = useState<{
        value?: [Dayjs, Dayjs];
    }>({});

    const grossPremium = getGrossPremium({
        premium: watchPremium,
        ls: watchLs,
        ncb: watchNcb,
    });

    const totalPremium = getMotorTotalPremium({
        grossPremium,
        mib: watchMib,
        less: watchLess,
        extraValue: watchExtraField,
    });

    const { selectProps: insurerSelectProps } = useSelect<TInsurer>({
        resource: 'insurers',
        optionLabel: 'name',
        optionValue: 'id',
    });

    const handlePeriodChange = (value: RangeValue<Dayjs>) => {
        if (!!value && !!value[0] && !!value[1]) {
            form.setFieldValue(['periodOfInsuranceFrom'], value[0].unix());
            form.setFieldValue(['periodOfInsuranceTo'], value[1].unix());
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
                                <Form.Item noStyle name={['insurerId']}>
                                    <Select {...insurerSelectProps} size="small" className="w-full" allowClear />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保單號碼 Policy No.</div>
                            <div className="td">
                                <Form.Item noStyle name={['policyNo']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">投保名稱 Name of Insured</div>
                            <div className="td">
                                <Form.Item noStyle name={['nameOfInsured']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">投保金額 Sum Insured</div>
                            <div className="td">
                                <Form.Item noStyle name={['sumInsured']}>
                                    <InputNumber className="w-full" size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">製造年份 Manufacturing Year</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'manufacturingYear']}>
                                    <InputNumber className="w-full" size="small" controls={false} />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">登記號碼 Registration No.</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'registrationNo']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">廠名及型號 Make & Model</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'model']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">容量 / 噸數 CC./ Tonnes </div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'tonnes']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">車身 Body</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'body']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">底盤 Chassi</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'chassi']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">引擎號 Engine Number</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorEngineNo']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">附加設備 Additional Values</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'additionalValues']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">記名司機 Named Driver</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'namedDriver']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">
                                <RangePicker size="small" className="w-full" placeholder={['From', 'To']} onChange={handlePeriodChange} {...periodOfInsuranceProps} />
                                <Form.Item hidden name={['periodOfInsuranceFrom']} initialValue={dayjs().unix()}>
                                    <InputNumber />
                                </Form.Item>
                                <Form.Item hidden name={['periodOfInsuranceTo']} initialValue={dayjs().unix()}>
                                    <InputNumber />
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
                            <div className="th">LS</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'ls']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(watchPremium * (watchLs / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th text-red-500">NCB</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'ncb']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" max={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(watchPremium * (1 + watchLs / 100) * (watchNcb / 100), 2))}</div>
                        </div>

                        <div className="tr mt-10">
                            <div className="th">Gross Premium</div>
                            <div className="td">{getPrice(grossPremium)}</div>
                        </div>
                        <div className="tr">
                            <div className="th">MIB</div>
                            <div className="td">
                                <Form.Item noStyle name={['motorAttr', 'mib']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(grossPremium * (watchMib / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th">
                                <Form.Item noStyle name={['extraField', 'label']}>
                                    <Input className="w-full" size="small" />
                                </Form.Item>
                            </div>
                            <div className="td">
                                <Form.Item noStyle name={['extraField', 'value']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(grossPremium * (watchExtraField / 100), 2))}</div>
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

export default EditTemplateMotor;
