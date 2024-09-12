import { CrudFilters } from '@refinedev/core'
// import { FiMapPin } from 'react-icons/fi';
import {
  UserOutlined,
  PhoneOutlined,
  FontColorsOutlined,
} from '@ant-design/icons'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd'
import { Table, Typography, Space } from 'antd'
import { DataType, ZDataType } from './types'
import { safeParse } from 'utils'
import Filter from './Filter'

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
		filters:{
			defaultBehavior: 'replace', // 確保查詢參數不會被合併
		},
    onSearch: (values: any) => {
      const filters = [
        {
          field: 'meta_query[relation]',
          operator: 'eq',
          value: 'AND',
        },
      ]
      // 遍歷 values 物件中的每個 key 和 value
      Object.keys(values).forEach((key, index) => {
				// 如果是 client_number，則改為搜尋s(標題)
				if(key === 'client_number'&&values[key] !== undefined && values[key] !== ''){
					filters.push(
						{
							field: `s`,
							operator: 'eq',
							value: values[key],
						},
					)
					return;
				}
        // 檢查該值是否有效（例如，不是空字符串）
        if (values[key] !== undefined && values[key] !== '') {
          // 將查詢條件分別推入到 queryParams 陣列中
          filters.push(
            {
              field: `meta_query[${index}][key]`,
              operator: 'eq',
              value: key, // 將 key 作為 meta_key
            },
            {
              field: `meta_query[${index}][value]`,
              operator: 'eq',
              value: values[key], // 根據 values 物件中的值來設置
            },
            {
              field: `meta_query[${index}][compare]`,
              operator: 'eq',
              value: '=', // 固定為 '='，或者根據需要自定義
            },
          )
        }
      })
      return filters as CrudFilters
    },
  })

  const parsedTableProps = safeParse<DataType>({
    tableProps,
    ZDataType,
  })

  // const { data: agentData, isLoading: agentIsLoading } = useMany({
  // console.log('🚀 ~ parsedTableProps:', parsedTableProps);
  //     resource: 'agents',
  //     ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.agent_id || '0') ?? [],
  //     queryOptions: {
  //         enabled: !!parsedTableProps?.dataSource,
  //     },
  // });

  return (
    <List createButtonProps={{ type: 'primary' }}>
      <Filter formProps={searchFormProps} />
      <Table {...parsedTableProps} rowKey="id" size="middle">
        <Table.Column
          width={120}
          dataIndex="client_number"
          title="Client No."
        />
        <Table.Column
          width={120}
          dataIndex="display_name"
          title="Display Name"
          render={(
            display_name: 'name_en' | 'name_zh' | 'company',
            record: DataType,
          ) => record?.[display_name]}
        />
        <Table.Column
          dataIndex="name_zh"
          title="Main Contact"
          render={(name_zh: string, record: DataType) => {
            return (
              <Typography.Paragraph
                ellipsis={{
                  rows: 1,
                  expandable: true,
                  symbol: 'more',
                }}
              >
                <UserOutlined className="mr-2" />
                {name_zh}
                <br />

                <PhoneOutlined className="mr-2" />
                {record?.mobile1}
                <br />

                <PhoneOutlined className="mr-2" />
                {record?.mobile2}
                <br />

                <FontColorsOutlined className="mr-2" />
                {record?.name_en}
                <br />

                {/* <FiMapPin className="mr-2" />
                                {
                                    !Array.isArray(record?.address_arr) ? JSON.parse(record.address_arr) ?? [] : []
                                    // record?.address_arr.join(' ')
                                }
                                <br /> */}

                <HiOutlineBuildingOffice2 className="mr-2" />
                {`${record?.direct_line ?? ''}`}
                <br />
              </Typography.Paragraph>
            )
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
                }}
              >
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
            )
          }}
        />

        {/* <Table.Column dataIndex="agent_id" title="Agent" render={(agent_id: number) => (agentIsLoading ? <>Loading...</> : agentData?.data?.find((theAgent) => theAgent.id === agent_id)?.name)} /> */}

        <Table.Column
          width={120}
          dataIndex="id"
          title=""
          render={(id) => {
            return (
              <>
                <Space>
                  <EditButton
                    type="primary"
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                  <DeleteButton
                    type="primary"
                    danger
                    hideText
                    shape="circle"
                    size="small"
                    recordItemId={id}
                  />
                </Space>
              </>
            )
          }}
        />
      </Table>
    </List>
  )
}
