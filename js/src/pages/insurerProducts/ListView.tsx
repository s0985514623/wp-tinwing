import { useMany, useList } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton, FilterDropdown } from '@refinedev/antd';
import { Space, Typography, Tag, Table, Radio } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import { nanoid } from 'nanoid';

export const ListView: React.FC = () => {
    const { tableProps } = useTable<DataType>({});

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType,
    });

    const { data: termData, isLoading: termIsLoading } = useMany({
        resource: 'terms',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.termId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const terms = termData?.data ?? [];

    const { data: insurerData, isLoading: insurerIsLoading } = useMany({
        resource: 'insurers',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.insurerId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const { data: allTermData } = useList({
        resource: 'terms',
        filters: [
            {
                field: 'taxonomy',
                operator: 'eq',
                value: 'insurance_class',
            },
        ],
    });
    const allTerms = allTermData?.data ?? [];

    const { data: allInsurersData } = useList({
        resource: 'insurers',
    });
    const allInsurers = allInsurersData?.data ?? [];

    return (
        <List createButtonProps={{ type: 'primary' }}>
            <Table {...parsedTableProps} rowKey="id" size="middle">
                <Table.Column width={120} dataIndex="insurerProductsNumber" title="Product No." sorter={(a: DataType, b: DataType) => a.insurerProductsNumber.localeCompare(b.insurerProductsNumber)} />

                <Table.Column width={120} dataIndex="name" title="Package" sorter={(a: DataType, b: DataType) => a.name.localeCompare(b.name)} />

                <Table.Column
                    dataIndex="termId"
                    title="Class of Insurance"
                    render={(termId: number) => (termIsLoading ? <>Loading...</> : terms.find((theTerm) => theTerm.id === termId)?.name)}
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

                <Table.Column dataIndex="policyNo" title="Policy Number" />

                <Table.Column dataIndex="insuranceAmount" title="Insurance Amount" />

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
                    dataIndex="debitNoteIds"
                    title="Related"
                    render={(ids: number[]) => {
                        // console.log('🚀 ~ ids:', ids);
                        if (Array.isArray(ids)) return ids?.map((id) => <Tag key={nanoid()}>{id}</Tag>);
                    }}
                />

                <Table.Column
                    dataIndex="insurerId"
                    title="Insurer"
                    render={(insurerId: number) => (insurerIsLoading ? <>Loading...</> : insurerData?.data?.find((theInsurer) => theInsurer.id === insurerId)?.name)}
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
