import React, { useState, useEffect } from 'react'
import { IResourceComponentsProps, useOne } from '@refinedev/core'
import { Create, useForm, useSelect } from '@refinedev/antd'
import { Form, Select, DatePicker, Input, Alert, Col, Row } from 'antd'
import dayjs from 'dayjs'
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
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import logo from 'assets/images/logo.jpg'
import { getTemplateText } from 'utils'
import { RemarkTextArea } from 'components/RemarkTextArea'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '@refinedev/core'
import { useDebitNoteData, useRenewalData } from 'hooks'
import { isNumber } from 'lodash-es'


export const CreateView: React.FC<IResourceComponentsProps> = () => {
  const navigate = useNavigate()
  const { formProps, saveButtonProps, form, onFinish } = useForm({
    //使新增後跳轉到clientsSummary
    redirect: false,
    onMutationSuccess: () => {
      navigate('/clientsSummary')
    },
  })
  //覆寫onFinish改變date的格式&& 處理通知
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
    await onFinish?.({
      ...values,
      date: values.date.unix(),
    })
  }

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)

  const [selectedTemplate, setSelectedTemplate] = useState<TTemplate>('general')
  const [selectedDebitNoteId, setSelectedDebitNoteId] = useState<
    number | undefined
  >(undefined)
  const { data: debitNoteResult } = useOne<TDebitNote>({
    resource: 'debit_notes',
    id: selectedDebitNoteId,
    queryOptions: {
      enabled: !!selectedDebitNoteId,
    },
  })
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

  //從別的保單點續約後，取得的資料
  //取得debitNoteData，如果有資料則將資料帶入
  const debitNoteData = useDebitNoteData()
  // console.log("🚀 ~ debitNoteData:", debitNoteData)
  const renewalsData = useRenewalData()
  // console.log('🚀 ~ renewalsData:', renewalsData);
  useEffect(() => {
    //優先取得renewalsData，如果沒有再取得debitNoteData
    const data = renewalsData ?? debitNoteData
    //created_from_renewal_id
    if (renewalsData)
      form.setFieldValue(
        ['created_from_renewal_id'],
        renewalsData?.data?.id || null,
      )
    if (data) {
      //基本資料
      setSelectedClientId(data.data.client_id as number)
      setSelectedTemplate(
        data.data.template as 'general' | 'motor' | 'shortTerms' | 'package' | 'marineInsurance',
      )
      form.setFieldValue(['template'], data.data.template)
      form.setFieldValue(['client_id'], data.data.client_id)
      if (data.data.date && isNumber(data.data.date)) {
        form.setFieldValue(['date'], dayjs.unix(data.data.date))
      }
      form.setFieldValue(['note_no'], data.data.note_no)
      form.setFieldValue(['term_id'], data.data.term_id)
      form.setFieldValue(['agent_id'], data.data.agent_id)
      //General
      form.setFieldValue(['particulars'], data.data.particulars)
      form.setFieldValue(['levy'], data.data.levy)
      //Motor
      form.setFieldValue(['insurer_id'], data.data.insurer_id)
      form.setFieldValue(['policy_no'], data.data.policy_no)
      form.setFieldValue(['name_of_insured'], data.data.name_of_insured)
      form.setFieldValue(['sum_insured'], data.data.sum_insured)
      form.setFieldValue(
        ['motor_attr', 'manufacturingYear'],
        data.data.motor_attr?.manufacturingYear,
      )
      form.setFieldValue(
        ['motor_attr', 'registrationNo'],
        data.data.motor_attr?.registrationNo,
      )
      form.setFieldValue(['motor_attr', 'model'], data.data.motor_attr?.model)
      form.setFieldValue(['motor_attr', 'tonnes'], data.data.motor_attr?.tonnes)
      form.setFieldValue(['motor_attr', 'body'], data.data.motor_attr?.body)
      form.setFieldValue(['motor_attr', 'chassi'], data.data.motor_attr?.chassi)
      form.setFieldValue(['motor_engine_no'], data.data.motor_engine_no)
      form.setFieldValue(
        ['motor_attr', 'additionalValues'],
        data.data.motor_attr?.additionalValues,
      )
      form.setFieldValue(
        ['motor_attr', 'namedDriver'],
        data.data.motor_attr?.namedDriver,
      )
      form.setFieldValue(
        ['period_of_insurance_from'],
        data.data.period_of_insurance_from,
      )
      form.setFieldValue(
        ['period_of_insurance_to'],
        data.data.period_of_insurance_to,
      )
      form.setFieldValue(['premium'], data.data.premium)
      form.setFieldValue(['motor_attr', 'ls'], data.data.motor_attr?.ls)
      form.setFieldValue(['motor_attr', 'ncb'], data.data.motor_attr?.ncb)
      form.setFieldValue(['motor_attr', 'mib'], data.data.motor_attr?.mib)
      form.setFieldValue(['extra_field', 'label'], data.data.extra_field?.label)
      form.setFieldValue(['extra_field', 'value'], data.data.extra_field?.value)
      form.setFieldValue(['less'], data.data.less)
      form.setFieldValue(['insurer_fee_percent'], data.data.insurer_fee_percent)
      form.setFieldValue(['agent_fee'], data.data.agent_fee)
      //shortTerms
      form.setFieldValue(['short_terms_content'], data.data.short_terms_content)
      //package
      form.setFieldValue(['package_content'], data.data?.package_content)
      //備註
      form.setFieldValue(['remark'], data.data.remark)
    }
  }, [debitNoteData, renewalsData])

  //選擇不同的debitNoteId時，重新設定form的值
  useEffect(() => {
    if (debitNoteResult) {
      //基本資料
      setSelectedClientId(debitNoteResult.data.client_id as number)
      setSelectedTemplate(
        debitNoteResult.data.template as 'general' | 'motor' | 'shortTerms' | 'package' | 'marineInsurance',
      )
      form.setFieldValue(['template'], debitNoteResult.data.template)
      form.setFieldValue(['client_id'], debitNoteResult.data.client_id)
      if (debitNoteResult.data.date && isNumber(debitNoteResult.data.date)) {
        form.setFieldValue(['date'], dayjs.unix(debitNoteResult.data.date))
      }
      form.setFieldValue(['note_no'], debitNoteResult.data.note_no)
      form.setFieldValue(['term_id'], debitNoteResult.data.term_id)
      form.setFieldValue(['agent_id'], debitNoteResult.data.agent_id)
      //General
      form.setFieldValue(['particulars'], debitNoteResult.data.particulars)
      form.setFieldValue(['levy'], debitNoteResult.data.levy)
      //Motor
      form.setFieldValue(['insurer_id'], debitNoteResult.data.insurer_id)
      form.setFieldValue(['policy_no'], debitNoteResult.data.policy_no)
      form.setFieldValue(['name_of_insured'], debitNoteResult.data.name_of_insured)
      form.setFieldValue(['sum_insured'], debitNoteResult.data.sum_insured)
      form.setFieldValue(
        ['motor_attr', 'manufacturingYear'],
        debitNoteResult.data.motor_attr?.manufacturingYear,
      )
      form.setFieldValue(
        ['motor_attr', 'registrationNo'],
        debitNoteResult.data.motor_attr?.registrationNo,
      )
      form.setFieldValue(['motor_attr', 'model'], debitNoteResult.data.motor_attr?.model)
      form.setFieldValue(['motor_attr', 'tonnes'], debitNoteResult.data.motor_attr?.tonnes)
      form.setFieldValue(['motor_attr', 'body'], debitNoteResult.data.motor_attr?.body)
      form.setFieldValue(['motor_attr', 'chassi'], debitNoteResult.data.motor_attr?.chassi)
      form.setFieldValue(['motor_engine_no'], debitNoteResult.data.motor_engine_no)
      form.setFieldValue(
        ['motor_attr', 'additionalValues'],
        debitNoteResult.data.motor_attr?.additionalValues,
      )
      form.setFieldValue(
        ['motor_attr', 'namedDriver'],
        debitNoteResult.data.motor_attr?.namedDriver,
      )
      form.setFieldValue(
        ['period_of_insurance_from'],
        debitNoteResult.data.period_of_insurance_from,
      )
      form.setFieldValue(
        ['period_of_insurance_to'],
        debitNoteResult.data.period_of_insurance_to,
      )
      form.setFieldValue(['premium'], debitNoteResult.data.premium)
      form.setFieldValue(['motor_attr', 'ls'], debitNoteResult.data.motor_attr?.ls)
      form.setFieldValue(['motor_attr', 'ncb'], debitNoteResult.data.motor_attr?.ncb)
      form.setFieldValue(['motor_attr', 'mib'], debitNoteResult.data.motor_attr?.mib)
      form.setFieldValue(['extra_field', 'label'], debitNoteResult.data.extra_field?.label)
      form.setFieldValue(['extra_field', 'value'], debitNoteResult.data.extra_field?.value)
      form.setFieldValue(['less'], debitNoteResult.data.less)
      form.setFieldValue(['insurer_fee_percent'], debitNoteResult.data.insurer_fee_percent)
      form.setFieldValue(['agent_fee'], debitNoteResult.data.agent_fee)
      //shortTerms
      form.setFieldValue(['short_terms_content'], debitNoteResult.data.short_terms_content)
      //package
      form.setFieldValue(['package_content'], debitNoteResult.data?.package_content)
      //備註
      form.setFieldValue(['remark'], debitNoteResult.data.remark)
      //marineInsurance
      form.setFieldValue(['port_from'], debitNoteResult.data.port_from)
      form.setFieldValue(['port_to'], debitNoteResult.data.port_to)
      form.setFieldValue(['vessel'], debitNoteResult.data.vessel)
      form.setFieldValue(['good'], debitNoteResult.data.good)
      form.setFieldValue(['departure'], debitNoteResult.data.departure)
    }
  }, [debitNoteResult])
  
  return (
    <Create saveButtonProps={saveButtonProps} >
      <Form {...formProps} onFinish={handleFinish} layout="vertical">
        <Form.Item hidden name={['is_archived']} initialValue={0} />
        <Form.Item
          hidden
          name={['created_from_renewal_id']}
          initialValue={renewalsData?.data?.id}
        />
        <DebitNoteHeader
          setSelectedTemplate={setSelectedTemplate}
          setSelectedDebitNoteId={setSelectedDebitNoteId}
        />
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
              <p>受保人名稱 / 通訊地址</p>
              <p>Name / correspondence Address</p>
            </div>
            <div className="text-center text-lg font-semibold border-2 border-solid border-black py-2 px-12">
              <p>續保通知書</p>
              <p>Renewal Notice</p>
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
                  <div className="th">日期 Date<span className="text-red-500">*</span></div>
                  <div className="td">
                    <Form.Item name={['date']}>
                      <DatePicker className="w-full" size="small" />
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
