
import { useRef, useState } from "react";
import type { Banner } from "@/api/bannerApi";
import { X, Upload, ImageIcon } from "lucide-react";

interface BannerForm {
  title: string;
  redirectUrl: string;
  startDate: Date;
  endDate: Date;
  file: File | null;
  isActive?: boolean;
}

export type ModalMode = "create" | "edit" | null;

export default function BannerModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: {
  mode: ModalMode;
  initial?: Banner;
  onClose: () => void;
  onSubmit: (form: BannerForm) => void;
  isPending: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(
    initial?.imageUrl ?? null,
  );

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!mode) return null;

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit({
      title: fd.get("title") as string,
      redirectUrl: fd.get("redirectUrl") as string,
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      isActive: fd.get("isActive") === "ACTIVE",
      file,
    });
  };

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  console.log(initial);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-lg">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">
            {mode === "create" ? "Thêm banner mới" : "Chỉnh sửa banner"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                defaultValue={initial?.title}
                placeholder="VD: Ảnh quảng cáo giảm giá hè 2025"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Đường dẫn chuyển hướng (chỉ cần phần phía sau) <span className="text-red-500">*</span>
              </label>
              <input
                name="redirectUrl"
                type="text"
                defaultValue={initial?.redirectUrl}
                placeholder="VD: /products hoặc /products/12"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  name="startDate"
                  type="date"
                  defaultValue={
                    initial?.startDate
                      ? new Date(initial.startDate).toISOString().slice(0, 10)
                      : undefined
                  }
                  required
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  name="endDate"
                  type="date"
                  defaultValue={
                    initial?.endDate
                      ? new Date(initial.endDate).toISOString().slice(0, 10)
                      : undefined
                  }
                  required
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Ảnh banner{" "}
                {mode === "create" && <span className="text-red-500">*</span>}
              </label>

              {preview ? (
                <div className="relative w-full h-40 border border-gray-200 rounded-xl overflow-hidden group">
                  <img
                    src={preview}
                    alt="Ảnh xem trước"
                    className="w-full h-full object-contain p-3"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="text-xs text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg transition"
                    >
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={clearPreview}
                      className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ) : initial?.imageUrl ? (
                <div className="relative w-full h-40 border border-gray-200 rounded-xl overflow-hidden group">
                  <img
                    src={initial?.imageUrl}
                    alt="Ảnh xem trước"
                    className="w-full h-full object-contain p-3"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="text-xs text-white bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg transition"
                    >
                      Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={clearPreview}
                      className="text-xs text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition
                    ${
                      dragOver
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {dragOver ? (
                      <Upload size={18} className="text-blue-500" />
                    ) : (
                      <ImageIcon size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Kéo thả hoặc{" "}
                      <span className="text-blue-600 font-medium">
                        chọn file
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      PNG, JPG, WEBP — tối đa 2MB
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              {file && (
                <p className="text-xs text-gray-400 truncate">
                  📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                Trạng thái
              </label>
              <select
                name="isActive"
                defaultValue={
                  initial?.isActive === false ? "INACTIVE" : "ACTIVE"
                }
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng</option>
              </select>
            </div>
          </div>

          {}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isPending
                ? "Đang lưu..."
                : mode === "create"
                  ? "Tạo banner"
                  : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
