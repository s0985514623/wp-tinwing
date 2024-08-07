import React from 'react';
import { Form, Input } from 'antd';
import { DataType } from 'pages/debitNotes/types';
/**
 * 顯示或輸入備註
 * 當有傳入data時，顯示data.remark文字
 * 當沒有傳入data時，顯示Input.TextArea
 * @param {DataType} data 傳入的data
 * @param {"edit"|"show"} model 當前模式(預設為edit)
 * @returns table
 */
export const RemarkTextArea: React.FC<{ data?: DataType; model?: 'edit' | 'show' }> = ({ data, model = 'edit' }) => {
    const remarkString = data?.remark || '';
    const TextArea = () => {
        if (model === 'show') {
            return <>{data?.remark}</>;
        }
        return (
            <Form.Item noStyle name={['remark']} initialValue={remarkString}>
                <Input.TextArea className="w-1/2" rows={4} />
            </Form.Item>
        );
    };

    return (
        <div className="table table_td-flex-1 w-full mt-12">
            <div className="tr mt-4">
                <div className="th">備註</div>
                <div className="td flex">
                    <TextArea />
                </div>
            </div>
        </div>
    );
};
