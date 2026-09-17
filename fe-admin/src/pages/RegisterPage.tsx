import { Link } from "react-router-dom";
import { useRegister } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { mutate: register, isPending, isError, error } = useRegister();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // register({
    //   username: fd.get("name") as string,
    //   email: fd.get("email") as string,
    //   password: fd.get("password") as string,
    // });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
        <p className="text-sm text-gray-500">Điền thông tin để bắt đầu</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Họ tên</label>
          <input
            name="name"
            type="text"
            placeholder="Nguyễn Văn A"
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

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

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {isError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {(error as any)?.response?.data?.message ??
              "Đăng ký thất bại, vui lòng thử lại"}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Đang tạo tài khoản..." : "Đăng ký"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
