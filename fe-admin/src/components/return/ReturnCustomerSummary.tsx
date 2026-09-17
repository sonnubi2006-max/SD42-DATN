import { Input } from "@/components/ui/input";

interface ReturnCustomerSummaryProps {
  customerName: string;
  customerPhone: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
}

export default function ReturnCustomerSummary({
  customerName,
  customerPhone,
  onCustomerNameChange,
  onCustomerPhoneChange,
}: ReturnCustomerSummaryProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-xs text-gray-600 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label htmlFor="return-customer-name" className="font-semibold text-gray-700">
          Tên khách hàng <span className="text-red-500">*</span>
        </label>
        <Input
          id="return-customer-name"
          value={customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="Nhập tên khách hàng"
          className="h-9 bg-white text-xs"
          maxLength={100}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="return-customer-phone" className="font-semibold text-gray-700">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <Input
          id="return-customer-phone"
          value={customerPhone}
          onChange={(event) => onCustomerPhoneChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Nhập số điện thoại"
          className="h-9 bg-white text-xs"
          inputMode="numeric"
          maxLength={10}
        />
      </div>
    </div>
  );
}
