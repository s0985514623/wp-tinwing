import React from 'react';
import { Row, Col } from 'antd';

const DebitNotesFooter = ({ model = true }: { model?: boolean }) => {
    const RowSection = () => {
        if (model) {
            return (
                <div className="mt-12 table table_td-flex-1 w-full border-2 border-solid border-black">
                    <div className="h-8 border-0 border-b-2 border-solid border-black" />
                    <Row gutter={0} className="p-4">
                        <Col span={24}>
                            <div className="table table_td-flex-1 w-full">
                                <p className="px-2">請驗明所投保之金額是否足夠，以免意外發生時蒙受捐失。</p>
                                <p className="px-2">Please ensure the sum insured is adequate to avoid uder unsurance in the event claim</p>
                                <div className="tr mt-4">
                                    <div className="th"><p>付款方法</p></div>
                                    <div className="td"><p>畫線支票： 保誠保險代理公司</p></div>
                                </div>
                                <div className="tr">
                                    <div className="th"><p>Methods of Payment </p></div>
                                    <div className="td"><p>Crossed Cheque ： Potential Insuance Agency Co.</p></div>
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
            <div className="detailFooter grid grid-cols-3 p-4 w-full mt-12 ">
                <div className="flex flex-col items-start col-span-2">
                    <div className=""><p>香港新界元朗教育路 18-24 號元朗商業中心 604 室</p></div>
                    <div className=""><p>Room 604, Yuen Long Commercial Centre 18-24 Kau Yuk Rd.,
                        <br /> Yuen Long , N.T., Hong Kong</p>

                    </div>
                </div>
                <div className="flex flex-col items-start col-span-1">
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold"><p>電話 Tel</p></div>
                        <div className="col-span-3"><p>2474-0338</p></div>
                    </div>
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold"><p>傳真 Fax</p></div>
                        <div className="col-span-3"><p>2479-7288</p></div>
                    </div>
                    <div className="grid grid-cols-5 w-full">
                        <div className="col-span-2 font-bold"><p>電郵 E-mail</p></div>
                        <div className="col-span-3"><p>piaco@netvigator.com</p></div>
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
