import React from 'react';
import { Select, InputNumber } from 'antd';
const { Option } = Select;

// 自定義的 AmountInput 組件
export const AmountInput: React.FC<{
    value?: { sign: string; amount: number } | string;
    onChange?: (value: { sign: string; amount: number }) => void;
    className?: string;
  }> = ({ value, onChange, className }) => {
    const [sign, setSign] = React.useState<string>('add');
    const [amount, setAmount] = React.useState<number>(0);
  
    React.useEffect(() => {
      if (value) {
        if (typeof value === 'object' && value.sign && value.amount !== undefined) {
          setSign(value.sign);
          setAmount(value.amount);
        }
        else if(typeof value === 'string'){
          //如果value是字串，則將其轉換為數字並判斷正負
          const numValue = Number(value);
          setSign(numValue >= 0 ? 'add' : 'minus');
          setAmount(Math.abs(numValue));
        }
      }
    }, [value]);
  
    const handleSignChange = (newSign: string) => {
      setSign(newSign);
      onChange?.({ sign: newSign, amount });
    };
  
    const handleAmountChange = (newAmount: number | null) => {
      const validAmount = newAmount || 0;
      setAmount(validAmount);
      onChange?.({ sign, amount: validAmount });
    };
  
    const selectBefore = (
      <Select value={sign} onChange={handleSignChange} style={{ width: 60 }}>
        <Option value="add">+</Option>
        <Option value="minus">-</Option>
      </Select>
    );
  
    return (
      <InputNumber
        className={className}
        min={0}
        stringMode
        step="0.01"
        addonBefore={selectBefore}
        value={amount}
        onChange={handleAmountChange}
      />
    );
  };