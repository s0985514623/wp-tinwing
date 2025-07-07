import { useState } from 'react';
import { useTable, ExportButton } from '@refinedev/antd';
import { Table, Row, Col, Card } from 'antd';
import dayjs from 'dayjs';
import { getPrice } from 'utils';
import Filter from './Filter';
import FilterTags from 'components/FilterTags';
import { TSearchProps, TTemplateProps, TRequiredProps } from './types';
import { CrudFilters, useExport, BaseRecord } from '@refinedev/core';

function template<T extends TRequiredProps>({ resource }: TTemplateProps) {
    const { tableProps, searchFormProps } = useTable({
        resource,
        pagination: {
            mode: 'off',
        },
        onSearch: (values: TSearchProps) => {
            const start = values?.dateRange ? values?.dateRange[0]?.startOf('day').unix() : undefined;
            const end = values?.dateRange ? values?.dateRange[1]?.endOf('day').unix() : undefined;

            const defaultFilters = start?[
                {
                    field: 'date[0]',
                    operator: 'eq',
                    value: start,
                },
                {
                    field: 'date[1]',
                    operator: 'eq',
                    value: end,
                },
            ]:[];
            return defaultFilters as CrudFilters;
        },


    });

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const rowSelection = {
        onChange: (keys: React.Key[]) => {
            setSelectedRowKeys(keys);
        },
    };

    const { triggerExport, isLoading: exportLoading } = useExport<T & BaseRecord>({
        resource,
        filters: [
            {
                field: 'id',
                operator: 'in',
                value: selectedRowKeys,
            },
        ],
        mapData: (item) => {
            return {
                'Note No.': item.note_no,
                Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
                'Payment Date': dayjs.unix(item.date).add(1, 'month').format('YYYY-MM-DD'),
                'Premium (HKD)': `${item.premium?.toLocaleString() ?? 0}`,
            };
        },
    });

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col lg={24} xs={24}>
                    <Filter formProps={searchFormProps} />
                </Col>
                <Col lg={24} xs={24}>
                    <Card bordered={false} title="Search Result">
                        <div className="mb-4">
                            <FilterTags form={searchFormProps?.form} />
                        </div>
                        <div className="mb-4">
                            <ExportButton type="primary" disabled={!selectedRowKeys.length} onClick={triggerExport} loading={exportLoading}>
                                Export Selected
                            </ExportButton>
                        </div>
                        <Table
                            {...tableProps}
                            rowKey="id"
                            size="middle"
                            rowSelection={{
                                type: 'checkbox',
                                ...rowSelection,
                            }}
                            summary={(pageData) => {
                                const totalPremium = pageData.reduce((acc, cur) => acc + Number(cur.premium ?? 0), 0);

                                return (
                                    <>
                                        <Table.Summary.Row className="bg-blue-50">
                                            <Table.Summary.Cell index={0}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1}>Total</Table.Summary.Cell>
                                            <Table.Summary.Cell index={2}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={4}>{getPrice(totalPremium)}</Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                );
                            }}>
                            <Table.Column width={120} dataIndex={resource === 'receipts' ? 'receipt_no' : 'note_no'} title="Note No." sorter={(a: T, b: T) => a?.note_no.localeCompare(b.note_no || '')} />
                            <Table.Column key="date" dataIndex="date" title="Date" render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')} sorter={(a: T, b: T) => a.date - b.date} />
                            <Table.Column key="payment_date" dataIndex="date" title="Payment Date" render={(date: number) => dayjs.unix(date).add(1, 'month').format('YYYY-MM-DD')} />
                            <Table.Column dataIndex="premium" title="Premium" render={(premium: number) => getPrice(premium)} sorter={(a: T, b: T) => a.premium - b.premium} />
                        </Table>
                        <hr className="my-8" />
                    </Card>
                </Col>
            </Row>
        </>
    );
}

export default template;
