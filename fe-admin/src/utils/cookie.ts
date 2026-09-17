import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

const isProd = import.meta.env.PROD;

const defaultOptions: Cookies.CookieAttributes = {
  secure: isProd, 
  sameSite: "Strict", 
  path: "/",
};

export const cookieUtil = {
  setAccessToken: (token: string) =>
    Cookies.set(ACCESS_TOKEN_KEY, token, {
      ...defaultOptions,
      expires: 1 / 24, 
    }),

  setRefreshToken: (token: string) =>
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      ...defaultOptions,
      expires: 7, 
    }),

  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY) ?? null,

  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY) ?? null,

  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  },
};
