# 🏸 Hệ Thống Quản Lý Đặt Sân Cầu Lông (QuanLyDatSanCauLong)

> Hệ thống website quản lý đặt sân cầu lông trực tuyến với kiến trúc **Monorepo** tách biệt rõ ràng giữa Backend (RESTful API) và Frontend (Single Page/Multi-page Web App).

---

## 📁 1. Cấu Trúc Dự Án (Project Structure)

```text
QuanLyDatSanCauLong/
├── .github/workflows/ci.yml       # Cấu hình CI/CD tự động build & test qua GitHub Actions
├── backend/                       # Backend Spring Boot 3 (Java 21)
│   ├── .mvn/wrapper/              # Maven Wrapper
│   ├── mvnw & mvnw.cmd            # Script chạy Maven trên Linux/macOS & Windows
│   ├── pom.xml                    # Quản lý dependencies Maven
│   ├── Dockerfile                 # Multi-stage Docker build cho Render/Cloud
│   └── src/main/                  # Mã nguồn Java & file cấu hình application.yml
├── frontend/                      # Giao diện người dùng & quản trị (HTML/CSS/JS)
│   ├── index.html                 # Trang chủ khách hàng
│   ├── assets/                    # CSS, JS (api.js, auth.js, booking.js...)
│   └── pages/                     # Các trang chức năng (auth, user, admin)
├── database/
│   └── QLSanCauLong.sql           # Schema cơ sở dữ liệu MySQL & dữ liệu mẫu (Seed Data)
├── docker-compose.yml             # Chạy toàn bộ stack (MySQL + Backend + Frontend) bằng 1 lệnh
├── render.yaml                    # Blueprint tự động triển khai lên nền tảng Render.com
└── README.md                      # Tài liệu hướng dẫn sử dụng & triển khai
```

---

## ⚙️ 2. Yêu Cầu Môi Trường (Prerequisites)

- **Java**: OpenJDK 21 LTS trở lên
- **MySQL**: Phiên bản 8.0 trở lên
- **Maven**: 3.9+ (hoặc dùng sẵn Maven Wrapper `./mvnw` / `mvnw.cmd`)
- Trình duyệt hiện đại (Chrome, Edge, Firefox, Brave)
- *(Tùy chọn)* Docker & Docker Compose nếu muốn chạy bằng container

---

## 🚀 3. Hướng Dẫn Chạy Tại Máy Local (Step-by-Step)

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
1. Mở MySQL Workbench hoặc Terminal MySQL.
2. Chạy toàn bộ nội dung file [database/QLSanCauLong.sql](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/database/QLSanCauLong.sql):
   ```sql
   source /path/to/database/QLSanCauLong.sql;
   ```
   *Lệnh trên sẽ tự động tạo cơ sở dữ liệu `QuanLyDatSan` và khởi tạo sẵn các bảng cùng dữ liệu mẫu.*

### ⚡ Cách Nhanh Nhất (1 cú click):
- Double-click vào file [start.bat](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/start.bat) (hoặc gõ `.\start.ps1` trong PowerShell).
- File này sẽ tự động bật đồng thời cả **Backend API (port 8080)** và **Frontend Web (port 3000)** và mở trình duyệt cho bạn!

---

### Bước 2: Khởi động Backend API (Thủ công)
1. Mở thư mục `backend`:
   ```bash
   cd backend
   ```
2. Kiểm tra thông tin kết nối MySQL trong [application.yml](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/backend/src/main/resources/application.yml) (mặc định user: `root`, pass: `123456`, port: `3306`).
3. Chạy lệnh:
   - **Windows (CMD hoặc PowerShell)**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     # hoặc
     .\mvnw.ps1 spring-boot:run
     ```
     *Hoặc chạy file JAR đã build:*
     ```powershell
     java -jar target/quanlydatsan-api-0.0.1-SNAPSHOT.jar
     ```
   - **Linux / macOS**:
     ```bash
     ./mvnw spring-boot:run
     ```
4. Khi terminal hiển thị `Started QuanLyDatSanApplication in ... seconds` trên cổng `8080`, Backend đã sẵn sàng!

### Bước 3: Mở Giao diện Frontend
Vì giao diện là HTML/CSS/JS thuần, bạn có thể chạy bằng các cách sau:
- **Cách 1 (Khuyên dùng)**: Mở thư mục `frontend` bằng VS Code và dùng extension **Live Server** (chuột phải vào `index.html` chọn *Open with Live Server*).
- **Cách 2**: Chạy server tĩnh nhanh qua Python/Node:
  ```bash
  cd frontend
  # Dùng Python:
  python -m http.server 3000
  # Hoặc dùng npx:
  npx serve .
  ```
- Mở trình duyệt tại: `http://localhost:3000` hoặc cổng Live Server cung cấp.

---

## 🐳 4. Chạy Bằng Docker Compose (Chỉ với 1 lệnh)

Nếu máy đã cài Docker:
```bash
docker compose up -d --build
```
Hệ thống sẽ tự động kích hoạt:
- **MySQL 8.0**: Port `3306` (Tự động nạp dữ liệu từ `QLSanCauLong.sql`)
- **Backend API**: Port `8080`
- **Frontend Nginx**: Port `3000` (`http://localhost:3000`)

---

## 🌐 5. Hướng Dẫn Triển Khai Lên Render (Deploy Guide)

Dự án đã được cấu hình sẵn file [render.yaml](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/render.yaml) để deploy 2 dịch vụ:
1. **Backend Web Service**: Chạy Spring Boot API trong Docker.
2. **Frontend Static Site**: Chạy giao diện HTML/CSS/JS.

### Cách triển khai:
1. **Tạo Cơ sở dữ liệu MySQL trên Cloud**:
   - Sử dụng dịch vụ MySQL miễn phí như **Aiven for MySQL**, **Clever Cloud**, hoặc **Railway**.
   - Import file `database/QLSanCauLong.sql` lên cơ sở dữ liệu trên Cloud đó.
   - Lấy chuỗi kết nối: JDBC URL, Username, Password.
2. **Deploy lên Render bằng Blueprint**:
   - Đăng nhập vào [Render.com](https://render.com).
   - Chọn **Blueprints** -> Kết nối tới Repository GitHub của dự án.
   - Render sẽ tự đọc file `render.yaml`. Bạn chỉ cần điền 3 biến môi trường cho Backend:
     - `SPRING_DATASOURCE_URL`: URL MySQL cloud (ví dụ: `jdbc:mysql://host:port/database?useSSL=false`)
     - `SPRING_DATASOURCE_USERNAME`: Tên đăng nhập database
     - `SPRING_DATASOURCE_PASSWORD`: Mật khẩu database
3. **Cấu hình Frontend nhận diện Backend Render**:
   - Trong file [frontend/assets/js/api.js](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/frontend/assets/js/api.js), hệ thống đã hỗ trợ tự động:
     - Mở Console trên trình duyệt trang web đã deploy gõ 1 lần:
       ```javascript
       localStorage.setItem('API_BASE_URL', 'https://quanlydatsan-backend.onrender.com/api');
       ```
     - Hoặc cập nhật URL backend của bạn vào `api.js` trước khi deploy.

---

## 🔄 6. Tích Hợp CI/CD (GitHub Actions)

Dự án đã thiết lập quy trình tự động hóa tại [.github/workflows/ci.yml](file:///d:/M%C3%A3%20ngu%E1%BB%93n%20m%E1%BB%9F/QuanLyDatSanCauLong/.github/workflows/ci.yml):
- **Trigger**: Tự động kích hoạt mỗi khi có `push` hoặc tạo `pull_request` vào nhánh `main`.
- **Backend Job**: Khởi tạo JDK 21 Temurin, cấp quyền `chmod +x mvnw`, biên dịch Maven, đóng gói và xuất artifact `.jar`.
- **Frontend Job**: Kiểm tra toàn vẹn các file giao diện tĩnh.

---

## 🔑 7. Tài Khoản Test Hệ Thống

Dữ liệu seed từ `database/QLSanCauLong.sql` cung cấp sẵn các tài khoản:

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `123456` | Toàn quyền quản trị sân, duyệt hủy, xem thống kê |
| **User** | `an.nguyen` | `123456` | Khách hàng Nguyễn Văn An |
| **User** | `binh.tran` | `123456` | Khách hàng Trần Thị Bình |
| **User** | `cuong.le` | `123456` | Khách hàng Lê Hoàng Cường |
| **User (Khóa)**| `dung.pham` | `123456` | Tài khoản mẫu đang bị khóa để test bảo mật |
