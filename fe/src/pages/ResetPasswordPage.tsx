import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { mutate, isPending, isError, error } = useResetPassword();
  if (!token) return <div className="space-y-4 rounded-2xl border bg-card p-8 text-center"><p className="text-sm text-red-600">Liên kết không hợp lệ hoặc thiếu mã xác thực.</p><Link to="/forgot-password" className="text-sm font-semibold text-primary underline">Gửi lại thư điện tử</Link></div>;
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div><h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1><p className="mt-1 text-sm text-muted-foreground">Mật khẩu mới cần tối thiểu 6 ký tự.</p></div>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutate({ token, password: String(data.get("password")), confirmPassword: String(data.get("confirmPassword")) }); }}>
        <div className="space-y-1.5"><Label htmlFor="password">Mật khẩu mới</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
        <div className="space-y-1.5"><Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label><Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required /></div>
        {isError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{(error as { apiMessage?: string })?.apiMessage ?? "Không thể đặt lại mật khẩu"}</p>}
        <Button className="w-full" disabled={isPending}>{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Xác nhận mật khẩu mới</Button>
      </form>
    </div>
  );
}
