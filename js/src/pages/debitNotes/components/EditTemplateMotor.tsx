import React, { useState, useEffect } from 'react';
import { useSelect } from '@refinedev/antd';
import { Row, Col, Select, Form, Input, InputNumber, DatePicker, Tooltip } from 'antd';
import { round } from 'lodash-es';
import dayjs, { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import { DataType as TInsurer } from 'pages/insurers/types';
import { getGrossPremium, getMotorTotalPremium, getPrice } from 'utils';
import { InfoCircleFilled } from '@ant-design/icons';

const { RangePicker } = DatePicker;

// 貨幣選項
const currencyOptions = [
    { label: 'HKD', value: 'HKD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' },
];

const EditTemplateMotor = () => {
    const form = Form.useFormInstance();
    const [currency, setCurrency] = useState<string>('HKD');
    const [sumInsuredAmount, setSumInsuredAmount] = useState<number | null>(null);

    const watchPremium = Form.useWatch(['premium'], form) || 0;
    const watchLs = Form.useWatch(['motor_attr', 'ls'], form) || 0;
    const watchNcb = Form.useWatch(['motor_attr', 'ncb'], form) || 0;
    const watchMib = Form.useWatch(['motor_attr', 'mib'], form) || 0;
    const watchExtraField = Form.useWatch(['extra_field', 'value'], form) || 0;
    const watchLess = Form.useWatch(['less'], form) || 0;
    const watchPeriodOfInsuranceFrom = Form.useWatch(['period_of_insurance_from'], form);
    const watchPeriodOfInsuranceTo = Form.useWatch(['period_of_insurance_to'], form);
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

    // 處理貨幣變更
    const handleCurrencyChange = (value: string) => {
        setCurrency(value);
        updateSumInsured(value, sumInsuredAmount);
    };

    // 處理金額變更
    const handleAmountChange = (value: number | null) => {
        setSumInsuredAmount(value);
        updateSumInsured(currency, value);
    };

    // 更新 sum_insured 表單欄位
    const updateSumInsured = (curr: string, amount: number | null) => {
        if (amount !== null && amount !== undefined) {
            const formattedAmount = amount.toLocaleString();
            const combinedValue = `${curr} ${formattedAmount}`;
            form.setFieldValue(['sum_insured'], combinedValue);
        } else {
            form.setFieldValue(['sum_insured'], '');
        }
    };

    // 監聽 sum_insured 欄位變化來解析現有值
    const watchSumInsured = Form.useWatch(['sum_insured'], form);

    // 解析現有的 sum_insured 值
    useEffect(() => {
        if (watchSumInsured && typeof watchSumInsured === 'string') {
            const match = watchSumInsured.match(/^([A-Z]{3})\s*([\d,]+)$/);
            if (match) {
                const [, curr, amountStr] = match;
                const amount = parseFloat(amountStr.replace(/,/g, ''));
                setCurrency(curr);
                setSumInsuredAmount(amount);
            }
        }
    }, [watchSumInsured]);

    const handlePeriodChange = (value: RangePickerProps['value']) => {
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
            <Row gutter={24} className="mt-12">
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
                            <div className="td flex gap-2">
                                <Select
                                    value={currency}
                                    onChange={handleCurrencyChange}
                                    options={currencyOptions}
                                    size="small"
                                    className="w-20"
                                />
                                <InputNumber
                                    value={sumInsuredAmount}
                                    onChange={handleAmountChange}
                                    className="flex-1"
                                    size="small"
                                    min={0}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => parseFloat(value!.replace(/\$\s?|(,*)/g, '')) || 0}
                                />
                                <Form.Item hidden name={['sum_insured']}>
                                    <Input />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保障範圍 Coverage</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'coverage']}>
                                    <Select
                                        options={[{ label: 'COMPREHENSIVE', value: 'COMPREHENSIVE' },
                                        { label: 'THIRD PARTY ONLY', value: 'THIRD PARTY ONLY' },
                                        { label: 'OTHERS', value: 'OTHERS' }]}
                                        size="small"
                                        className="w-full"
                                    />
                                </Form.Item>
                            </div>
                        </div>

                        <div className="tr">
                            <div className="th">製造年份 Manufacturing Year</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'manufacturingYear']}>
                                    <InputNumber className="w-full" size="small" controls={false} />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">登記號碼 Registration No.</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'registrationNo']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">廠名及型號 Make & Model</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'model']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">容量 / 噸數 CC./ Tonnes </div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'tonnes']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">車身 Body</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'body']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">底盤 Chassi</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'chassi']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">引擎號 Engine Number</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_engine_no']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">附加設備 Additional Values</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'additionalValues']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">記名司機 Named Driver</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'namedDriver']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">保險期限 Period of Insurance</div>
                            <div className="td">
                                <RangePicker size="small" className="w-full" placeholder={['From', 'To']} onChange={handlePeriodChange} {...periodOfInsuranceProps} />
                                <Form.Item hidden name={['period_of_insurance_from']} initialValue={dayjs().unix()}>
                                    <InputNumber />
                                </Form.Item>
                                <Form.Item hidden name={['period_of_insurance_to']} initialValue={dayjs().unix()}>
                                    <InputNumber />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">項目詳情 Particulars</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'particulars']}>
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
                            <div className="th">LS</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'ls']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(watchPremium * (watchLs / 100), 2))}</div>
                        </div>
                        <div className="tr">
                            <div className="th text-red-500">NCB</div>
                            <div className="td">
                                <Form.Item noStyle name={['motor_attr', 'ncb']}>
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
                                <Form.Item noStyle name={['motor_attr', 'mib']}>
                                    <InputNumber className="w-full" size="small" addonAfter="%" min={0} stringMode step="0.01" />
                                </Form.Item>
                            </div>
                            <div className="td">{getPrice(round(grossPremium * (watchMib / 100), 2))}</div>
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
