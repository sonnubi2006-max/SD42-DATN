import { Link } from "react-router-dom";
import { useForgotPassword } from "@/hooks/useAuth";

export default function ForgotPasswordPage() {
  const {
    mutate: forgotPassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    forgotPassword({ email: fd.get("email") as string });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu
        </p>
      </div>

      {isSuccess ? (
        <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          ✅ Email đã được gửi! Vui lòng kiểm tra hộp thư của bạn.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              placeholder="example@email.com"
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {isError && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {(error as any)?.apiMessage ??
                (error as any)?.response?.data?.message ??
                "Gửi email thất bại"}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
