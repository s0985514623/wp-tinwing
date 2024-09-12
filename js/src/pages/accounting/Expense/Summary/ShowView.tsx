import React from 'react';
import { useParams } from 'react-router-dom';
import { Show, useTable, ExportButton } from '@refinedev/antd';
import { useMany, useExport } from '@refinedev/core';
import { DataType } from '../types';
import dayjs from 'dayjs';
import { Table } from 'antd';
import { DataType as TTerms } from 'pages/terms/types';

export const ShowView: React.FC = () => {
    const { year, month } = useParams();
    // 獲取該月的第一天（月初）
    const startOfMonth = dayjs(new Date(Number(year), Number(month) - 1, 1)).startOf('month');
    const endOfMonth = dayjs(new Date(Number(year), Number(month) - 1, 1)).endOf('month');

    //取得
    const { tableProps } = useTable<DataType>({
        filters: {
            initial: [
                // {
                //     field: 'date',
                //     operator: 'gt',
                //     value: startOfMonth.unix(),
                // },
                // {
                //     field: 'date',
                //     operator: 'lt',
                //     value: endOfMonth.unix(),
                // },
								{
									field: 'meta_query[0][key]',
									operator: 'eq',
									value: 'date',
								},
								{
									field: 'meta_query[0][value][0]',
									operator: 'eq',
									value: startOfMonth.unix(),
								},
								{
									field: 'meta_query[0][value][1]',
									operator: 'eq',
									value: endOfMonth.unix(),
								},
								{
									field: 'meta_query[0][compare]',
									operator: 'eq',
									value: 'BETWEEN',
								},
            ],
        },
    });
    // const filterData = tableProps?.dataSource?.filter((item) => {
    //     const itemYear = dayjs(item.date).year();
    //     const itemMonth = dayjs(item.date).month() + 1;
    //     return itemYear == Number(year) && itemMonth == Number(month);
    // });
    const { data: termsData, isLoading: termsLoading } = useMany<TTerms>({
        resource: 'terms',
        ids: tableProps?.dataSource?.map((theRecord) => theRecord?.term_id || '0') ?? [],
        queryOptions: {
            enabled: !!tableProps?.dataSource,
        },
    });

    const disabledBtn = tableProps.dataSource?.length == 0 ? true : false;
    const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
        filters: [
            // {
            //     field: 'date',
            //     operator: 'gt',
            //     value: startOfMonth.unix(),
            // },
            // {
            //     field: 'date',
            //     operator: 'lt',
            //     value: endOfMonth.unix(),
            // },
						{
							field: 'meta_query[0][key]',
							operator: 'eq',
							value: 'date',
						},
						{
							field: 'meta_query[0][value][0]',
							operator: 'eq',
							value: startOfMonth.unix(),
						},
						{
							field: 'meta_query[0][value][1]',
							operator: 'eq',
							value: endOfMonth.unix(),
						},
						{
							field: 'meta_query[0][compare]',
							operator: 'eq',
							value: 'BETWEEN',
						},
        ],
        mapData: (item) => {
            // console.log('🚀 ~ item:', item);
            return {
                Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
                Category: termsData?.data?.find((term) => term.id === item.term_id)?.name,
                Amount: item.amount.toLocaleString(),
                Remark: item.remark,
            };
        },
    });
    return (
        <Show
            isLoading={termsLoading}
            headerButtons={({ defaultButtons }) => (
                <>
                    {defaultButtons}
                    <ExportButton onClick={triggerExport} loading={exportLoading} disabled={disabledBtn} />
                </>
            )}>
            <Table {...tableProps} rowKey="id" size="middle">
                <Table.Column width={120} dataIndex="date" title="Date" render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')} />

                <Table.Column
                    width={120}
                    dataIndex="term_id"
                    title="Category"
                    render={(term_id: number) => {
                        const termData = termsData?.data?.find((term) => term.id === term_id);
                        return termData?.name;
                    }}
                />
                <Table.Column width={120} dataIndex="amount" title="Amount" render={(amount) => amount.toLocaleString()} />
                <Table.Column width={120} dataIndex="remark" title="Remark" />
            </Table>
        </Show>
    );
};
