import { Link } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";

export default function LoginPage() {
  const { mutate: login, isPending, isError, error } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    login({
      username: fd.get("username") as string,
      password: fd.get("password") as string,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
        <p className="text-sm text-gray-500">Chào mừng bạn quay trở lại</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Tài khoản</label>
          <input
            name="username"
            type="text"
            placeholder="example"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {isError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {(error as any)?.apiMessage ??
              (error as any)?.response?.data?.message ??
              "Email hoặc mật khẩu không đúng"}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="text-blue-600 font-medium hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
