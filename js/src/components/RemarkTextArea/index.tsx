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
export const RemarkTextArea: React.FC<{ data?: DataType; model?: 'edit' | 'show';textAreaClassName?:string;tableClassName?:string;thClassName?:string; }> = ({ data, model = 'edit',textAreaClassName='w-1/2',tableClassName='',thClassName='' }) => {
    const remarkString = data?.remark || '';
    const TextArea = () => {
        if (model === 'show') {
            // whitespace-pre-line 保留使用者輸入的換行，過長的單行也會自動折行
            // 不能只靠 _main.scss 的 main{white-space:pre-line}，react-to-print 的列印 iframe 沒有 main 祖先
            return <div className="w-full whitespace-pre-line">{data?.remark}</div>;
        }
        return (
            <Form.Item noStyle name={['remark']} initialValue={remarkString}>
                <Input.TextArea className={textAreaClassName} rows={4} />
            </Form.Item>
        );
    };

    return (
        <div className={`table table_td-flex-1 w-full pt-12 ${tableClassName}`}>
            <div className="tr mt-4">
                <div className={`th ${thClassName}`}>備註 Remark</div>
                <div className="td flex w-full">
                    <TextArea />
                </div>
            </div>
        </div>
    );
};
