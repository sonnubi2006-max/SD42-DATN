# Tài liệu Thiết kế chi tiết: Hệ thống Chat Nhân viên & Khách hàng

Hệ thống hỗ trợ trò chuyện trực tiếp (Live Chat) giữa Khách hàng và Nhân viên tại cửa hàng, tích hợp gửi ảnh, chọn đơn hàng hỗ trợ và lưu trữ lịch sử xử lý.

---

## 1. Thiết kế Mô hình Dữ liệu (Database Design)

### 1.1. Cập nhật bảng `messages`

Bổ sung liên kết tới đơn hàng khi khách hàng muốn gửi thông tin đơn hàng cần hỗ trợ.

- Thêm cột `order_id` (khóa ngoại liên kết tới bảng `orders`, cho phép `NULL`).
- Cập nhật enum `MessageType` ở Java và DB để hỗ trợ loại tin nhắn mới: `TEXT`, `IMAGE`, `ORDER`.

### 1.2. Tạo bảng mới `conversation_assignments` (Lịch sử xử lý hội thoại)

Bảng này lưu trữ toàn bộ lịch sử nhân viên nào đã nhận hỗ trợ cuộc trò chuyện nào, thời điểm tiếp nhận, thời điểm chuyển giao hoặc kết thúc.

```sql
CREATE TABLE conversation_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    staff_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'ASSIGNED', 'REASSIGNED', 'UNASSIGNED', 'CLOSED'
    performed_by_id BIGINT,      -- ID người thực hiện hành động này (Staff/Admin/Customer)
    performed_by_type VARCHAR(50), -- 'STAFF', 'CUSTOMER', 'SYSTEM'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    note NVARCHAR(255),
    CONSTRAINT fk_assignment_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    CONSTRAINT fk_assignment_staff FOREIGN KEY (staff_id) REFERENCES users(user_id)
);
```

### 1.3. Cập nhật bảng `conversations`

Bổ sung các trường audit nhanh phục vụ hiển thị:

- `assigned_at` TIMESTAMP NULL: Thời điểm nhân viên gần nhất nhận chat.
- `closed_at` TIMESTAMP NULL: Thời điểm đóng chat.
- `closed_by_id` BIGINT NULL: ID người đóng chat.
- `closed_by_type` VARCHAR(50) NULL: Loại người đóng ('STAFF', 'CUSTOMER', 'SYSTEM').

---

## 2. Thiết kế API Backend (Spring Boot)

### 2.1. Cập nhật API Gửi Tin Nhắn (`POST /api/chat/messages/{conversationId}`)

Hỗ trợ gửi tin nhắn loại `ORDER` và đính kèm `orderId`.

**Request Body (Multipart Form Data):**

- `messageContent`: String (Optional)
- `messageType`: String (`TEXT`, `IMAGE`, `ORDER`)
- `orderId`: Long (Optional)
- `file`: MultipartFile (Optional, chứa ảnh nếu type = `IMAGE`)

**Quy tắc nghiệp vụ (Validation):**

1. Nếu `messageType = ORDER`:
   - Phải truyền `orderId`.
   - Backend kiểm tra xem `orderId` có thuộc về khách hàng đang trò chuyện hay không (Chặn việc gửi đơn hàng của người khác).
2. Nếu `messageType = IMAGE`:
   - Phải truyền `file` hợp lệ (Ảnh dung lượng < 5MB, định dạng jpeg, png, webp).
3. Nếu gửi tin nhắn vào cuộc trò chuyện có trạng thái `CLOSED`:
   - Báo lỗi `400 Bad Request` hoặc `403 Forbidden`. Không cho phép nhắn tin khi hội thoại đã đóng.

### 2.2. API lấy Danh sách Đơn hàng Có thể Gửi (`GET /api/chat/orders/selectable`)

Cho phép khách hàng lấy nhanh danh sách các đơn hàng của họ để phục vụ việc chọn và gửi vào chat.

**Tham số:**

- `page`: Integer (default 0)
- `size`: Integer (default 10)
- `keyword`: String (tìm kiếm theo mã đơn hàng)

**Response:**
Danh sách các đơn hàng dạng rút gọn (`OrderSummaryResponse`) gồm: `orderId`, `orderCode`, `orderStatus`, `totalAmount`, `createdAt`.

### 2.3. API xem Lịch sử xử lý Hội thoại (`GET /api/chat/conversations/{conversationId}/assignments`)

Cho phép nhân viên và khách hàng xem tiến trình hỗ trợ của hội thoại này (Ai đã tiếp nhận, chuyển giao lúc nào).

**Response DTO:**

```json
[
  {
    "assignmentId": 1,
    "staffId": 12,
    "staffName": "Nguyễn Văn A",
    "staffAvatar": "/uploads/avatar-a.png",
    "action": "ASSIGNED",
    "assignedAt": "2026-07-30T10:00:00",
    "endedAt": "2026-07-30T10:15:00",
    "durationInMinutes": 15
  },
  {
    "assignmentId": 2,
    "staffId": 15,
    "staffName": "Trần Thị B",
    "staffAvatar": "/uploads/avatar-b.png",
    "action": "REASSIGNED",
    "assignedAt": "2026-07-30T10:15:00",
    "endedAt": null,
    "durationInMinutes": null
  }
]
```

---

## 3. Realtime & Socket.IO Events

Đảm bảo đồng bộ hóa hai chiều tức thời giữa Khách hàng và Nhân viên:

1. **`new_message`**:
   - Gửi từ Client lên Server và Server broadcast đến phòng (`joinConversation(conversationId)`).
   - Payload chứa thông tin tin nhắn đầy đủ (bao gồm thông tin `orderSummary` hoặc `imageUrl`).
2. **`staff_joined` / `staff_assigned`**:
   - Khi nhân viên nhấn "Nhận hỗ trợ khách" (`claimChat`), hệ thống cập nhật trạng thái hội thoại thành `OPEN` và cập nhật `staff_id`.
   - Gửi sự kiện realtime về phía khách hàng. Khách hàng cập nhật ngay lập tức giao diện hiển thị: _"Nhân viên [Tên] đang xử lý cuộc trò chuyện này"_.
3. **`conversation_closed`**:
   - Khi nhân viên hoặc khách hàng đóng cuộc trò chuyện.
   - Gửi sự kiện để bên còn lại khóa ô nhập tin nhắn và hiển thị timeline kết thúc.

---

## 4. Thiết kế Giao diện Người dùng (Frontend)

### 4.1. Phía Khách hàng (`fe`)

- **Trạng thái xử lý**: Ở phần Header của khung Chat, hiển thị rõ ràng:
  - Nếu trạng thái là `PENDING`: _"Đang chờ nhân viên tiếp nhận hỗ trợ..."_ kèm icon load xoay nhẹ.
  - Nếu trạng thái là `OPEN`: Hiển thị Avatar nhân viên đang xử lý + _"Nhân viên [Tên nhân viên] đang hỗ trợ bạn"_.
  - Nếu trạng thái là `CLOSED`: _"Cuộc hội thoại đã kết thúc lúc [Giờ] bởi [Tên]"_. Khóa nút gửi tin nhắn.
- **Lịch sử chat**:
  - Dưới tiêu đề từng cuộc trò chuyện ở danh sách bên trái, hiển thị: _"Được xử lý bởi: [Tên nhân viên]"_ để khách hàng nắm rõ lịch sử.
- **Đính kèm Ảnh**:
  - Bổ sung nút bấm đính kèm ảnh (Icon Image) bên cạnh ô nhập tin nhắn.
  - Hỗ trợ xem preview ảnh trước khi bấm nút Send.
  - Hỗ trợ click phóng to ảnh đã nhận/gửi (lightbox).
- **Gửi Đơn hàng**:
  - Thêm icon Đơn hàng (Icon ShoppingBag). Khi click sẽ mở Modal hiển thị danh sách 5-10 đơn hàng gần đây của khách.
  - Khách hàng bấm chọn một đơn hàng và bấm "Gửi đơn hàng".
  - Tin nhắn hiển thị trên khung chat dưới dạng một Card Đơn hàng (bao gồm: Mã đơn hàng, ngày đặt, trạng thái đơn, tổng tiền, danh sách rút gọn sản phẩm, nút "Xem chi tiết đơn hàng" dẫn link về trang chi tiết đơn hàng của khách).

### 4.2. Phía Nhân viên / Admin (`fe-admin`)

- **Thông tin khách hàng**:
  - Khung chat hiển thị đầy đủ thông tin Khách hàng đang chat ở Header: Tên khách hàng, Avatar, Email/SĐT (nếu có).
  - Có liên kết nhanh mở xem lịch sử mua hàng hoặc hồ sơ chi tiết của khách hàng này.
- **Nhận diện đúng tin nhắn của ai**:
  - Không dựa vào `senderName` để so sánh với User hiện tại vì có thể trùng tên hoặc không chính xác.
  - Sử dụng cấu trúc: `mine = (msg.senderType === 'STAFF' && msg.senderId === currentUser.userId)`.
  - Phân biệt rõ các tin nhắn của nhân viên khác (khi hỗ trợ chuyển giao) bằng cách hiển thị tên và avatar nhỏ của nhân viên đó ở mỗi bong bóng chat, tránh hiểu nhầm tất cả tin nhắn phía nhân viên đều là của nhân viên đang xem.
- **Đính kèm Ảnh**:
  - Cung cấp nút chọn file ảnh, hiển thị preview và cho phép nhân viên gửi ảnh hướng dẫn khách hàng.
- **Hiển thị Card Đơn hàng**:
  - Hiển thị Card đơn hàng tương tự phía khách hàng khi nhận được tin nhắn dạng `ORDER`.
  - Có nút "Xem chi tiết đơn" mở trực tiếp trang quản lý đơn hàng của Admin/Staff để kiểm tra trạng thái và xử lý nhanh cho khách.
- **Lịch sử xử lý hội thoại**:
  - Hiển thị timeline lịch sử xử lý (ví dụ: một tab phụ hoặc panel bên phải khung chat).
  - Liệt kê các mốc thời gian: Nhận chat lúc nào, chuyển giao cho ai, kết thúc chat khi nào và ai là người thực hiện.
