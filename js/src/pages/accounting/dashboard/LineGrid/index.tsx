import React from 'react';
import { Line } from '@ant-design/charts';
import { TLineGridData } from 'types';
import { Empty } from 'antd';
const index: React.FC<{ data?: TLineGridData }> = ({ data = [] }) => {
    if (data.length === 0) return <Empty className=" my-4" />;
    const config = {
        data,
        xField: 'date',
        yField: 'value',
        seriesField: 'category',
        // xAxis: {
        //     type: 'time',
        // },
        yAxis: {
            label: {
                // 数值格式化为千分位
                formatter: (v: any) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
            },
        },
        tooltip: {
            domStyles: {
                'g2-tooltip-list-item': { whiteSpace: 'nowrap' },
            },
            formatter: (item: any) => {
                return {
                    name: item.category,
                    value: item.value.toLocaleString(),
                };
            },
        },
        // point
        point: {
            size: 5,
            style: {
                lineWidth: 1,
                fillOpacity: 1,
            },
        },
        // label
        label: {
            layout: [
                {
                    type: 'hide-overlap',
                },
            ],
            // 隐藏重叠label
            style: {
                textAlign: 'right',
            },
            formatter: (item: any) => item.value.toLocaleString(),
        },
    };

    return <Line {...config} />;
};

export default index;
