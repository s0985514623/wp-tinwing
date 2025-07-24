import  { useState, useEffect } from 'react';
import { useSelect } from '@refinedev/antd';
import { Row, Col, Select, Form, Input, InputNumber, DatePicker, Tooltip } from 'antd';
import { round } from 'lodash-es';
import { Dayjs } from 'dayjs';
import { DataType as TInsurer } from 'pages/insurers/types';
import { getGeneralTotalPremium, getPrice } from 'utils';
import { InfoCircleFilled } from '@ant-design/icons';

// 貨幣選項
const currencyOptions = [
    { label: 'HKD', value: 'HKD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' },
];

const EditTemplateMarine = () => {
    const form = Form.useFormInstance();
    const [currency, setCurrency] = useState<string>('HKD');
    const [sumInsuredAmount, setSumInsuredAmount] = useState<number | null>(null);

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

    const handleDateChange = (value: Dayjs | null) => {
        if (!!value) {
            form.setFieldValue(['departure'], value.unix())
        }
    }
    
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
                            <div className="th">Port</div>
                            <div className="td flex gap-2">
                                <Form.Item noStyle name={['port_from']}>
                                    <Input size="small" addonBefore="From" />
                                </Form.Item>
                                <Form.Item noStyle name={['port_to']}>
                                    <Input size="small" addonBefore="To" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">Vessel</div>
                            <div className="td">
                                <Form.Item noStyle name={['vessel']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">Good</div>
                            <div className="td">
                                <Form.Item noStyle name={['good']}>
                                    <Input size="small" />
                                </Form.Item>
                            </div>
                        </div>
                        <div className="tr">
                            <div className="th">Departure</div>
                            <div className="td">
                                <DatePicker
                                    className="w-full"
                                    size="small"
                                    onChange={handleDateChange}
                                />
                                <Form.Item hidden name={['departure']}>
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

export default EditTemplateMarine;
