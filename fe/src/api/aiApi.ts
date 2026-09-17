import axiosInstance from "./axiosInstance";
import { type ProductResponse } from "./productApi";

export interface AiChatRequest {
  message: string;
  history: { role: "user" | "model"; content: string }[];
}

export interface AiChatResponse {
  reply: string;
  recommendedProducts: ProductResponse[];
}

export const aiApi = {
  chat: async (payload: AiChatRequest): Promise<AiChatResponse> => {
    const { data } = await axiosInstance.post<AiChatResponse>("/ai/chat", payload);
    return data;
  },
};
