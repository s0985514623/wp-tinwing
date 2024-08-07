import React from 'react';
import { nanoid } from 'nanoid';
import { Empty } from 'antd';
const index: React.FC<{ incomeByBankReceipt: { bank: string; income: number }[] }> = ({ incomeByBankReceipt = [] }) => {
    if (incomeByBankReceipt.length === 0) return <Empty className=" my-4" />;
    return (
        <div className="grid grid-cols-3 gap-5 my-4">
            {incomeByBankReceipt.map((item) => {
                return (
                    <div key={nanoid()} className="flex flex-col w-full shadow-md bg-white rounded-lg p-5">
                        <div className="text-xs text-slate-300">{item.bank}</div>
                        <div className="text-2xl text-slate-700 font-bold">{item.income.toLocaleString()}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default index;
