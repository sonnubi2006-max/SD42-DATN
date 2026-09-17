import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "@/hooks/useAuth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { isLoading, isSuccess, isError } = useVerifyEmail(token);

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Xác thực email</h1>

      {isLoading && (
        <p className="text-sm text-gray-500">Đang xác thực, vui lòng chờ...</p>
      )}

      {isSuccess && (
        <div className="space-y-3">
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
            ✅ Email đã được xác thực thành công!
          </p>
          <Link
            to="/login"
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Đăng nhập ngay →
          </Link>
        </div>
      )}

      {isError && (
        <div className="space-y-3">
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            Link xác thực không hợp lệ hoặc đã hết hạn.
          </p>
          <Link to="/login" className="text-blue-600 text-sm hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      )}
    </div>
  );
}
