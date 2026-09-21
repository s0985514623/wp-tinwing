import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse, compareTermName } from 'utils';
import { useState } from 'react'

export const ListView: React.FC<{ taxonomy: string }> = ({ taxonomy = '' }) => {
    const [pageSize, setPageSize] = useState(30);
    const [current, setCurrent] = useState(1);
    const { tableProps } = useTable<DataType>({
        // A-Z
        // orderby 用 title (post_title)，WP 的 `name` 是 post_name (slug)，而 slug 不代表分類名稱
        sorters: {
            initial: [
                {
                    field: 'title',
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

    // 資料一次全部取回、分頁也是前端自己算，排序同樣在前端做，
    // 所以拿掉 refine 的 onChange，避免點排序時多打一次沒有意義的 API
    const { onChange: _onChange, ...restTableProps } = parsedTableProps;

    return (
        <List createButtonProps={{ type: 'primary' }}>
            <Table {...restTableProps} rowKey="id" size="middle"
                onChange={(_pagination, _filters, _sorter, extra) => {
                    // 換排序方式後回到第一頁
                    if (extra?.action === 'sort') {
                        setCurrent(1);
                    }
                }}
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
                <Table.Column
                    dataIndex="name"
                    title="Name"
                    defaultSortOrder="ascend"
                    sortDirections={['ascend', 'descend']}
                    sorter={(a: DataType, b: DataType) => compareTermName(a?.name, b?.name)}
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
