import React from 'react';
import { Form, Select } from 'antd';
import { DataType } from 'pages/receipts/types';
/**
 * Receipt 銀行組件 欄位名稱:payment_receiver_account
 * 當有傳入data時，顯示data.bank value選項
 * 當沒有傳入data時，顯示Select
 * @param {DataType} data 傳入的data
 * @param {"edit"|"show"} model 當前模式(預設為edit)
 * @returns table
 */
export const ReceiptBankSelect: React.FC<{ data?: DataType; model?: 'edit' | 'show'; className?: string }> = ({ data, model = 'edit', className = 'table table_td-flex-1 w-full mt-12' }) => {
    const bankString = data?.payment_receiver_account || '';
    const TextArea = () => {
        if (model === 'show') {
            return <>{data?.payment_receiver_account}</>;
        }
        //如果有傳入data，則顯示data.bank value選項,否則顯示Select placeholder
        const formItemProps = bankString ? { initialValue: { bankString } } : '';
        return (
            <Form.Item noStyle name={['payment_receiver_account']} {...formItemProps}>
                <Select
                    className="w-1/2"
                    placeholder="Select a Bank"
                    options={[
                        {
                            value: '上海商業銀行',
                            label: '上海商業銀行',
                        },
                        {
                            value: '中國銀行',
                            label: '中國銀行',
                        },
                    ]}
                />
            </Form.Item>
        );
    };
    return (
        <div className={className}>
            <div className="tr">
                <div className="th">銀行</div>
                <div className="td flex">
                    <TextArea />
                </div>
            </div>
        </div>
    );
};
