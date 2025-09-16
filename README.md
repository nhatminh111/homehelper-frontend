# HomeHelper - Cleaning Company React App

Ứng dụng web quản lý dịch vụ giúp việc nhà được xây dựng bằng React và kết nối với backend Node.js.

## Tính năng chính

### 🔐 Xác thực & Phân quyền
- **Đăng ký**: Tạo tài khoản mới (Customer/Tasker)
- **Đăng nhập**: Xác thực người dùng với JWT
- **Quên mật khẩu**: Gửi email reset password
- **Phân quyền**: Admin, Tasker, Customer với các quyền khác nhau

### 👥 Quản lý người dùng
- **Dashboard**: Trang tổng quan cho từng loại user
- **Quản lý tài khoản**: Cập nhật thông tin cá nhân
- **Đổi mật khẩu**: Thay đổi mật khẩu an toàn

### 🧹 Dịch vụ giúp việc
- **Tìm kiếm Tasker**: Tìm người giúp việc theo khu vực
- **Quản lý công việc**: Theo dõi trạng thái công việc
- **Đánh giá & Phản hồi**: Hệ thống rating và review
- **Thanh toán**: Quản lý hóa đơn và thanh toán

### 🎥 Tính năng đặc biệt
- **Upload video**: Tasker có thể upload video giới thiệu
- **AI Chat**: Tương tác với AI để hỗ trợ
- **Quản lý nội dung**: Admin quản lý bài viết và nội dung

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- npm hoặc yarn
- Backend server đang chạy (port 3001)

### Bước 1: Cài đặt dependencies
```bash
cd cleaning-company-react
npm install
```

### Bước 2: Cấu hình backend
Đảm bảo backend server đang chạy tại `http://localhost:3001`

### Bước 3: Chạy ứng dụng
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## Cấu trúc thư mục

```
src/
├── components/          # Components tái sử dụng
│   ├── Header.js       # Navigation header
│   ├── Footer.js       # Footer component
│   └── ProtectedRoute.js # Route protection
├── contexts/           # React Contexts
│   └── AuthContext.js  # Authentication context
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin pages
│   └── tasker/         # Tasker pages
├── services/           # API services
│   └── api.js          # API calls
└── App.js              # Main app component
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu

## Phân quyền

### 👨‍💼 Admin
- Quản lý toàn bộ hệ thống
- Quản lý Tasker và Customer
- Xem thống kê và báo cáo
- Quản lý nội dung

### 🧹 Tasker
- Quản lý profile và dịch vụ
- Xem công việc được giao
- Upload video giới thiệu
- Xem thu nhập

### 👤 Customer
- Tìm kiếm Tasker
- Đặt lịch dịch vụ
- Đánh giá và phản hồi
- Quản lý thanh toán

## Tính năng bảo mật

- **JWT Authentication**: Token-based authentication
- **Protected Routes**: Bảo vệ các trang cần đăng nhập
- **Role-based Access**: Phân quyền theo vai trò
- **Secure API Calls**: Tất cả API calls đều có xác thực

## Công nghệ sử dụng

- **Frontend**: React, React Router, Bootstrap
- **State Management**: React Context API
- **Styling**: CSS, Bootstrap, FontAwesome
- **HTTP Client**: Fetch API
- **Authentication**: JWT

## Đăng nhập bằng Google

1. Tạo OAuth Client trên Google Cloud (type: Web) và lấy Client ID.
2. Backend: thêm `GOOGLE_CLIENT_ID` vào `homehelper-backend/env.txt`.
3. Frontend: tạo file `.env` trong `cleaning-company-react` với:

```
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

4. Khởi động lại frontend để nạp biến môi trường.

## Hướng dẫn sử dụng

1. **Đăng ký tài khoản**: Chọn loại user (Customer/Tasker) và điền thông tin
2. **Đăng nhập**: Sử dụng email và mật khẩu đã đăng ký
3. **Truy cập Dashboard**: Xem tổng quan và các tính năng có sẵn
4. **Sử dụng các tính năng**: Tùy theo vai trò, sử dụng các chức năng tương ứng

## Troubleshooting

### Lỗi kết nối backend
- Kiểm tra backend server có đang chạy không
- Kiểm tra URL API trong `src/services/api.js`

### Lỗi authentication
- Kiểm tra JWT_SECRET trong backend
- Xóa localStorage và đăng nhập lại

### Lỗi CORS
- Kiểm tra cấu hình CORS trong backend
- Đảm bảo origin được cho phép

## Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License
