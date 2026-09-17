import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess, isError, error } = useForgotPassword();
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div><h1 className="text-2xl font-bold">Quên mật khẩu</h1><p className="mt-1 text-sm text-muted-foreground">Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.</p></div>
      {isSuccess ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><Mail className="mb-2 size-5" />Hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra cả thư rác.</div>
      ) : (
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutate({ email: String(data.get("email") ?? "").trim() }); }}>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required placeholder="email@example.com" /></div>
          {isError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{(error as { apiMessage?: string })?.apiMessage ?? "Không thể gửi email"}</p>}
          <Button className="w-full" disabled={isPending}>{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Gửi liên kết đặt lại</Button>
        </form>
      )}
      <Link to="/login" className="block text-center text-sm font-semibold text-primary hover:underline">← Quay lại đăng nhập</Link>
    </div>
  );
}
