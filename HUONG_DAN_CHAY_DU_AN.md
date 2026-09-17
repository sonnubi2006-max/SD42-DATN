# Hướng dẫn chạy dự án SD42

Tài liệu này hướng dẫn dùng Docker cho Redis/RabbitMQ và chạy mã nguồn từng ứng dụng trên Windows để phát triển.

## 1. Thành phần hệ thống

| Thành phần | Công nghệ | Địa chỉ mặc định |
|---|---|---|
| Website khách hàng | React, Vite | http://localhost:5173 |
| Trang admin/nhân viên | React, Vite | http://localhost:5174 |
| Backend API | Spring Boot | http://localhost:8080/api/v1 |
| Socket.IO | Netty Socket.IO | http://localhost:9092 |
| SQL Server | SQL Server 2022 | `localhost:1433` |
| Redis | Redis 7 | `localhost:6379` |
| RabbitMQ | RabbitMQ 3.13 | `localhost:5672` |
| RabbitMQ Management | Giao diện quản trị RabbitMQ | http://localhost:15672 |

## 2. Chạy Redis và RabbitMQ bằng Docker

### Yêu cầu

- Git.
- Docker Desktop đang chạy ở chế độ Linux containers.
- Docker Compose v2 (`docker compose version`).
- Khoảng 1 GB RAM trống cho hai container.

### Bước 1: lấy mã nguồn

```powershell
git clone https://github.com/ngha79/sd42.git
Set-Location sd42
```

Nếu đã có mã nguồn, chỉ cần mở PowerShell tại thư mục gốc của dự án.

### Bước 2: khởi động dịch vụ

```powershell
docker compose up -d
```

Compose dùng image chính thức và không build backend/frontend. Tài khoản RabbitMQ local mặc định là `sd42` / `sd42_dev_password`.

Có thể tạo `.env` để đổi tài khoản hoặc cổng host:

```dotenv
RABBITMQ_USERNAME=sd42
RABBITMQ_PASSWORD=MatKhauRabbitMqLocal
REDIS_PORT=6379
RABBITMQ_AMQP_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
```

### Bước 3: kiểm tra cấu hình

```powershell
docker compose config --quiet
```

Lệnh không hiển thị lỗi nghĩa là cấu hình hợp lệ.

### Bước 4: kiểm tra trạng thái

```powershell
docker compose ps
docker compose logs -f redis rabbitmq
```

Khi cả hai service ở trạng thái `healthy`, RabbitMQ Management có tại http://localhost:15672.

## 3. Các lệnh Docker thường dùng

Xem trạng thái và log:

```powershell
docker compose ps
docker compose logs -f
docker compose logs --tail 200 redis rabbitmq
```

Khởi động lại một service:

```powershell
docker compose restart redis rabbitmq
```

Dừng hệ thống nhưng giữ dữ liệu:

```powershell
docker compose down
```

Xóa container và toàn bộ dữ liệu local trong named volumes:

```powershell
docker compose down -v
```

> Cảnh báo: lệnh `docker compose down -v` xóa dữ liệu Redis và RabbitMQ đang lưu trong Docker.

## 4. Chạy thủ công để phát triển

Chế độ này phù hợp khi cần hot reload frontend hoặc debug backend. Cài Java 17, Maven 3.9+, Node.js 22+, npm và SQL Server. Redis và RabbitMQ chạy bằng Docker.

### Bước 1: chạy các dịch vụ hạ tầng

```powershell
docker compose up -d
docker compose ps
```

### Bước 2: chạy backend

Mở một cửa sổ PowerShell mới tại thư mục gốc. Các mật khẩu bên dưới phải trùng với `.env`:

```powershell
$env:SPRING_PROFILES_ACTIVE = "docker"
$env:DB_URL = "jdbc:sqlserver://localhost:1433;databaseName=DATN_SD42;encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true"
$env:DB_USERNAME = "sa"
$env:DB_PASSWORD = "MatKhauSqlServerTrongFileEnv"
$env:REDIS_HOST = "localhost"
$env:RABBITMQ_HOST = "localhost"
$env:RABBITMQ_USERNAME = "sd42"
$env:RABBITMQ_PASSWORD = "MatKhauRabbitMqTrongFileEnv"
$env:JWT_SECRET = "ChuoiJwtSecretTrongFileEnv"
$env:FRONTEND_CUSTOMER_URL = "http://localhost:5173"
$env:FRONTEND_ADMIN_URL = "http://localhost:5174"

Set-Location be
mvn.cmd spring-boot:run
```

Backend chạy tại `http://localhost:8080`, Socket.IO tại `http://localhost:9092`.

### Bước 3: chạy website khách hàng

Mở một cửa sổ PowerShell khác:

```powershell
Set-Location fe
npm.cmd ci
$env:VITE_API_URL = "http://localhost:8080/api/v1"
npm.cmd run dev -- --port 5173
```

### Bước 4: chạy trang admin/nhân viên

Mở thêm một cửa sổ PowerShell:

```powershell
Set-Location fe-admin
npm.cmd ci
$env:VITE_API_URL = "http://localhost:8080/api/v1"
npm.cmd run dev -- --port 5174
```

## 5. Kiểm tra mã nguồn

Backend:

```powershell
Set-Location be
mvn.cmd test
```

Website khách hàng:

```powershell
Set-Location fe
npm.cmd ci
npm.cmd run build
```

Trang admin/nhân viên:

```powershell
Set-Location fe-admin
npm.cmd ci
npm.cmd run typecheck
npm.cmd run build
```

## 6. Xử lý lỗi thường gặp

### Docker Desktop trả lỗi 500 hoặc `input/output error`

Khởi động lại Docker Desktop, đợi Docker Engine ở trạng thái Running rồi kiểm tra:

```powershell
docker version
docker compose config --quiet
docker compose up -d
```

### Port đã được sử dụng

Kiểm tra các port `1433`, `5173`, `5174`, `5672`, `6379`, `8080`, `9092` và `15672`:

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object LocalPort -In 1433,5173,5174,5672,6379,8080,9092,15672
```

Dừng ứng dụng đang chiếm port hoặc đặt `REDIS_PORT`, `RABBITMQ_AMQP_PORT`, `RABBITMQ_MANAGEMENT_PORT` trong `.env`.

### Backend không kết nối được SQL Server

Kiểm tra SQL Server local đang chạy ở cổng `1433`, database `DATN_SD42` đã tồn tại và các biến `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` của backend đúng.

### Frontend gọi sai API

Kiểm tra `VITE_API_URL=http://localhost:8080/api/v1`. Khi chạy dev, đặt biến trước lệnh khởi động Vite; khi build production, đặt biến trước lệnh build:

```powershell
$env:VITE_API_URL = "http://localhost:8080/api/v1"
npm.cmd run build
```

### Kiểm tra nhanh toàn bộ log khi service không healthy

```powershell
docker compose ps
docker compose logs --tail 300 redis rabbitmq
```
