import React from 'react'
import { useOne } from '@refinedev/core'
import { Row, Col } from 'antd'
import { round } from 'lodash-es'
import dayjs from 'dayjs'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType } from '../types'
import { getGeneralTotalPremium, getPrice } from 'utils'

const ShowTemplateMarine: React.FC<{ data?: DataType }> = ({
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
      <Row gutter={24}>
        <Col span={14} className="pt-2">
          <div className="table table_td-flex-1 w-full template64">
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
                <p>港口 Port</p>
              </div>
              <div className="td">
                <p>{`From ${debitNoteData?.port_from}   To ${debitNoteData?.port_to}`}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>船隻 Vessel</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.vessel}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>貨品 Good</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.good}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>離境日期 Departure</p>
              </div>
              <div className="td">
                <p>{dayjs.unix(debitNoteData?.departure || dayjs().unix()).format('YYYY-MM-DD')}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>詳情 Particulars</p>
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

        <Col span={10} className="border-l-2 border-solid border-black pt-2 pr-[24px]">
          <div className="table table_td-flex-1 w-full h-full relative">
            <div className="tr ">
              <div className="th w-[18rem]">
                <p>保費 Premium</p>
              </div>
              {/* <div className="td text-right"></div> */}
              <div className="td text-right">
                <p>{getPrice(round(premium, 2), 'w-full' )}</p>
              </div>
            </div>
            <div className="tr ">
              <div className="th w-[18rem]">
                <p>保費徵費 IA Levy {levy ? ` ${levy}%` : ''}</p>
              </div>
              {/* <div className="td text-left">
                <p>{levy}%</p>
              </div> */}
              <div className="td text-right">
                <p>{getPrice(round(premium * (levy / 100), 2), 'w-full')}</p>
              </div>
            </div>
            <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr `}>
              <div className="th w-[18rem]">
                <p>{extra_fieldLabel} {extra_fieldValue ? ` ${extra_fieldValue}%` : ''}</p>
              </div>
              {/* <div className="td text-left">
                <p>{round(Number(extra_fieldValue), 2)}%</p>
              </div> */}
              <div className="td text-right">
                <p>
                  {getPrice(
                    round(premium * (Number(extra_fieldValue) / 100), 2),
                    'w-full'
                  )}
                </p>
              </div>
            </div>
            <div className="tr mt-10">
              <div className="th text-red-500 print:text-inherit w-[18rem]">
                <p>折扣 Less</p>
              </div>
              {/* <div className="td text-right"></div> */}
              <div className="td text-right">
                <p>{getPrice(less, 'w-full')}</p>
              </div>
            </div>
            <div className="tr border-t-2 border-solid border-black flex-wrap">
              <div className="w-full font-semibold p-2 text-xs print:text-lg">
                請繳付此金額 Please pay this amount
              </div>
              <div className="th w-[18rem]">
                <p>總保險費 TOTAL PREMIUM</p>
              </div>
              {/* <div className="td text-right"></div> */}
              <div className="td text-right">
                <p>{getPrice(totalPremium, 'w-full')}</p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default ShowTemplateMarine
