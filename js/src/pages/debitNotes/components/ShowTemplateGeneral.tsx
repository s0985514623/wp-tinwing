import React from 'react'
import { useOne } from '@refinedev/core'
import { Row, Col } from 'antd'
import { round } from 'lodash-es'
import dayjs from 'dayjs'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType } from '../types'
import { getGeneralTotalPremium, getPrice } from 'utils'

const ShowTemplateGeneral: React.FC<{ data?: DataType }> = ({
  data: debitNoteData,
}) => {
  const { data: insurerData } = useOne<TInsurer>({
    resource: 'insurers',
    id: debitNoteData?.insurer_id || 0,
    queryOptions: {
      enabled: !!debitNoteData?.insurer_id,
    },
  })
  const insurer = insurerData?.data

  const premium = debitNoteData?.premium || 0
  const levy = debitNoteData?.levy || 0
  const less = debitNoteData?.less || 0
  const extra_fieldLabel = debitNoteData?.extra_field?.label || ''
  const extra_fieldValue = debitNoteData?.extra_field?.value || ''
  const particulars = debitNoteData?.particulars || ''
  const particularsArray = particulars.split('\n')
  const totalPremium = getGeneralTotalPremium({
    premium,
    levy,
    less,
    extraValue: Number(extra_fieldValue),
  })

  return (
    <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black ">
      <Row gutter={0}>
        <Col span={12} className="pt-2">
          <div className="table table_td-flex-1 w-full">
            <div className="tr">
              <div className="th">
                <p>承保公司 Insurer</p>
              </div>
              <div className="td">
                <p>{insurer?.name}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>保單號碼 Policy No.</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.policy_no}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>投保名稱 Name of Insured</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.name_of_insured}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>投保金額 Sum Insured</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.sum_insured}</p>
              </div>
            </div>

            <div className="tr">
              <div className="th">
                <p>保險期限 Period of Insurance</p>
              </div>
              <div className="td">
                <p>{`From ${dayjs.unix(debitNoteData?.period_of_insurance_from || dayjs().unix()).format('YYYY-MM-DD')}   To ${dayjs.unix(debitNoteData?.period_of_insurance_to || dayjs().unix()).format('YYYY-MM-DD')}`}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>Particulars</p>
              </div>
              <div className="td">
                <p>
                  {particularsArray?.map((particular, index) => (
                    <p key={index}>{particular}</p>
                  )) || ''}
                </p>
              </div>
            </div>
          </div>
        </Col>

        <Col span={12} className="border-l-2 border-solid border-black pt-2">
          <div className="table table_td-flex-1 w-full">
            <div className="tr ">
              <div className="th">
                <p>Premium</p>
              </div>
              <div className="td text-right"></div>
              <div className="td text-right">
                <p>{getPrice(premium)}</p>
              </div>
            </div>
            <div className="tr ">
              <div className="th">
                <p>IA Levy</p>
              </div>
              <div className="td text-right">
                <p>{levy}%</p>{' '}
              </div>
              <div className="td text-right">
                <p>{getPrice(round(premium * (levy / 100), 2))}</p>{' '}
              </div>
            </div>
            <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr `}>
              <div className="th">
                <p>{extra_fieldLabel}</p>
              </div>
              <div className="td text-right">
                <p>{extra_fieldValue}%</p>
              </div>
              <div className="td text-right">
                <p>
                  {getPrice(
                    round(premium * (Number(extra_fieldValue) / 100), 2),
                  )}
                </p>
              </div>
            </div>
            <div className="tr mt-10">
              <div className="th text-red-500 print:text-inherit">
                <p>Less</p>
              </div>
              <div className="td text-right"></div>
              <div className="td text-right">
                <p>{getPrice(less)}</p>
              </div>
            </div>
            <div className="tr border-t-2 border-solid border-black flex-wrap">
              <div className="w-full p-2 font-bold text-xs print:text-lg">
                請繳付此金額 Please pay this amount
              </div>
              <div className="th font-bold">
                <p>總保險費 TOTAL PREMIUM</p>
              </div>
              <div className="td text-right"></div>
              <div className="td text-right">
                <p>{getPrice(totalPremium)}</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default ShowTemplateGeneral
