import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import { useState } from 'react'

export const ListView: React.FC = () => {
    const [pageSize, setPageSize] = useState(30);
    const [current, setCurrent] = useState(1);
    const { tableProps } = useTable<DataType>({
        pagination: {
            pageSize: -1, // 一次取得所有資料
            mode: "off" as const,
        }
    });
    // console.log('🚀 ~ tableProps:', tableProps);

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
                <Table.Column width={120} dataIndex="insurer_number" title="Insurer No." />

                <Table.Column dataIndex="name" title="Name" />

                <Table.Column dataIndex="payment_rate" title="Payment Rate" render={(p: number) => `${p}%`} />

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
