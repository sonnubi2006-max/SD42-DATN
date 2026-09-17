
import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { cookieUtil } from "@/utils/cookie";
import useAuthStore from "@/store/authStore";
import { sanitizeRequestValue } from "@/utils/requestSanitizer";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const getVietnameseHttpError = (status: number): string => {
  const messages: Record<number, string> = {
    400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.",
    401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy dữ liệu được yêu cầu.",
    405: "Phương thức gửi yêu cầu không được hỗ trợ.",
    408: "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.",
    409: "Dữ liệu bị trùng hoặc đã thay đổi. Vui lòng tải lại trang.",
    413: "Dữ liệu hoặc tệp tải lên vượt quá dung lượng cho phép.",
    415: "Định dạng dữ liệu gửi lên không được hỗ trợ.",
    422: "Dữ liệu không thể xử lý. Vui lòng kiểm tra lại.",
    429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
    500: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
    502: "Dịch vụ bên ngoài đang gặp sự cố. Vui lòng thử lại sau.",
    503: "Dịch vụ đang tạm thời gián đoạn. Vui lòng thử lại sau.",
    504: "Dịch vụ phản hồi quá chậm. Vui lòng thử lại sau.",
  };
  return messages[status] ?? "Có lỗi xảy ra. Vui lòng thử lại.";
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.data = sanitizeRequestValue(config.data);
    config.params = sanitizeRequestValue(config.params);
    const token = cookieUtil.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

const redirectToLogin = () => {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

axiosInstance.interceptors.response.use(
  (res: AxiosResponse<ApiResponse>) => {
    const apiRes = res.data;

    if (apiRes && typeof apiRes === "object" && "success" in apiRes) {
      if (apiRes.success === false) {
        return Promise.reject({
          message: apiRes.message ?? "Có lỗi xảy ra",
          apiMessage: apiRes.message ?? "Có lỗi xảy ra",
          response: res,
        });
      }

      res.data = (apiRes.data ?? apiRes) as ApiResponse;
    }
    return res;
  },

  async (error) => {

    if (!error.response) {
      error.apiMessage =
        error.code === "ECONNABORTED"
          ? "Kết nối quá thời gian chờ. Vui lòng thử lại."
          : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      error.message = error.apiMessage;
      return Promise.reject(error);
    }
    const original = error.config as RetryAxiosRequestConfig;
    const status = error.response.status;
    const responseData = error.response.data as {
      message?: string;
      validationErrors?: Record<string, string>;
    } | undefined;
    const validationMessage = responseData?.validationErrors
      ? Object.values(responseData.validationErrors)[0]
      : undefined;
    const backendMessage = validationMessage || responseData?.message?.trim();

    error.apiMessage = backendMessage || getVietnameseHttpError(status);
    error.message = error.apiMessage;

    const isRefreshEndpoint = original?.url?.includes("auth/refresh-token");

    if (status === 401 && !original?._retry && !isRefreshEndpoint) {
      const refreshToken = cookieUtil.getRefreshToken();

      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) =>
          failedQueue.push({ resolve, reject }),
        )
          .then((newToken) => {
            original.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshAxios = axios.create({
          baseURL: BASE_URL,
          timeout: 15000,
        });

        const { data: apiRes } = await refreshAxios.post<
          ApiResponse<{ accessToken: string; refreshToken?: string }>
        >("/auth/manager/refresh-token", { refreshToken });

        if (!apiRes?.data?.accessToken) {
          throw new Error("Invalid refresh response");
        }

        const { accessToken, refreshToken: newRefreshToken } = apiRes.data;

        cookieUtil.setAccessToken(accessToken);
        if (newRefreshToken) cookieUtil.setRefreshToken(newRefreshToken);

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        redirectToLogin();
        const normalizedError = refreshError as {
          apiMessage?: string;
          response?: { data?: { message?: string } };
        };
        normalizedError.apiMessage =
          normalizedError.response?.data?.message?.trim() ||
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        (normalizedError as { message?: string }).message =
          normalizedError.apiMessage;
        return Promise.reject(normalizedError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
