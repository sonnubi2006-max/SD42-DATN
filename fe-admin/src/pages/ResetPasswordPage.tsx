import { Link, useSearchParams } from "react-router-dom";
import { useResetPassword } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const {
    mutate: resetPassword,
    isPending,
    isError,
    error,
  } = useResetPassword();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    resetPassword({
      token,
      password: fd.get("password") as string,
      confirmPassword: fd.get("confirmPassword") as string,
    });
  };

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
        <p className="text-red-500 text-sm">
          Link không hợp lệ hoặc đã hết hạn.
        </p>
        <Link
          to="/forgot-password"
          className="text-blue-600 text-sm hover:underline"
        >
          Gửi lại email
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Mật khẩu mới
          </label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Xác nhận mật khẩu
          </label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {isError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {(error as any)?.response?.data?.message ??
              "Đặt lại mật khẩu thất bại"}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Đang xử lý..." : "Xác nhận"}
        </button>
      </form>
    </div>
  );
}
