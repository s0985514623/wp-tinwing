import React from 'react'
import { useOne } from '@refinedev/core'
import { Row, Col } from 'antd'
import { round } from 'lodash-es'
import dayjs from 'dayjs'
import { DataType as TInsurer } from 'pages/insurers/types'
import { DataType } from '../types'
import { getGrossPremium, getMotorTotalPremium, getPrice } from 'utils'

const ShowTemplateMotor: React.FC<{ data?: DataType }> = ({
  data: debitNoteData,
}) => {
  const premium = debitNoteData?.premium || 0
  const ls = debitNoteData?.motor_attr?.ls || 0
  const ncb = debitNoteData?.motor_attr?.ncb || 0
  const mib = debitNoteData?.motor_attr?.mib || 0
  const less = debitNoteData?.less || 0
  const extra_fieldLabel = debitNoteData?.extra_field?.label || ''
//   console.log('🚀 ~ extra_fieldLabel:', extra_fieldLabel)
  const extra_fieldValue = debitNoteData?.extra_field?.value || ''
  const motorAttrParticularsArray =
    debitNoteData?.motor_attr?.particulars?.split('\n') || []
  const grossPremium = getGrossPremium({
    premium,
    ls,
    ncb,
  })
  const totalPremium = getMotorTotalPremium({
    grossPremium,
    mib,
    less,
    extraValue: Number(extra_fieldValue),
  })

  const { data: insurerData } = useOne<TInsurer>({
    resource: 'insurers',
    id: debitNoteData?.insurer_id || 0,
    queryOptions: {
      enabled: !!debitNoteData?.insurer_id,
    },
  })
  const insurer = insurerData?.data

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
                <p>保障範圍 Coverage</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.coverage}</p>
              </div>
            </div>

            <div className="tr">
              <div className="th">
                <p>製造年份 Manufacturing Year</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.manufacturingYear}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>登記號碼 Registration No.</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.registrationNo}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>廠名及型號 Make & Model</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.model}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>容量 / 噸數 CC./ Tonnes </p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.tonnes}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>車身 Body</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.body}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>底盤 Chassi</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.chassi}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>引擎號 Engine Number</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_engine_no}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>附加設備 Additional Values</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.additionalValues}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>記名司機 Named Driver</p>
              </div>
              <div className="td">
                <p>{debitNoteData?.motor_attr?.namedDriver}</p>
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
                <p>項目詳情 Particulars</p>
              </div>
              <div className="td">
                <p>
                  {' '}
                  {motorAttrParticularsArray?.map((particular, index) => (
                    <p key={index}>{particular}</p>
                  )) || ''}
                </p>
              </div>
            </div>
          </div>
        </Col>

        <Col span={10} className="border-l-2 border-solid border-black pt-2 pr-[24px]">
          <div className="table table_td-flex-1 w-full h-full relative">
            <div className="tr">
              <div className="th">
                <p>Premium</p>
              </div>
              <div className="td text-right"></div>
              <div className="td text-right">
                <p>{getPrice(round(premium, 2), 'w-full')}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>LS</p>
              </div>
              <div className="td text-left">
                <p>{ls ? `${ls}%` : ''}</p>
              </div>
              <div className="td text-right">
                <p>{getPrice(round(premium * (ls / 100), 2), 'w-full')}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th text-red-500 print:text-inherit">
                <p>NCB</p>
              </div>
              <div className="td text-left">
                <p>{ncb ? `${ncb}%` : ''}</p>
              </div>
              <div className="td text-right">
                <p>
                  {getPrice(round(premium * (1 + ls / 100) * (ncb / 100), 2), 'w-full')}
                </p>
              </div>
            </div>

            <div className="tr mt-10">
              <div className="th">
                <p>Gross Premium</p>
              </div>
              <div className="td text-right"></div>
              <div className="td text-right">
                <p>{getPrice(grossPremium, 'w-full')}</p>
              </div>
            </div>
            <div className="tr">
              <div className="th">
                <p>MIB</p>
              </div>
              <div className="td text-left">
                <p>{mib ? `${mib}%` : ''}</p>
              </div>
              <div className="td text-right">
                <p>{getPrice(round(grossPremium * (mib / 100), 2), 'w-full')}</p>
              </div>
            </div>
            <div className={`${extra_fieldLabel ? '' : 'tw-hidden'} tr`}>
              <div className="th">
                <p>{extra_fieldLabel}</p>
              </div>
              <div className="td text-left">
                <p>{extra_fieldValue}%</p>
              </div>
              <div className="td text-right">
                <p>
                  {getPrice(
                    round(grossPremium * (Number(extra_fieldValue) / 100), 2),
                    'w-full'
                  )}
                </p>
              </div>
            </div>
            <div className="tr mt-10">
              <div className="th text-red-500 print:text-inherit">
                <p>Less</p>
              </div>
              <div className="td"></div>
              <div className="td text-right">
                <p>{getPrice(less, 'w-full')}</p>
              </div>
            </div>
            <div className="tr absolute bottom-0 border-t-2 border-solid border-black flex-wrap">
              <div className="w-full p-2 font-bold text-xs print:text-lg">
                請繳付此金額 Please pay this amount
              </div>
              <div className="th font-bold w-[18rem]">
                <p>總保險費 TOTAL PREMIUM</p>
              </div>
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

export default ShowTemplateMotor
