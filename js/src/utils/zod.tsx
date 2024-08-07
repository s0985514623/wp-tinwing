import { z } from 'zod';
import { BaseRecord } from '@refinedev/core';
import { TableProps } from 'antd';

export function safeParse<DataType = BaseRecord>({ ZDataType, tableProps }: { ZDataType: z.ZodObject<z.ZodRawShape>; tableProps: TableProps<DataType> }): TableProps<DataType> {
    const validation = ZDataType.array().safeParse(tableProps?.dataSource || []);

    const parsedTableProps = {
        ...tableProps,
    };

    if (!validation.success) {
        console.log('⚠️ zod error', validation);
    }

    return parsedTableProps;
}
