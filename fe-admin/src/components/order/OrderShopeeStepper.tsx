import { ShieldAlert, Truck, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderResponse, OrderStatus } from "@/api/orderApi";

interface OrderShopeeStepperProps {
  order: OrderResponse;
  baseSteps: any[];
}

export default function OrderShopeeStepper({ order, baseSteps }: OrderShopeeStepperProps) {

  const getStepTime = (status: OrderStatus) => {
    const logsForStatus = order.transactionLogs?.filter((t) => t.currentStatus === status);
    let dateStr = null;

    if (logsForStatus && logsForStatus.length > 0) {
      dateStr = logsForStatus[logsForStatus.length - 1].createdAt;
    } else if (status === "PENDING" || status === "WAITING_STOCK" || status === "WAITING_PAYMENT" || status === "DRAFT") {
      dateStr = order.createdAt;
    }

    if (!dateStr) return null;

    return new Date(dateStr).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card className="border border-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white">
      <CardContent className="py-8 px-4 sm:px-10">
        <div className="relative flex items-center justify-between w-full">
          { }
          {(() => {
            const stepsToRender: any[] = [];
            const initialStatuses = ["DRAFT", "PENDING", "WAITING_STOCK", "CONFIRMED"];

            const truckIcon = baseSteps.find(s => s.status === "SHIPPING")?.icon || Truck;
            const checkIcon = baseSteps.find(s => s.status === "COMPLETED")?.icon || CheckCircle;
            const isDelivery = baseSteps.some(s => s.status === "SHIPPING");

            baseSteps.forEach(s => {
              if (initialStatuses.includes(s.status)) {
                stepsToRender.push(s);
              }
            });

            const deliveryLogs = order.transactionLogs?.filter(t =>
              ["SHIPPING", "FAILED_DELIVERY", "RETURNING", "RETURNED_TO_SHOP", "CANCELED_BY_DAMAGED", "COMPLETED"].includes(t.currentStatus)
            ) || [];
            const sortedLogs = [...deliveryLogs].sort((a, b) => a.logId - b.logId);

            let lastAdded: string | null = null;
            sortedLogs.forEach(log => {
              if (stepsToRender.some(s => s.status === log.currentStatus)) {
                return;
              }
              if (log.currentStatus === "SHIPPING") {
                stepsToRender.push({
                  label: lastAdded === "FAILED_DELIVERY" ? "Giao lại hàng" : "Đang giao hàng",
                  status: "SHIPPING" as OrderStatus,
                  icon: truckIcon,
                });
                lastAdded = "SHIPPING";
              } else if (log.currentStatus === "FAILED_DELIVERY") {
                stepsToRender.push({
                  label: "Giao thất bại",
                  status: "FAILED_DELIVERY" as OrderStatus,
                  icon: ShieldAlert,
                });
                lastAdded = "FAILED_DELIVERY";
              } else if (log.currentStatus === "RETURNING") {
                stepsToRender.push({
                  label: "Đang chuyển hoàn",
                  status: "RETURNING" as OrderStatus,
                  icon: truckIcon,
                });
                lastAdded = "RETURNING";
              } else if (log.currentStatus === "RETURNED_TO_SHOP") {
                stepsToRender.push({
                  label: "Nhận lại hàng hoàn",
                  status: "RETURNED_TO_SHOP" as OrderStatus,
                  icon: checkIcon,
                });
                lastAdded = "RETURNED_TO_SHOP";
              } else if (log.currentStatus === "CANCELED_BY_DAMAGED") {
                stepsToRender.push({
                  label: "Hủy do hỏng hàng",
                  status: "CANCELED_BY_DAMAGED" as OrderStatus,
                  icon: ShieldAlert,
                });
                lastAdded = "CANCELED_BY_DAMAGED";
              } else if (log.currentStatus === "COMPLETED") {
                stepsToRender.push({
                  label: "Hoàn thành",
                  status: "COMPLETED" as OrderStatus,
                  icon: checkIcon,
                });
                lastAdded = "COMPLETED";
              }
            });

            if (lastAdded === null) {
              if (isDelivery) {
                stepsToRender.push(
                  { label: "Đang giao hàng", status: "SHIPPING" as OrderStatus, icon: truckIcon },
                  { label: "Hoàn thành", status: "COMPLETED" as OrderStatus, icon: checkIcon }
                );
              } else {
                stepsToRender.push(
                  { label: "Hoàn thành", status: "COMPLETED" as OrderStatus, icon: checkIcon }
                );
              }
            } else if (lastAdded !== "COMPLETED" && !["CANCELLED", "REFUNDED", "RETURNED_TO_SHOP", "CANCELED_BY_DAMAGED"].includes(order.status)) {
              stepsToRender.push({
                label: "Hoàn thành",
                status: "COMPLETED" as OrderStatus,
                icon: checkIcon,
              });
            }

            if (order.status === "CANCELLED" || order.transactionLogs?.some(t => t.currentStatus === "CANCELLED")) {
              stepsToRender.push({ label: "Đã hủy", status: "CANCELLED" as OrderStatus, icon: ShieldAlert });
            }
            if (order.status === "REFUNDED" || order.transactionLogs?.some(t => t.currentStatus === "REFUNDED")) {
              stepsToRender.push({ label: "Hoàn tiền", status: "REFUNDED" as OrderStatus, icon: ShieldAlert });
            }

            let currentIdx = -1;
            for (let i = stepsToRender.length - 1; i >= 0; i--) {
              if (stepsToRender[i].status === order.status) {
                currentIdx = i;
                break;
              }
            }
            if (currentIdx === -1) {
              currentIdx = 0;
            }

            const activeSteps = stepsToRender.filter((step, idx) => {
              if (idx >= currentIdx && step.status !== "CANCELLED" && step.status !== "REFUNDED" && step.status !== "RETURNED_TO_SHOP" && step.status !== "CANCELED_BY_DAMAGED") return true;
              if (idx === currentIdx) return true;
              if (initialStatuses.includes(step.status)) {
                if (step.status === "PENDING" || step.status === "WAITING_STOCK" || step.status === "WAITING_PAYMENT" || step.status === "DRAFT") return true;
                return order.transactionLogs?.some(t => t.currentStatus === step.status);
              }
              return true;
            });

            let currentActiveIdx = -1;
            for (let i = activeSteps.length - 1; i >= 0; i--) {
              if (activeSteps[i].status === order.status) {
                currentActiveIdx = i;
                break;
              }
            }
            if (currentActiveIdx === -1) {
              currentActiveIdx = 0;
            }

            return activeSteps.map((step, index) => {
              let state = "upcoming";
              if (currentActiveIdx !== -1) {
                if (index < currentActiveIdx) state = "completed";
                else if (index === currentActiveIdx) state = "active";
              }

              const StepIcon = step.icon || CheckCircle;
              const stepTime = getStepTime(step.status as OrderStatus);

              let circleClass = "bg-gray-100 border-2 border-gray-200 text-gray-400";
              let textClass = "text-gray-400 font-medium";

              if (state === "completed") {
                circleClass = "bg-emerald-500 border-2 border-emerald-500 text-white shadow-sm";
                textClass = "text-emerald-600 font-semibold";
              } else if (state === "active") {
                if (step.status === "CANCELLED" || step.status === "REFUNDED" || step.status === "CANCELED_BY_DAMAGED") {
                  circleClass = "bg-white border-2 border-red-500 text-red-500 scale-110 shadow-md ring-4 ring-red-50";
                  textClass = "text-red-600 font-bold";
                } else if (step.status === "RETURNING" || step.status === "RETURNED_TO_SHOP") {
                  circleClass = "bg-white border-2 border-purple-500 text-purple-500 scale-110 shadow-md ring-4 ring-purple-50";
                  textClass = "text-purple-600 font-bold";
                } else {
                  circleClass = "bg-white border-2 border-emerald-500 text-emerald-500 scale-110 shadow-md ring-4 ring-emerald-50";
                  textClass = "text-emerald-600 font-bold";
                }
              }

              let connectorClass = "bg-gray-100";
              if (index > 0) {
                let isSegmentActive = false;
                if (currentActiveIdx !== -1) {
                  isSegmentActive = index <= currentActiveIdx;
                }

                if (isSegmentActive) {
                  const isCancelledOrRefunded =
                    step.status === "CANCELLED" ||
                    step.status === "REFUNDED" ||
                    step.status === "CANCELED_BY_DAMAGED" ||
                    activeSteps[index - 1].status === "CANCELLED" ||
                    activeSteps[index - 1].status === "REFUNDED" ||
                    activeSteps[index - 1].status === "CANCELED_BY_DAMAGED";

                  connectorClass = isCancelledOrRefunded ? "bg-red-500" : "bg-emerald-500";
                }
              }

              return (
                <div key={index} className="flex flex-col items-center flex-1 text-center relative">
                  { }
                  {index > 0 && (
                    <div className={`absolute -left-1/2 right-1/2 top-6 h-0.5 -z-10 transition-colors duration-300 ${connectorClass}`} />
                  )}

                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
                    <StepIcon size={20} />
                  </div>
                  <div className="mt-3 space-y-0.5">
                    <p className={`text-xs ${textClass} line-clamp-1`}>{step.label}</p>
                    <p className="text-[10px] text-gray-400  mt-0.5 h-5">{stepTime}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
