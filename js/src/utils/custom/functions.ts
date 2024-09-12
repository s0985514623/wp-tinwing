import { round } from 'lodash-es';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import {DataType as TReceipt} from 'pages/receipts/types';
import {DataType as TInsurer} from 'pages/insurers/types';
import {DataType as TRenewal} from 'pages/renewals/types';

export const getGrossPremium = ({ premium, ls, ncb }: { premium: number; ls: number; ncb: number }) => {
    //x= premium + premium*ls
    //GrossPremium = x+x*ncb = x * (1+ncb)
    return round(Number(premium) * (1 + Number(ls) / 100) * (1 + Number(ncb) / 100), 2);
};

export const getGrossPremiumByDebitNote = (debitNote: TDebitNote | undefined) => {
    const premium = Number(debitNote?.premium) || 0;
    const ls = Number(debitNote?.motor_attr?.ls) || 0;
    const ncb = Number(debitNote?.motor_attr?.ncb) || 0;

    return !!debitNote ? round(premium * (1 + ls / 100) * (1 + ncb / 100), 2) : 0;
};

export const getMotorTotalPremium = ({ grossPremium, mib, less, extraValue = 0 }: { grossPremium: number; mib: number; less: number; extraValue?: number }) => {
    return round(Number(grossPremium) * (1 + (Number(mib) + Number(extraValue)) / 100) + Number(less), 2);
};

export const getMotorTotalPremiumByDebitNote = (debitNote: TDebitNote | undefined) => {
    const grossPremium = getGrossPremiumByDebitNote(debitNote);
    const mib = Number(debitNote?.motor_attr?.mib) || 0;
    const less = Number(debitNote?.less) || 0;
    const extraValue = Number(debitNote?.extra_field?.value) || 0;

    return !!debitNote ? round(grossPremium * (1 + (mib + extraValue) / 100) + less, 2) : 0;
};

export const getGeneralTotalPremium = ({ premium, levy, less, extraValue = 0, extraValue2 = 0 }: { premium: number; levy: number; less: number; extraValue?: number; extraValue2?: number }) => {
    return round(Number(premium) * (1 + (Number(levy) + Number(extraValue) + Number(extraValue2)) / 100) + Number(less), 2);
};

export const getGeneralTotalPremiumByDebitNote = (debitNote: TDebitNote | undefined) => {
    const premium = Number(debitNote?.premium) || 0;
    const levy = Number(debitNote?.levy) || 0;
    const less = Number(debitNote?.less) || 0;
    const extraValue = Number(debitNote?.extra_field?.value) || 0;
    return !!debitNote ? round(premium * (1 + (levy + extraValue) / 100) + less, 2) : 0;
};

export const getTotalPremiumByDebitNote = (debitNote: TDebitNote | TRenewal | undefined) => {
    const template = debitNote?.template || 'general';
    switch (template) {
        case 'general':
            return getGeneralTotalPremiumByDebitNote(debitNote);
        case 'motor':
            return getMotorTotalPremiumByDebitNote(debitNote);
        case 'shortTerms':
            return getGeneralTotalPremiumByDebitNote(debitNote);
				case 'package':
				return getGeneralTotalPremiumByDebitNote(debitNote);
        default:
            return 0;
    }
};

/**
 * 計算該付給保險公司的金額
 * @param receipt 該筆收據
 * @param debitNote 該筆收據的debitNote
 * @param insurer 該筆debitNote的保險公司
 * @returns {number} 該付給保險公司的金額
 */
export const getInsurerPayment = (receipt:TReceipt, debitNote:TDebitNote, insurer:TInsurer): number => {
	//汽車保險的算法是
	//const insurerTotalFee = mibValue + round(grossPremium * (insurerPaymentRate / 100), 2);
	// 其他保險(一般保險/短期保險)的算法都是
	//const insurerTotalFee = levyValue + round(grossPremium * (insurerPaymentRate / 100), 2);

	const insurerPaymentRate = insurer?.paymentRate;
	const premium = receipt?.premium ? Number(receipt?.premium) : getTotalPremiumByDebitNote(debitNote) ;
	const template=debitNote?.template;

	if ('motor' === template) {
			const mib = debitNote?.motor_attr?.mib || 0;
			const mibValue = round(premium * (mib / 100), 2);
			const insurerTotalFee = mibValue + round(premium * (insurerPaymentRate / 100), 2);
			return insurerTotalFee;
	} else if( 'general' === template || 'shortTerms' === template || 'package' === template){
    const levy = debitNote?.levy || 0;
		const levyValue = round(premium * (levy / 100), 2);
		const insurerTotalFee = levyValue + round(premium * (insurerPaymentRate / 100), 2);
		return insurerTotalFee;
	}

	return 0
};

