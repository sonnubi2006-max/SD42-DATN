import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 space-y-4">
      <p className="text-7xl font-medium text-red-500 dark:text-white">404</p>
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Trang không tồn tại
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-200">
        Đường dẫn bạn truy cập không hợp lệ
      </p>
      <Link
        to="/"
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
