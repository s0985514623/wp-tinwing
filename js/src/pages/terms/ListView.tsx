import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';

export const ListView: React.FC<{ taxonomy: string }> = ({ taxonomy = '' }) => {
    const { tableProps } = useTable<DataType>({
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
                    pageSize: 30,
                    showSizeChanger: true,
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
