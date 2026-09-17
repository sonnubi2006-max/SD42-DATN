import { useMutation } from "@tanstack/react-query";
import { marketingApi, type PromotionEmailRequest } from "@/api/marketingApi";

export const useSendPromotionEmail = () => {
  return useMutation({
    mutationFn: (payload: PromotionEmailRequest) => marketingApi.sendPromotion(payload),
  });
};
