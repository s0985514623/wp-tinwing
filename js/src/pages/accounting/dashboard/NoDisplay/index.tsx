import React from 'react';
import { nanoid } from 'nanoid';
import { Empty } from 'antd';
const index: React.FC<{ noDisplayData: { noBy: string; value?: number }[] }> = ({ noDisplayData = [] }) => {
    if (noDisplayData.length === 0) return <Empty className=" my-4" />;
    return (
        <div className="grid grid-cols-3 gap-5 my-4">
            {noDisplayData.map((item) => {
                return (
                    <div key={nanoid()} className="flex flex-col w-full shadow-md bg-white rounded-lg p-5">
                        <div className="text-2xl text-slate-700 font-bold">{item.value}</div>
                        <div className="text-xs text-slate-300">{item.noBy}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default index;
