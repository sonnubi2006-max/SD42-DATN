import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { mutate: register, isPending } = useRegister();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = (fd.get("fullName") as string).trim();
    const email = (fd.get("email") as string).trim();
    const phone = (fd.get("phone") as string).trim();
    const password = fd.get("password") as string;
    const confirm = fd.get("confirmPassword") as string;

    if (!fullName) {
      toast.error("Họ tên không được để trống");
      return;
    }
    if (fullName.length < 2) {
      toast.error("Họ tên phải từ 2 ký tự trở lên");
      return;
    }

    if (!email) {
      toast.error("Email không được để trống");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không đúng định dạng");
      return;
    }

    if (!phone) {
      toast.error("Số điện thoại không được để trống");
      return;
    }
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Số điện thoại không hợp lệ (phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09)");
      return;
    }

    if (!password) {
      toast.error("Mật khẩu không được để trống");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }

    if (!confirm) {
      toast.error("Vui lòng xác nhận mật khẩu");
      return;
    }
    if (password !== confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    register(
      {
        fullName,
        email,
        phone,
        password,
      },
      {
        onError: (err: any) => {
          toast.error(
            err?.apiMessage || "Có lỗi xảy ra, vui lòng thử lại sau!",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Đăng ký để bắt đầu mua sắm tại Stravo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Họ tên</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="fullName"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            name="phone"
            type="text"
            placeholder="0987654321"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Đăng ký
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="font-medium text-foreground hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
