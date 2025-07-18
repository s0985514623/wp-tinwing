import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Table, Typography, Space } from 'antd';
import { DataType, ZDataType } from './types';
import { safeParse } from 'utils';
import { useState } from 'react';

export const ListView: React.FC = () => {
    const [pageSize, setPageSize] = useState(30);
    const [current, setCurrent] = useState(1);
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
                <Table.Column width={120} dataIndex="agent_number" title="Agent No." />

                <Table.Column dataIndex="name" title="Name" />

                <Table.Column
                    dataIndex="contact1"
                    title="Contacts"
                    render={(contact1: string, record: DataType) => {
                        return (
                            <Typography.Paragraph
                                ellipsis={{
                                    rows: 1,
                                    expandable: true,
                                    symbol: 'more',
                                }}>
                                <UserOutlined className="mr-2" />
                                {contact1}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.tel1}
                                <br />

                                <UserOutlined className="mr-2" />
                                {record?.contact2}
                                <br />

                                <PhoneOutlined className="mr-2" />
                                {record?.tel2}
                                <br />
                            </Typography.Paragraph>
                        );
                    }}
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
