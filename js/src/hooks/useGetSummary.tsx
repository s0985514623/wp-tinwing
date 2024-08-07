// import { useEffect, useState } from 'react';
import { useTable } from '@refinedev/antd';
import { DataType } from 'pages/debitNotes/types';
import { HttpError, CrudFilters } from '@refinedev/core';
import dayjs from 'dayjs';
import _ from 'lodash-es';
/**
 * @description 封裝useTable取得Summary 各資源的資料(Quotations , Debit notes , Receipts , Renewals)
 * @returns {object} {tableProps, searchFormProps}
 */
export const useGetSummary = () => {
    //搜尋條件
    const setFilters = (values: any) => {
        return [
            {
                field: 'periodOfInsuranceTo',
                operator: 'gt',
                value: values?.dateRange ? dayjs(values?.dateRange[0]?.startOf('day')).unix() : undefined,
            },
            {
                field: 'periodOfInsuranceTo',
                operator: 'lt',
                value: values?.dateRange ? dayjs(values?.dateRange[1]?.startOf('day')).unix() : undefined,
            },
            {
                field: 'motorEngineNo',
                operator: 'eq',
                value: values?.motorEngineNo === '' ? undefined : values?.motorEngineNo,
            },
            {
                field: 'isArchived',
                operator: 'eq',
                value: values?.isArchived,
            },
        ];
    };
    //取得debit_notes的資料
    const { tableProps: debitNotesTable, searchFormProps: debitNotesSearch } = useTable<DataType, HttpError>({
        resource: 'debit_notes',
        sorters: {
            initial: [
                {
                    field: 'date',
                    order: 'desc',
                },
            ],
        },
        filters: {
            initial: [
                {
                    field: 'isArchived',
                    operator: 'eq',
                    value: false,
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = setFilters(values);
            return filters as CrudFilters;
        },
    });
    const debitNotes = (debitNotesTable?.dataSource?.map((item) => {
        return {
            ...item,
            statusFiled: 'debit_notes',
        };
    }) || []) as DataType[];

    //取得quotations的資料
    const { tableProps: quotationsTable, searchFormProps: quotationsSearch } = useTable<DataType, HttpError>({
        resource: 'quotations',
        sorters: {
            initial: [
                {
                    field: 'date',
                    order: 'desc',
                },
            ],
        },
        filters: {
            initial: [
                {
                    field: 'isArchived',
                    operator: 'eq',
                    value: false,
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = setFilters(values);
            return filters as CrudFilters;
        },
    });
    const quotations = (quotationsTable?.dataSource?.map((item) => {
        return {
            ...item,
            statusFiled: 'quotations',
        };
    }) || []) as DataType[];

    //取得renewals的資料
    const { tableProps: renewalsTable, searchFormProps: renewalsSearch } = useTable<DataType, HttpError>({
        resource: 'renewals',
        sorters: {
            initial: [
                {
                    field: 'date',
                    order: 'desc',
                },
            ],
        },
        filters: {
            initial: [
                {
                    field: 'isArchived',
                    operator: 'eq',
                    value: false,
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = setFilters(values);
            return filters as CrudFilters;
        },
    });
    const renewals = (renewalsTable?.dataSource?.map((item) => {
        return {
            ...item,
            statusFiled: 'renewals',
        };
    }) || []) as DataType[];

    //取得receipts的資料
    const { tableProps: receiptsTable, searchFormProps: receiptsSearch } = useTable<DataType, HttpError>({
        resource: 'receipts',
        sorters: {
            initial: [
                {
                    field: 'date',
                    order: 'desc',
                },
            ],
        },
        filters: {
            defaultBehavior: 'replace',
            initial: [
                {
                    field: 'isArchived',
                    operator: 'eq',
                    value: false,
                },
            ],
        },
        onSearch: (values: any) => {
            //當dateRange有值或motorEngineNo有值時，才會去搜尋
            if (values?.dateRange !== null || (values?.motorEngineNo !== '' && values?.motorEngineNo !== undefined)) {
                //設定一個永遠不存在的ID值使搜尋不到資料
                return [
                    {
                        field: 'id',
                        operator: 'eq',
                        value: -1,
                    },
                    {
                        field: 'isArchived',
                        operator: 'eq',
                        value: values?.isArchived,
                    },
                ];
            }
            //當dateRange沒有值或motorEngineNo沒有值時，不會去搜尋
            return [
                {
                    field: 'isArchived',
                    operator: 'eq',
                    value: values?.isArchived,
                },
            ];
        },
    });
    const receipts = (receiptsTable?.dataSource?.map((item) => {
        return {
            ...item,
            statusFiled: 'receipts',
        };
    }) || []) as DataType[];

    //合併資料
    const combinedData = [...debitNotes, ...quotations, ...receipts, ...renewals];
    //合併搜尋方法
    const searchFormProps = {
        onFinish: async (values: any) => {
            if (debitNotesSearch?.onFinish && quotationsSearch?.onFinish && renewalsSearch?.onFinish && receiptsSearch?.onFinish) {
                debitNotesSearch?.onFinish(values);
                quotationsSearch?.onFinish(values);
                renewalsSearch?.onFinish(values);
                receiptsSearch?.onFinish(values);
            }
        },
    };
    //排序
    const tableProps = _.sortBy(combinedData, ['date']).reverse() || [];
    // console.log('🚀 ~ tableProps:', tableProps);
    return { tableProps, searchFormProps };
};
