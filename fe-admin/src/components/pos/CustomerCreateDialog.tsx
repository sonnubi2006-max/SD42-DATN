import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateCustomer } from "@/hooks/useCustomer";
import type { CustomerResponse } from "@/api/customerApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: CustomerResponse) => void;
}

export default function CustomerCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");

  const createCustomer = useCreateCustomer();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      // Reset form
      setFullName("");
      setPhone("");
      setEmail("");
      setGender("MALE");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên và số điện thoại");
      return;
    }

    createCustomer.mutate(
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        emailSubscribed: true,
      },
      {
        onSuccess: (newCustomer) => {
          toast.success("Tạo khách hàng mới thành công");
          onCreated(newCustomer);
          handleOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.apiMessage || "Có lỗi xảy ra khi tạo khách hàng");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="bg-indigo-50 border-b border-indigo-100 p-5 pb-5">
          <DialogTitle className="flex items-center gap-2 text-indigo-900">
            <UserPlus className="size-5 text-indigo-600" />
            Đăng ký khách hàng nhanh
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600">Họ và tên <span className="text-rose-500">*</span></Label>
            <Input
              id="fullName"
              placeholder="Nhập họ tên..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-xl focus-visible:ring-indigo-500/20"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-600">Số điện thoại <span className="text-rose-500">*</span></Label>
            <Input
              id="phone"
              placeholder="Nhập số điện thoại..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-xl focus-visible:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-600">Email (Tùy chọn)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl focus-visible:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-xs font-semibold text-slate-600">Giới tính</Label>
            <Select value={gender} onValueChange={(val: "MALE" | "FEMALE") => setGender(val)}>
              <SelectTrigger className="h-10 rounded-xl focus-visible:ring-indigo-500/20">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4 mt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl h-10 px-5 border-slate-200"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createCustomer.isPending}
              className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createCustomer.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Đăng ký
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
