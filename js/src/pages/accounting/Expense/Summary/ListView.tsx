import { useState } from 'react';
import { useMany, CrudFilters } from '@refinedev/core';
import { List, useTable, ExportButton, ShowButton } from '@refinedev/antd';
import { Table, DatePicker, Form, Button, Space } from 'antd';
import { DataType as TTerms } from 'pages/terms/types';
import { DataType, ZDataType } from '../types';
import { safeParse } from 'utils';
import dayjs, { Dayjs } from 'dayjs';
import { orderBy } from 'lodash-es';
import { mkConfig, generateCsv, download } from 'export-to-csv';

export const ListView: React.FC = () => {
    //預設搜尋日期為今年
    const [year, setYear] = useState(dayjs());

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
                    field: 'meta_query[relation]',
                    operator: 'eq',
                    value: 'AND',
                },
                {
                    field: 'meta_query[0][key]',
                    operator: 'eq',
                    value: 'date',
                },
                {
                    field: 'meta_query[0][value][0]',
                    operator: 'eq',
                    value: year?.startOf('year').unix(),
                },
                {
                    field: 'meta_query[0][value][1]',
                    operator: 'eq',
                    value: year?.endOf('year').unix(),
                },
                {
                    field: 'meta_query[0][compare]',
                    operator: 'eq',
                    value: 'BETWEEN',
                },
                {
                    field: 'meta_query[1][key]',
                    operator: 'eq',
                    value: 'is_adjust_balance',
                },
                {
                    field: 'meta_query[1][value]',
                    operator: 'eq',
                    value: 1,
                },
                {
                    field: 'meta_query[1][compare]',
                    operator: 'eq',
                    value: '!=',
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = [
                {
                    field: 'meta_query[relation]',
                    operator: 'eq',
                    value: 'AND',
                },
                {
                    field: 'meta_query[0][key]',
                    operator: 'eq',
                    value: 'date',
                },
                {
                    field: 'meta_query[0][value][0]',
                    operator: 'eq',
                    value: values?.year ? values?.year.startOf('year').unix() : undefined,
                },
                {
                    field: 'meta_query[0][value][1]',
                    operator: 'eq',
                    value: values?.year ? values?.year.endOf('year').unix() : undefined,
                },
                {
                    field: 'meta_query[0][compare]',
                    operator: 'eq',
                    value: 'BETWEEN',
                },
                {
                    field: 'meta_query[1][key]',
                    operator: 'eq',
                    value: 'is_adjust_balance',
                },
                {
                    field: 'meta_query[1][value]',
                    operator: 'eq',
                    value: 1,
                },
                {
                    field: 'meta_query[1][compare]',
                    operator: 'eq',
                    value: '!=',
                },
            ];
            return filters as CrudFilters;
        },
        pagination: {
            pageSize: -1,
            mode: "off" as const,
        }
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType: ZDataType,
    });
    //取得符合當前搜尋dataSource的terms
    const { data: _termsData } = useMany<TTerms>({
        resource: 'terms',
        ids: parsedTableProps?.dataSource
            ?.map((r) => r?.term_id)
            .filter((id): id is number => typeof id === 'number') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });
    const formatDataSource =
        parsedTableProps?.dataSource?.reduce((acc, record) => {

            const recordYear = dayjs.unix(record?.date).year();
            const recordMonth = dayjs.unix(record?.date).month() + 1;
            const bank = record?.payment_receiver_account;
            //將數字轉為月份名稱
            // const recordMonthName = dayjs.unix(record?.date).format('MMMM');
            const recordAmount = Number(record?.amount ?? 0);
            // 尋找是否已經有該日期以及銀行的紀錄
            const existingSource = acc?.find((item: any) => item.year === recordYear && item.month === recordMonth && item.bank === bank);
            if (existingSource) {
                existingSource.amount += recordAmount;
            }
            else {
                acc.push({ year: recordYear, month: recordMonth, amount: recordAmount, bank: bank });
            }
            return acc;
        }, [] as any) ?? [];
    const sortDataSource = orderBy([...formatDataSource], ['year', 'month'], ['desc', 'desc']);

    //如果没有数据，就禁用导出按钮
    const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false;
    const [isExporting, setIsExporting] = useState(false);
    const triggerExport = () => {
        setIsExporting(true);
        const csvConfig = mkConfig({
            filename: `Expenses_summaries/${year?.year() ?? 'all'}`,
            useKeysAsHeaders: true,
        });
        const exportData = sortDataSource.map((item: any) => ({
            Year: item.year,
            Month: item.month,
            Expenses: item.amount.toLocaleString(),
            Bank: item.bank,
        }));
        const csv = generateCsv(csvConfig)(exportData);
        download(csvConfig)(csv);
        setIsExporting(false);
    };
    //Export CSV=>舊的寫法,因為資料無法直接從dataSource取得,所以用新的寫法取得重組後資料
    // const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
    //     filters: [
    //         {
    //             field: 'date',
    //             operator: 'gt',
    //             value: year.startOf('year'),
    //         },
    //         {
    //             field: 'date',
    //             operator: 'lt',
    //             value: year.endOf('year'),
    //         },
    //     ],
    //     mapData: (item) => {
    //         console.log('🚀 ~ item:', item);
    //         return {};
    //     },
    // });

    return (
        <List
            headerButtons={() => (
                <>
                    <Form
                        {...searchFormProps}
                        layout="vertical"
                        onValuesChange={(value) => {
                            if (searchFormProps) searchFormProps?.onFinish?.(value);
                        }}>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0">
                            <Form.Item name="year" initialValue={year} noStyle>
                                <DatePicker picker="year" onChange={(data) => setYear(data as Dayjs)} />
                            </Form.Item>
                            <Button
                                type="primary"
                                // htmlType="submit"
                                size="small"
                                className="h-full"
                                onClick={() => {
                                    searchFormProps?.form?.setFieldsValue({ year: undefined });
                                    searchFormProps?.onFinish?.({ year: undefined });
                                }}>
                                Show All time
                            </Button>
                        </div>
                    </Form>
                    <ExportButton onClick={triggerExport} loading={isExporting} disabled={disabledBtn} />
                </>
            )}>
            <Table {...parsedTableProps} dataSource={sortDataSource} rowKey="id" size="middle"
                pagination={{
                    pageSize: 30,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}>
                <Table.Column width={120} dataIndex="year" title="Year" />
                <Table.Column
                    width={120}
                    dataIndex="month"
                    title="Month"
                    render={(month, record: any) => {
                        const date = new Date(record.year, month - 1);
                        return date.toLocaleString('en-US', { month: 'long' });
                    }}
                />
                <Table.Column width={120} dataIndex="amount" title="Expenses" render={(amount) => amount.toLocaleString()} />
                <Table.Column width={120} dataIndex="bank" title="Bank" filters={[{ text: '上海商業銀行', value: '上海商業銀行' }, { text: '中國銀行', value: '中國銀行' }]}
                    onFilter={(value, record: any) => {
                        return (record?.bank || undefined) === value
                    }} />
                <Table.Column
                    width={120}
                    dataIndex="month"
                    title=""
                    render={(month, record: any) => {
                        return (
                            <>
                                <Space>
                                    <ShowButton type="primary" hideText shape="circle" size="small" recordItemId={month} meta={{ year: record.year, month: record.month, bank: record.bank }} />
                                </Space>
                            </>
                        );
                    }}
                />
            </Table>
        </List>
    );
};
