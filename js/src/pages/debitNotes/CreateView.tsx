import React, { useState, useEffect } from 'react'
import { IResourceComponentsProps } from '@refinedev/core'
import { Create, useForm, useSelect } from '@refinedev/antd'
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Alert,
  Col,
  Row,
} from 'antd'
import { Dayjs } from 'dayjs'
import EditTemplateGeneral from './components/EditTemplateGeneral'
import EditTemplateMotor from './components/EditTemplateMotor'
import EditTemplateShortTerms from './components/EditTemplateShortTerms'
import EditTemplatePackage from './components/EditTemplatePackage'
import DebitNoteHeader from './components/EditDebitNoteHeader'
import DetailFooter from 'components/DetailFooter'
import EditMetaMotor from './components/EditMetaMotor'
import EditMetaGeneral from './components/EditMetaGeneral'
import EditMetaPackage from './components/EditMetaPackage'
import EditTemplateMarine from './components/EditTemplateMarine'
import { TTemplate } from './types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TAgent } from 'pages/agents/types'
import { DataType as TTerm } from 'pages/terms/types'
import logo from 'assets/images/logo.jpg'
import { getTemplateText } from 'utils'
import { RemarkTextArea } from 'components/RemarkTextArea'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '@refinedev/core'

export const CreateView: React.FC<IResourceComponentsProps> = () => {
  const navigate = useNavigate()
  const { formProps, saveButtonProps, form, onFinish } = useForm({
    //使新增後跳轉到clientsSummary
    redirect: false,
    onMutationSuccess: () => {
      navigate('/clientsSummary')
    },
  })
  //處理通知
  const { open: notify } = useNotification();

  //處理日期為空
  const handleFinish = async (values: any) => {
    // 範例：date 必填（即使欄位是隱藏的也可在這裡檢查）
    if (!values?.date) {
      notify?.({
        type: "error",
        message: "缺少必要欄位",
        description: "請選擇日期（date 為必填）。",
      });
      return; // 阻止提交
    }
    // 其他自訂檢查...
    // if (!values.title?.trim()) { ... }

    // 檢查通過才真正送給 refine 的 mutation
    await onFinish?.(values);
  }
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  const [selectedTemplate, setSelectedTemplate] = useState<TTemplate>('general')

  const { selectProps: clientSelectProps, queryResult: clientQueryResult } =
    useSelect<TClient>({
      resource: 'clients',
      optionLabel: 'display_name', //出來的是name_en or name_zh 透過這個再去取得真實display_name
      optionValue: 'id',
    })
  //轉換新的clientSelectProps options
  const fxnClientSelectProps = {
    ...clientSelectProps,
    options: clientSelectProps?.options?.map((option) => {
      const display_name = option.label as 'name_en' | 'name_zh' | 'company'
      return {
        label: clientQueryResult?.data?.data.find(
          (client) => client.id === option.value,
        )?.[display_name],
        value: option.value,
      }
    }),
  }

  // 客戶編號的 Select
  const { selectProps: clientNumberSelectProps } = useSelect<TClient>({
    resource: 'clients',
    optionLabel: 'client_number',
    optionValue: 'id',
  })
  //轉換新的clientNumberSelectProps options
  const fxnClientNumberSelectProps = {
    ...clientNumberSelectProps,
    options: clientNumberSelectProps?.options?.map((option) => {
      return {
        label: clientQueryResult?.data?.data.find(
          (client) => client.id === option.value,
        )?.client_number,
        value: option.value,
      }
    }),
  }

  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const clients = clientQueryResult?.data?.data || []
  const selectedClient =
    clients.find((theClient) => theClient?.id === selectedClientId) ||
    defaultClient
  //檢查selectedClient?.address_arr是否為array
  if (!Array.isArray(selectedClient?.address_arr)) {
    try {
      selectedClient.address_arr = JSON.parse(selectedClient.address_arr)
    } catch (error) {
      selectedClient.address_arr = []
      console.log('🚀 ~ error:', error)
    }
  }
  const handleClientSelect = (value: any) => {
    setSelectedClientId(value)
    // 同步更新客戶ID到表單
    form.setFieldValue(['client_id'], value)
  }

  const handleClientNumberSelect = (value: any) => {
    setSelectedClientId(value)
    // 同步更新客戶選擇的表單值
    form.setFieldValue(['client_id'], value)
  }

  const { selectProps: agentSelectProps, queryResult: agentQueryResult } = useSelect<TAgent>({
    resource: 'agents',
    optionLabel: 'agent_number',
    optionValue: 'id',
  })

  const handleDateChange = (value: Dayjs | null) => {
    if (!!value) {
      form.setFieldValue(['date'], value.unix())
    }
  }

  const templateText = getTemplateText(selectedTemplate)

  // 預設選中 PIA232 代理
  useEffect(() => {
    const agents = agentQueryResult?.data?.data || []
    const piaAgent = agents.find((agent) => agent.agent_number === 'PIA232')
    if (piaAgent && !form.getFieldValue(['agent_id'])) {
      form.setFieldValue(['agent_id'], piaAgent.id)
    }
  }, [agentQueryResult?.data?.data])

  const { selectProps: termSelectProps } = useSelect<TTerm>({
    resource: 'terms',
    optionLabel: 'name',
    optionValue: 'id',
    filters: [
      // {
      //     field: 'taxonomy',
      //     operator: 'eq',
      //     value: 'insurance_class',
      // },
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'taxonomy',
      },
      {
        field: 'meta_query[0][value]',
        operator: 'eq',
        value: 'insurance_class',
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: '=',
      },
    ],
  })

  return (
    <Create saveButtonProps={saveButtonProps} >
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <Form.Item hidden name={['is_archived']} initialValue={0} />
        <DebitNoteHeader setSelectedTemplate={setSelectedTemplate} />
        <div className="table table_td-flex-1 w-full">
          <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
            <div className="w-full">
              <img src={logo} className="print:w-1/3 min-w-[400px] max-w-[600px]" />
            </div>
            <div className="text-right text-xl font-semibold w-full flex flex-col justify-end">
              <p>{templateText.zh}</p>
              <p>{templateText.en}</p>
            </div>
          </div>

          <div className="w-full mb-4 flex justify-between">
            <div className="flex flex-col justify-end">
              <p>保險名稱 / 通訊地址</p>
              <p>Insured / correspondence Address</p>
            </div>
            <div className="text-center text-lg font-semibold border-2 border-solid border-black py-2 px-12">
              <p>保費單</p>
              <p>Debit Note</p>
            </div>
          </div>
          <Row gutter={24}>
            <Col span={12}>
              <div className="w-full">
                <Form.Item noStyle name={['client_id']}>
                  <Select
                    {...fxnClientSelectProps}
                    size="small"
                    className="w-full"
                    allowClear
                    onChange={handleClientSelect}
                    onSearch={(_value: string) => {
                      // console.log('search:', value);
                    }}
                    //TODO 類型問題
                    filterOption={filterOption as any}
                  />
                </Form.Item>
                <p>{selectedClient?.company || ' '}</p>
                <p>
                  {selectedClient?.display_name
                    ? selectedClient[selectedClient?.display_name]
                    : ''}
                </p>
                {selectedClient?.address_arr?.map((address, index) => (
                  <p key={index}>{address}</p>
                )) || ' '}
              </div>
            </Col>
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr">
                  <div className="th">日期 Date</div>
                  <div className="td">
                    <DatePicker
                      className="w-full"
                      size="small"
                      onChange={handleDateChange}
                    />
                    <Form.Item hidden name={['date']}>
                      <InputNumber />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">號碼 Note No</div>
                  <div className="td">
                    <Form.Item noStyle name={['note_no']}>
                      <Input className="w-full" size="small" />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">保險類別 Class of Insurance</div>
                  <div className="td">
                    <Form.Item noStyle name={['term_id']}>
                      <Select
                        {...termSelectProps}
                        size="small"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">代理 Agent</div>
                  <div className="td">
                    <Form.Item noStyle name={['agent_id']}>
                      <Select
                        {...agentSelectProps}
                        size="small"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">客戶編號 Client No</div>
                  <div className="td">
                    <Select
                      {...fxnClientNumberSelectProps}
                      size="small"
                      className="w-full"
                      allowClear
                      value={selectedClientId}
                      onChange={handleClientNumberSelect}
                      filterOption={filterOption as any}
                    />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
        {selectedTemplate === 'general' && <EditTemplateGeneral />}
        {selectedTemplate === 'motor' && <EditTemplateMotor />}
        {selectedTemplate === 'shortTerms' && <EditTemplateShortTerms />}
        {selectedTemplate === 'package' && <EditTemplatePackage />}
        {selectedTemplate === 'marineInsurance' && <EditTemplateMarine />}
        <DetailFooter />
        <Alert
          className="my-24"
          message="The following content will NOT be printed out"
          type="warning"
          showIcon
        />
        <RemarkTextArea />
        {selectedTemplate === 'general' && <EditMetaGeneral />}
        {selectedTemplate === 'motor' && <EditMetaMotor />}
        {selectedTemplate === 'shortTerms' && <EditMetaGeneral />}
        {selectedTemplate === 'package' && <EditMetaPackage />}
        {selectedTemplate === 'marineInsurance' && <EditMetaGeneral />}
      </Form>
    </Create>
  )
}
