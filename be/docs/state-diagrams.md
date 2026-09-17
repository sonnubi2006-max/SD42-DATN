# Sơ đồ trạng thái nghiệp vụ

Các sơ đồ dưới đây phản ánh enum và các transition đang được service cho phép. Trạng thái kết thúc không có nghĩa bản ghi bị xóa; dữ liệu vẫn được giữ để đối soát.

## 1. Order

### Đơn POS

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Tạo đơn nháp
    DRAFT --> WAITING_PAYMENT: Chốt giỏ tại quầy
    DRAFT --> CANCELLED: Hủy nháp / giải phóng giữ hàng
    WAITING_PAYMENT --> COMPLETED: Thanh toán thành công
    WAITING_PAYMENT --> CANCELLED: Hủy thanh toán
    COMPLETED --> [*]
    CANCELLED --> [*]
```

### Đơn giao hàng

```mermaid
stateDiagram-v2
    [*] --> WAITING_PAYMENT: Tạo đơn VNPay
    [*] --> PENDING: Tạo đơn COD
    PENDING --> CONFIRMED: Xác nhận và trừ tồn
    PENDING --> CANCELLED: Hủy trước xác nhận
    WAITING_PAYMENT --> CONFIRMED: Xác nhận đơn
    WAITING_PAYMENT --> CANCELLED: Hủy
    CONFIRMED --> SHIPPING: Bàn giao vận chuyển
    CONFIRMED --> CANCELLED: Hủy trước giao
    SHIPPING --> COMPLETED: Giao thành công
    SHIPPING --> FAILED_DELIVERY: Giao thất bại
    SHIPPING --> RETURNING: Chuyển hoàn
    SHIPPING --> CANCELED_BY_DAMAGED: Hư hỏng
    FAILED_DELIVERY --> SHIPPING: Giao lại
    FAILED_DELIVERY --> RETURNING: Chuyển hoàn
    FAILED_DELIVERY --> CANCELED_BY_DAMAGED: Hư hỏng
    RETURNING --> RETURNED_TO_SHOP: Cửa hàng nhận lại
    RETURNING --> CANCELED_BY_DAMAGED: Hư hỏng khi hoàn
    RETURNED_TO_SHOP --> REFUNDED: Hoàn tiền/đóng đơn
    COMPLETED --> [*]
    CANCELLED --> [*]
    REFUNDED --> [*]
    CANCELED_BY_DAMAGED --> [*]
```

`REFUNDED` cũng có thể được đặt khi một yêu cầu trả toàn bộ dạng REFUND hoàn tất. Mỗi transition quan trọng phải sinh `OrderTransactionLog`.

## 2. Payment

```mermaid
stateDiagram-v2
    [*] --> PENDING: Tạo nghĩa vụ thanh toán
    PENDING --> PAID: Thu tiền/callback thành công
    PENDING --> FAILED: Callback thất bại
    PENDING --> CANCELLED: Hết hạn hoặc đơn bị hủy
    FAILED --> PENDING: Khởi tạo lần thanh toán lại
    PAID --> REFUNDED: Hoàn đủ số tiền
    CANCELLED --> PENDING: Tạo lại giao dịch nếu nghiệp vụ cho phép
    REFUNDED --> [*]
```

Lưu ý: code có thể đặt lại payment hiện hữu về `PENDING` khi tạo URL VNPay mới. `refundedAmount` theo dõi hoàn một phần; chỉ khi hoàn đủ mới chuyển trạng thái `REFUNDED`.

## 3. ReturnRequest

```mermaid
stateDiagram-v2
    [*] --> PENDING: Nhân viên tạo yêu cầu
    PENDING --> APPROVED: Duyệt
    PENDING --> REJECTED: Từ chối
    APPROVED --> REJECTED: Dừng xử lý có lý do
    APPROVED --> COMPLETED: Cập nhật tồn và tiền thành công
    REJECTED --> [*]
    COMPLETED --> [*]
```

Chỉ `APPROVED` được hoàn tất. `ReturnType` hiện gồm `REFUND`, `EXCHANGE`, `DAMAGED`, `WRONG_ITEM`, nhưng luồng tạo đổi/trả thông thường chỉ chấp nhận REFUND hoặc EXCHANGE; hai giá trị còn lại mang ý nghĩa nguyên nhân/ngoại lệ và cần quy tắc riêng nếu mở rộng.

### Giao sản phẩm đổi

```mermaid
stateDiagram-v2
    [*] --> PREPARING: Hoàn tất yêu cầu đổi
    PREPARING --> SHIPPING: Bàn giao vận chuyển
    PREPARING --> CANCELLED: Hủy trước giao
    PREPARING --> CANCELED_BY_DAMAGED: Hàng hỏng trước giao
    SHIPPING --> DELIVERED: Giao thành công
    SHIPPING --> FAILED_DELIVERY: Giao thất bại
    SHIPPING --> RETURNING: Chuyển hoàn
    SHIPPING --> CANCELED_BY_DAMAGED: Hỏng khi giao
    FAILED_DELIVERY --> SHIPPING: Giao lại
    FAILED_DELIVERY --> RETURNING: Chuyển hoàn
    FAILED_DELIVERY --> CANCELED_BY_DAMAGED: Hàng hỏng
    RETURNING --> RETURNED_TO_SHOP: Shop nhận lại
    RETURNING --> CANCELED_BY_DAMAGED: Hỏng khi hoàn
```

Các lần chuyển trạng thái được lưu trong `ExchangeDeliveryLog`. `FAILED_DELIVERY`, `RETURNING` và `CANCELED_BY_DAMAGED` yêu cầu lý do cùng ảnh bằng chứng. Khi `CANCELLED` hoặc `RETURNED_TO_SHOP`, hàng đổi được hoàn kho; với hàng hỏng chỉ phần không hỏng được hoàn kho và mỗi phiếu chỉ hoàn kho một lần.

## 4. Reservation

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Thêm hàng vào đơn POS nháp
    ACTIVE --> ACTIVE: Điều chỉnh số lượng
    ACTIVE --> COMPLETED: Thanh toán/chốt bán
    ACTIVE --> RELEASED: Xóa dòng hoặc hủy đơn
    ACTIVE --> EXPIRED: Quá thời hạn giữ
    COMPLETED --> [*]
    RELEASED --> [*]
    EXPIRED --> [*]
```

`ACTIVE` phải được tính vào số lượng đang giữ. `COMPLETED` cho biết reservation đã được tiêu thụ khi bán; `RELEASED` và `EXPIRED` không còn giữ hàng. Việc chuyển sang `EXPIRED` cần tiến trình tự động dựa trên `expiredAt`; enum và cột đã tồn tại nhưng không nên giả định tự chạy nếu chưa cấu hình scheduler tương ứng.

## 5. Quan hệ giữa bốn máy trạng thái

```mermaid
flowchart LR
    R["Reservation ACTIVE"] -->|Chốt POS| O["Order WAITING_PAYMENT"]
    O --> P["Payment PENDING"]
    P -->|Thành công| PP["Payment PAID"]
    PP -->|POS| RC["Reservation COMPLETED"]
    PP -->|POS| OC["Order COMPLETED"]
    O -->|Hủy| RR["Reservation RELEASED"]
    OC -->|Đủ điều kiện đổi/trả| RT["ReturnRequest PENDING"]
    RT -->|Duyệt và hoàn tất| RTC["ReturnRequest COMPLETED"]
    RTC -->|Trả toàn bộ/hoàn tiền| PR["Payment REFUNDED"]
    RTC -->|Trả toàn bộ| OR["Order REFUNDED"]
```

Không được suy ra rằng mọi Order đều có Reservation: Reservation chủ yếu phục vụ POS nháp, còn đơn online đang claim và trừ tồn trực tiếp.
