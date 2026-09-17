import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
  const { mutate: login, isPending, isError, error } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = (fd.get("username") as string).trim();
    const password = fd.get("password") as string;

    if (!username) {
      toast.error("Tên đăng nhập không được để trống");
      return;
    }
    if (!password) {
      toast.error("Mật khẩu không được để trống");
      return;
    }

    login({
      username,
      password,
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">
          Chào mừng bạn quay trở lại Stravo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username">Tên đăng nhập</Label>
          <Input
            id="username"
            name="username"
            placeholder="username"
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Quên mật khẩu?</Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Đăng nhập
        </Button>
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p>{(error as { apiMessage?: string })?.apiMessage ?? "Không thể đăng nhập"}</p>
            <p className="mt-1 font-semibold">
              Vui lòng gọi hotline cửa hàng để được hỗ trợ.
            </p>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-medium text-foreground hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
