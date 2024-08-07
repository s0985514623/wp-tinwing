import { useState } from 'react';
import { useMany, useExport, CrudFilters } from '@refinedev/core';
import { List, useTable, EditButton, ExportButton, CreateButton, DeleteButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType as TTerms } from 'pages/terms/types';
import { DataType, ZDataType } from '../types';
import { safeParse } from 'utils';
import dayjs, { Dayjs } from 'dayjs';
import Filter from '../../dashboard/Filter';
export const ListView: React.FC = () => {
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().add(-30, 'd'), dayjs()]);

    const { tableProps, searchFormProps } = useTable<DataType>({
        sorters: {
            initial: [
                {
                    field: 'date',
                    order: 'desc',
                },
            ],
        },
        filters: {
            initial: [
                {
                    field: 'date',
                    operator: 'gt',
                    value: dateRange ? dateRange[0].unix() : undefined,
                },
                {
                    field: 'date',
                    operator: 'lt',
                    value: dateRange ? dateRange[1].unix() : undefined,
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = [
                {
                    field: 'date',
                    operator: 'gt',
                    value: values?.dateRange ? dayjs(values?.dateRange[0]?.unix()) : undefined,
                },
                {
                    field: 'date',
                    operator: 'lt',
                    value: values?.dateRange ? dayjs(values?.dateRange[1]?.unix()) : undefined,
                },
            ];
            return filters as CrudFilters;
        },
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType: ZDataType,
    });

    const { data: termsData } = useMany<TTerms>({
        resource: 'terms',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.termId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });
    //如果没有数据，就禁用导出按钮
    const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false;
    //Export CSV
    const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
        filters: dateRange
            ? [
                  {
                      field: 'date',
                      operator: 'gt',
                      value: dateRange[0]?.unix(),
                  },
                  {
                      field: 'date',
                      operator: 'lt',
                      value: dateRange[1]?.unix(),
                  },
              ]
            : [],
        mapData: (item) => {
            return {
                Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
                Category: termsData?.data?.find((term) => term.id === item.termId)?.name,
                Amount: item.amount.toLocaleString(),
                Remark: item.remark,
            };
        },
    });
    return (
        <List
            headerButtons={() => (
                <>
                    <Filter dateRange={dateRange} setDateRange={setDateRange} formProps={searchFormProps} />
                    <ExportButton onClick={triggerExport} loading={exportLoading} disabled={disabledBtn} />
                    <CreateButton />
                </>
            )}>
            <Table {...parsedTableProps} rowKey="id" size="middle">
                <Table.Column width={120} dataIndex="date" title="Date" render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')} />

                <Table.Column
                    width={120}
                    dataIndex="termId"
                    title="Category"
                    render={(termId: number) => {
                        const termData = termsData?.data?.find((term) => term.id === termId);
                        return termData?.name;
                    }}
                />
                <Table.Column width={120} dataIndex="amount" title="Amount" render={(amount) => amount.toLocaleString()} />
                <Table.Column width={120} dataIndex="remark" title="Remark" />
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title=""
                    render={(id) => {
                        return (
                            <>
                                <Space>
                                    <EditButton type="primary" hideText shape="circle" size="small" recordItemId={id} />
                                    <DeleteButton type="primary" danger hideText shape="circle" size="small" recordItemId={id} />
                                </Space>
                            </>
                        );
                    }}
                />
            </Table>
        </List>
    );
};
