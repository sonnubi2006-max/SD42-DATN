import type { Category } from "@/api/categoryApi";

export default function ConfirmModalCategory({
  category,
  onConfirm,
  onCancel,
  isPending,
}: {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-lg">
          🗑
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-900">Xoá danh mục?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Danh mục{" "}
            <span className="font-medium text-gray-700">
              "{category.categoryName}"
            </span>{" "}
            sẽ bị xoá vĩnh viễn. Thao tác này không thể hoàn tác.
          </p>
        </div>
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition"
          >
            {isPending ? "Đang xoá..." : "Xác nhận xoá"}
          </button>
        </div>
      </div>
    </div>
  );
}
