import { Check, CircleX, Clock3, PackageCheck, RotateCcw } from "lucide-react";
import type { ReturnStatus } from "@/api/returnApi";

interface ReturnProcessTimelineProps {
  status: ReturnStatus;
  createdAt: string;
  updatedAt?: string;
}

export default function ReturnProcessTimeline({
  status,
  createdAt,
  updatedAt,
}: ReturnProcessTimelineProps) {
  const rejected = status === "REJECTED";
  const activeIndex =
    status === "COMPLETED" ? 2 : status === "APPROVED" ? 1 : 0;
  const steps = rejected
    ? [
        {
          label: "Đã tiếp nhận",
          description: "Yêu cầu được gửi",
          icon: RotateCcw,
          time: createdAt,
        },
        {
          label: "Đã từ chối",
          description: "Không đủ điều kiện hoàn trả",
          icon: CircleX,
          time: updatedAt,
        },
      ]
    : [
        {
          label: "Đã tiếp nhận",
          description: "Chờ cửa hàng kiểm tra",
          icon: Clock3,
          time: createdAt,
        },
        {
          label: "Đã phê duyệt",
          description: "Chờ nhận hàng hoàn",
          icon: PackageCheck,
          time:
            status === "APPROVED" || status === "COMPLETED"
              ? updatedAt
              : undefined,
        },
        {
          label: "Hoàn tất",
          description: "Kiểm kho và hoàn tiền",
          icon: Check,
          time: status === "COMPLETED" ? updatedAt : undefined,
        },
      ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-900">
            Tiến trình xử lý
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi các bước của yêu cầu hoàn trả
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {rejected ? "Đã đóng" : `Bước ${activeIndex + 1}/${steps.length}`}
        </span>
      </div>

      <div
        className={`grid gap-3 ${
          rejected ? "sm:grid-cols-2" : "sm:grid-cols-3"
        }`}
      >
        {steps.map((step, index) => {
          const completed = rejected ? index <= 1 : index <= activeIndex;
          const current = rejected ? index === 1 : index === activeIndex;
          const Icon = step.icon;
          const tone = rejected && index === 1 ? "rose" : "emerald";

          return (
            <div
              key={step.label}
              className={`relative rounded-xl border p-3.5 transition ${
                current
                  ? tone === "rose"
                    ? "border-rose-200 bg-rose-50"
                    : "border-emerald-200 bg-emerald-50"
                  : completed
                    ? "border-slate-200 bg-slate-50"
                    : "border-dashed border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                    current
                      ? tone === "rose"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-600 text-white"
                      : completed
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium ${
                      completed ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    {step.description}
                  </p>
                  {step.time && (
                    <p className="mt-2 text-[10px] font-semibold text-slate-400">
                      {new Date(step.time).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
