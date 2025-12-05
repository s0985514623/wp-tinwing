import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import { useState } from 'react'

export const ListView: React.FC<{ taxonomy: string }> = ({ taxonomy = '' }) => {
    const [pageSize, setPageSize] = useState(30);
    const [current, setCurrent] = useState(1);
    const { tableProps } = useTable<DataType>({
        // A-Z
        sorters: {
            initial: [
                {
                    field: 'name',
                    order: 'asc',
                },
            ],
        },
        filters: {
            permanent: [
                // {
                //     field: 'taxonomy',
                //     operator: !!taxonomy ? 'eq' : 'nnull',
                //     value: taxonomy,
                // },
								{
									field: 'meta_query[0][key]',
									operator: 'eq',
									value: 'taxonomy',
								},
								{
									field: 'meta_query[0][value]',
									operator: 'eq',
									value: taxonomy,
								},
								{
									field: 'meta_query[0][compare]',
									operator: 'eq',
									value: '=',
								},
            ],
        },
				pagination:{
					pageSize: -1,
					mode: "off" as const,
				}
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType,
    });

    return (
        <List createButtonProps={{ type: 'primary' }}>
            <Table {...parsedTableProps} rowKey="id" size="middle"
                pagination={{
                    current: current,
                    pageSize: pageSize,
                    total: parsedTableProps?.dataSource?.length || 0,
                    showSizeChanger: true,
                    onChange: (current, pageSize) => {
                        setCurrent(current);
                        setPageSize(pageSize);
                    },
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}>
                <Table.Column dataIndex="name" title="Name" />

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
