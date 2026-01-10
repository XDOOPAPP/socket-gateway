# Socket Gateway

Gatewway xử lý kết nối WebSocket thời gian thực (Real-time), đóng vai trò cầu nối giữa Client và hệ thống backend (Microservices). Service này chịu trách nhiệm xác thực socket connection, lắng nghe các sự kiện từ Message Queue (RabbitMQ) và đẩy thông báo xuống cho Client thông qua Socket.IO.

## 🚀 Tính năng

- **Real-time Communication**: Sử dụng Socket.IO để giao tiếp 2 chiều với client.
- **Authentication**: Xác thực người dùng khi kết nối Socket thông qua JWT Token.
- **Event Driven**: Lắng nghe sự kiện từ RabbitMQ (Exchange `domain_events`) để trigger thông báo.
- **Targeted Messaging**: Hỗ trợ gửi tin nhắn cho cụ thể User, Admin hoặc Broadcast tất cả.
- **Resilient**: Tự động kết nối lại RabbitMQ nếu mất kết nối.

## 🛠️ Yêu cầu cài đặt

- [Node.js](https://nodejs.org/) (v14 trở lên)
- [RabbitMQ](https://www.rabbitmq.com/) server đang chạy

## 📦 Cài đặt

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd socket-gateway
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   - Copy file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Cập nhật các giá trị trong `.env` tương ứng với môi trường của bạn.

## ⚙️ Cấu hình (.env)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `PORT` | Cổng chạy service | `3003` |
| `RABBITMQ_URL` | Đường dẫn kết nối RabbitMQ | `amqp://localhost` |
| `JWT_SECRET` | Secret key để verify JWT access token | |
| `CORS_ORIGIN` | Domain frontend được phép kết nối CORS | `*` |

## ▶️ Chạy ứng dụng

- **Chế độ Development** (với nodemon):
  ```bash
  npm run dev
  ```

- **Chế độ Production**:
  ```bash
  npm start
  ```

## 🔌 Socket Integration (Dành cho Client)

### 1. Kết nối
Client cần gửi JWT token trong phần `auth` của handshake khi kết nối.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3003", {
  auth: {
    token: "YOUR_ACCESS_TOKEN" // Token JWT của user
  }
});

socket.on("connect", () => {
  console.log("Connected with ID:", socket.id);
});
```

### 2. Sự kiện lắng nghe
Client lắng nghe sự kiện `notification:new` để nhận thông báo mới.

```javascript
socket.on("notification:new", (data) => {
  console.log("Received notification:", data);
  // data: { title: "...", message: "...", type: "...", ... }
});
```

## 🐇 RabbitMQ Integration (Dành cho Backend Services)

Service này lắng nghe Exchange `domain_events` (Topic Exchange) với routing key `notification.send`.

**Cấu trúc message gửi lên RabbitMQ:**

```json
{
  "target": "user", // 'user' | 'admins' | 'all'
  "userId": "user_uuid_here", // Bắt buộc nếu target='user'
  "payload": {
    "title": "Thông báo mới",
    "message": "Bạn có đơn hàng mới",
    "type": "ORDER_CREATED"
  }
}
```

## 📂 Cấu trúc dự án

```
socket-gateway/
├── src/
│   ├── config/          # Cấu hình môi trường (env)
│   ├── events/          # Xử lý sự kiện Message Queue (Consumer)
│   ├── socket/          # Xử lý sự kiện Socket.IO
│   └── ...
├── index.js             # Entry point
├── package.json
└── .env.example
```
