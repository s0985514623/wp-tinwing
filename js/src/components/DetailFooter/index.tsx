import React from 'react';
import { Row, Col } from 'antd';

const DebitNotesFooter = ({ model = true, className = 'p-4 w-full mt-12 text-[#000] font-semibold' }: { model?: boolean; className?: string }) => {
    const RowSection = () => {
        if (model) {
            return (
                <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black">
                    <div className="h-8 border-0 border-b-2 border-solid border-black" />
                    <Row gutter={0} className="p-4" >
                        <Col span={24}>
                            <div className="table table_td-flex-1 w-full text-xs print:!text-[14px]">
                                <div className="px-2">
                                    請驗明所投保之金額是否足夠，以免意外發生時蒙受捐失。<br />
                                    Please ensure the sum insured is adequate to avoid uder unsurance in the event claim
                                </div>
                                <div className="tr mt-4">
                                    <div className="th">付款方法</div>
                                    <div className="td">畫線支票： 保誠保險代理公司</div>
                                </div>
                                <div className="tr">
                                    <div className="th">Methods of Payment </div>
                                    <div className="td">Crossed Cheque ： Potential Insuance Agency Co.</div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            );
        }
        return <></>;
    };
    return (
        <>
            <RowSection />
            <div className={`detailFooter grid grid-cols-3 text-xs   ${className}`}>
                <div className="flex flex-col items-start col-span-2">
                    <div className="">香港新界元朗教育路 18-24 號元朗商業中心 604 室</div>
                    <div className="">Room 604, Yuen Long Commercial Centre 18-24 Kau Yuk Rd.,
                        <br /> Yuen Long , N.T., Hong Kong

                    </div>
                </div>
                <div className="flex flex-col items-start col-span-1">
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold">電話 Tel</div>
                        <div className="col-span-3">2474-0338</div>
                    </div>
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold">傳真 Fax</div>
                        <div className="col-span-3">2479-7288</div>
                    </div>
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold">電郵 E-mail</div>
                        <div className="col-span-3">piaco@netvigator.com</div>
                    </div>
                </div>
            </div>
            {/* <div className="table table_td-flex-1 w-full mt-12 print:absolute print:bottom-0 print:left-0">
                <div className="tr mt-4">
                    <div className="th w-24">地址</div>
                    <div className="td">香港新界元朗教育路 18-24 號元朗商業中心 604 室</div>
                    <div className="th w-24">Tel 電話</div>
                    <div className="td">2474-0338</div>
                </div>
                <div className="tr">
                    <div className="th w-24">Address</div>
                    <div className="td">Room 604, Yuen Long Commercial Centre 18-24 Kau Yuk Rd., Yuen Long , N.T., Hong Kong</div>
                    <div className="th inner-table ">
                        <p className="">Fax 傳真</p>
                        <p className="">E-mail</p>
                    </div>
                    <div className="td inner-table">
                        <p>2479-7288</p>
                        <p>piaco@netvigator.com</p>
                    </div>
                </div>
            </div> */}
        </>
    );
};

export default DebitNotesFooter;
