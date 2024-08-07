import { CrudFilters } from '@refinedev/core';
// import { FiMapPin } from 'react-icons/fi';
import { UserOutlined, PhoneOutlined, FontColorsOutlined } from '@ant-design/icons';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Typography, Space } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import Filter from './Filter';

export const ListView: React.FC = () => {
    const { tableProps, searchFormProps } = useTable<DataType>({
        sorters: {
            initial: [
                {
                    field: 'id',
                    order: 'desc',
                },
            ],
        },
        onSearch: (values: any) => {
            // console.log('🚀 ~ values:', values);
            const filters = [
                {
                    field: 'clientNumber',
                    operator: 'eq',
                    value: values?.clientNumber !== '' || undefined ? values?.clientNumber : undefined,
                },
                { field: 'nameEn', operator: 'contains', value: values?.nameEn !== '' || undefined ? values?.nameEn : undefined },
                { field: 'nameZh', operator: 'contains', value: values?.nameZh !== '' || undefined ? values?.nameZh : undefined },
                {
                    field: 'company',
                    operator: 'contains',
                    value: values?.company !== '' || undefined ? values?.company : undefined,
                },
                {
                    field: 'mobile2',
                    operator: 'eq',
                    value: values?.mobile !== '' || undefined ? values?.mobile : undefined,
                },
            ];
            return filters as CrudFilters;
        },
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType,
    });

    // const { data: agentData, isLoading: agentIsLoading } = useMany({
    // console.log('🚀 ~ parsedTableProps:', parsedTableProps);
    //     resource: 'agents',
    //     ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.agentId || '0') ?? [],
    //     queryOptions: {
    //         enabled: !!parsedTableProps?.dataSource,
    //     },
    // });

    return (
        <List createButtonProps={{ type: 'primary' }}>
            <Filter formProps={searchFormProps} />
            <Table {...parsedTableProps} rowKey="id" size="middle">
                <Table.Column width={120} dataIndex="clientNumber" title="Client No." />
                <Table.Column width={120} dataIndex="displayName" title="Display Name" render={(displayName: 'nameEn' | 'nameZh' | 'company', record: DataType) => record?.[displayName]} />
                <Table.Column
                    dataIndex="nameZh"
                    title="Main Contact"
                    render={(nameZh: string, record: DataType) => {
                        return (
                            <Typography.Paragraph
                                ellipsis={{
                                    rows: 1,
                                    expandable: true,
                                    symbol: 'more',
                                }}>
                                <UserOutlined className="mr-2" />
                                {nameZh}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.mobile1}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.mobile2}
                                <br />

                                <FontColorsOutlined className="mr-2" />
                                {record?.nameEn}
                                <br />

                                {/* <FiMapPin className="mr-2" />
                                {
                                    !Array.isArray(record?.addressArr) ? JSON.parse(record.addressArr) ?? [] : []
                                    // record?.addressArr.join(' ')
                                }
                                <br /> */}

                                <HiOutlineBuildingOffice2 className="mr-2" />
                                {`${record?.directLine ?? ''}`}
                                <br />
                            </Typography.Paragraph>
                        );
                    }}
                />
                <Table.Column
                    width={120}
                    dataIndex="mobile2"
                    title="Mobile"
                    render={(mobile2: number) => (
                        <>
                            <PhoneOutlined className="mr-2" />
                            {mobile2}
                        </>
                    )}
                />

                <Table.Column dataIndex="company" title="Company" />
                <Table.Column
                    dataIndex="contact2"
                    title="More Contact"
                    render={(contact2: string, record: DataType) => {
                        return (
                            <Typography.Paragraph
                                ellipsis={{
                                    rows: 1,
                                    expandable: true,
                                    symbol: 'more',
                                }}>
                                <UserOutlined className="mr-2" />
                                {contact2}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.tel2}
                                <br />

                                <UserOutlined className="mr-2" />
                                {record?.contact3}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.tel3}
                                <br />
                            </Typography.Paragraph>
                        );
                    }}
                />

                {/* <Table.Column dataIndex="agentId" title="Agent" render={(agentId: number) => (agentIsLoading ? <>Loading...</> : agentData?.data?.find((theAgent) => theAgent.id === agentId)?.name)} /> */}

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
