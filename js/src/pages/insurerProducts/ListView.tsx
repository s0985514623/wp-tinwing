import { useMany, useList } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton, FilterDropdown } from '@refinedev/antd';
import { Space, Typography, Tag, Table, Radio } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import { nanoid } from 'nanoid';

export const ListView: React.FC = () => {
    const { tableProps } = useTable<DataType>({
        pagination: {
            pageSize: -1, // 一次取得所有資料
            mode: "off" as const,
        }
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType,
    });

    const { data: termData, isLoading: termIsLoading } = useMany({
        resource: 'terms',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.term_id || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const terms = termData?.data ?? [];

    const { data: insurerData, isLoading: insurerIsLoading } = useMany({
        resource: 'insurers',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.insurer_id || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const { data: allTermData } = useList({
        resource: 'terms',
        filters: [
            // {
            //     field: 'taxonomy',
            //     operator: 'eq',
            //     value: 'insurance_class',
            // },
						{
							field: 'meta_query[0][key]',
							operator: 'eq',
							value: 'taxonomy',
						},
						{
							field: 'meta_query[0][value]',
							operator: 'eq',
							value: 'insurance_class',
						},
						{
							field: 'meta_query[0][compare]',
							operator: 'eq',
							value: '=',
						},
        ],
        pagination: {
            pageSize: -1,
        },
    });
    const allTerms = allTermData?.data ?? [];

    const { data: allInsurersData } = useList({
        resource: 'insurers',
        pagination: {
            pageSize: -1,
        },
    });
    const allInsurers = allInsurersData?.data ?? [];

    return (
        <List createButtonProps={{ type: 'primary' }}>
            <Table {...parsedTableProps} rowKey="id" size="middle"
                pagination={{
                    pageSize: 30,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}>
                <Table.Column width={120} dataIndex="insurer_products_number" title="Product No." sorter={(a: DataType, b: DataType) => a.insurer_products_number.localeCompare(b.insurer_products_number)} />

                <Table.Column width={120} dataIndex="name" title="Package" sorter={(a: DataType, b: DataType) => a.name.localeCompare(b.name)} />

                <Table.Column
                    dataIndex="term_id"
                    title="Class of Insurance"
                    render={(term_id: number) => (termIsLoading ? <>Loading...</> : terms.find((theTerm) => theTerm.id === term_id)?.name)}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Radio.Group>
                                <Space direction="vertical">
                                    {allTerms.map((theTerm) => (
                                        <Radio key={theTerm.id} value={theTerm.id}>
                                            {theTerm.name}
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </FilterDropdown>
                    )}
                />

                <Table.Column dataIndex="policy_no" title="Policy Number" />

                <Table.Column dataIndex="insurance_amount" title="Insurance Amount" />

                <Table.Column
                    dataIndex="remark"
                    title="Remark"
                    width={200}
                    render={(remark: string) => (
                        <Typography.Paragraph
                            ellipsis={{
                                rows: 2,
                                expandable: true,
                                symbol: 'more',
                            }}>
                            {remark}
                        </Typography.Paragraph>
                    )}
                />
                {/* TODO: fetch debitNoteName */}
                <Table.Column
                    width={200}
                    dataIndex="debit_note_ids"
                    title="Related"
                    render={(ids: number[]) => {
                        // console.log('🚀 ~ ids:', ids);
                        if (Array.isArray(ids)) return ids?.map((id) => <Tag key={nanoid()}>{id}</Tag>);
                    }}
                />

                <Table.Column
                    dataIndex="insurer_id"
                    title="Insurer"
                    render={(insurer_id: number) => (insurerIsLoading ? <>Loading...</> : insurerData?.data?.find((theInsurer) => theInsurer.id === insurer_id)?.name)}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Radio.Group>
                                <Space direction="vertical">
                                    {allInsurers.map((theInsurer) => (
                                        <Radio key={theInsurer.id} value={theInsurer.id}>
                                            {theInsurer.name}
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </FilterDropdown>
                    )}
                />

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
