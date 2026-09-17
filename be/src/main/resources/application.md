# Cấu hình ứng dụng

Ứng dụng sử dụng `application.properties` và nhận thông tin nhạy cảm qua biến môi trường. Không lưu mật khẩu, token hoặc API key thật trong thư mục này.

## Biến môi trường bắt buộc

```text
DB_PASSWORD
MAIL_USERNAME
MAIL_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
JWT_SECRET
VNPAY_TMN_CODE
VNPAY_HASH_SECRET
GHN_TOKEN
GHN_SHOP_ID
GHN_FROM_DISTRICT_ID
GEMINI_API_KEY
```

`JWT_SECRET` phải là chuỗi Base64 biểu diễn khóa ngẫu nhiên mạnh có ít nhất 32 byte
và khác nhau giữa các môi trường. Khi chạy local mà không khai báo biến này,
ứng dụng tự sinh khóa tạm; JWT đã cấp sẽ mất hiệu lực sau mỗi lần khởi động lại.
Với profile `prod` hoặc `production`, thiếu `JWT_SECRET` vẫn làm ứng dụng dừng ngay.

## Biến môi trường tùy chọn

```text
DB_URL
DB_USERNAME
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
FRONTEND_BASE_URL
FRONTEND_ADMIN_URL
APP_BASE_URL
APP_CORS_ALLOWED_ORIGINS
```

Giá trị `APP_CORS_ALLOWED_ORIGINS` là danh sách origin phân tách bằng dấu phẩy, ví dụ:

```text
http://localhost:5173,http://localhost:5174
```

## Lưu ý triển khai

- Không dùng `spring.jpa.hibernate.ddl-auto=update` trong production; chuyển sang migration có version.
- Chỉ công khai health endpoint cần thiết của Actuator.
- Swagger chỉ nên được bật trong môi trường nội bộ hoặc được bảo vệ ở production.
- Tất cả secret từng được commit cần được thu hồi và tạo lại; chỉ thay bằng placeholder không làm secret cũ an toàn trở lại.
