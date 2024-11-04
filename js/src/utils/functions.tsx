import React from 'react';
import { IConstant } from 'types';

export const getColumnFilterPros = <
    T extends {
        [key: string]: string | number | boolean;
    },
>({
    mappingConstants,
    dataIndex,
}: {
    mappingConstants: IConstant<string | number | boolean>[];
    dataIndex: string;
}) => {
    const filters = mappingConstants.map((item) => ({
        text: item.label,
        value: item.value.toString(),
    }));
    const onFilter = (value: string | number | boolean, record: T) => {
        switch (typeof record[dataIndex]) {
            case 'string':
                return (record[dataIndex] as string).indexOf(value as string) === 0;
            case 'number':
                return record[dataIndex].toString().indexOf(value as string) === 0;
            case 'boolean':
                return record[dataIndex].toString() === value;

            default:
                return false;
        }
    };

    return {
        filters,
        onFilter,
    };
};

export const renderHTML = (rawHTML: string) => React.createElement('div', { dangerouslySetInnerHTML: { __html: rawHTML } });

export const getCopyableJson = (variable: any) => {
    const jsonStringStrippedEscapeC = JSON.stringify(JSON.stringify(variable || '{}')).replace(/\\/g, '');
    const jsonString = jsonStringStrippedEscapeC.slice(1, jsonStringStrippedEscapeC.length - 1);

    if (typeof variable === 'object') {
        const countKeys = Object.keys(variable).length;

        return countKeys === 0 ? '' : jsonString;
    }
    return !!variable ? jsonString : '';
};

export const handleClearZero = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.value === '0') {
        target.value = '';
    }
};

export const isIphone = /iPhone/.test(navigator.userAgent);

export const getPrice = (price: number, className = 'w-28', symbol = 'HKD') => {
    const thePrice = !!price ? price : 0;

    return (
        <div className={`flex justify-between ${className}`}>
            <span className='pr-1'>{symbol}</span>
            <span>
                {thePrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2, // 最少小數點後兩位
                    maximumFractionDigits: 2, // 最多小數點後兩位
                })}
            </span>
        </div>
    );
};
