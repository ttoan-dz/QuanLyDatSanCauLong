import subprocess
import sys

def run_sql(sql):
    cmd = [
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "-u", "root", "-p123456", "--default-character-set=utf8mb4",
        "-D", "QuanLyDatSan",
        "-e", sql
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    if res.returncode != 0:
        print(f"FAILED SQL: {sql[:100]}...\nERROR: {res.stderr}")
        return False, res.stderr
    return True, res.stdout

def column_exists(table, column):
    sql = f"SHOW COLUMNS FROM `{table}` LIKE '{column}';"
    ok, out = run_sql(sql)
    return ok and column.lower() in out.lower()

def table_exists(table):
    sql = f"SHOW TABLES LIKE '{table}';"
    ok, out = run_sql(sql)
    return ok and table.lower() in out.lower()

print("Starting safe migration...")

# 1. DiaDiem columns
if not column_exists("DiaDiem", "DiaChi"):
    run_sql("ALTER TABLE DiaDiem ADD COLUMN DiaChi VARCHAR(255) NULL AFTER TenDiaDiem;")
    print("Added DiaChi to DiaDiem")
if not column_exists("DiaDiem", "SDT"):
    run_sql("ALTER TABLE DiaDiem ADD COLUMN SDT VARCHAR(15) NULL AFTER DiaChi;")
    print("Added SDT to DiaDiem")

run_sql("UPDATE DiaDiem SET DiaChi = 'Số 35 Trần Quý Kiên, Cầu Giấy, Hà Nội', SDT = '02438335566' WHERE TenDiaDiem = 'Nhà thi đấu Cầu Giấy' AND (DiaChi IS NULL OR DiaChi = '');")
run_sql("UPDATE DiaDiem SET DiaChi = 'Số 9 Khuất Duy Tiến, Thanh Xuân, Hà Nội', SDT = '02435588999' WHERE TenDiaDiem = 'Sân cầu lông Thanh Xuân' AND (DiaChi IS NULL OR DiaChi = '');")

# 2. San columns
if not column_exists("San", "LoaiSan"):
    run_sql("ALTER TABLE San ADD COLUMN LoaiSan VARCHAR(50) NOT NULL DEFAULT 'Sân tiêu chuẩn' AFTER TenSan;")
    print("Added LoaiSan to San")

# 3. DatSan columns
datsan_cols = [
    ("HanThanhToan", "DATETIME NULL AFTER NgayTao"),
    ("TienSan", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER HanThanhToan"),
    ("TienTraTruoc", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER TienSan"),
    ("GioCheckIn", "DATETIME NULL AFTER GioKetThuc"),
    ("GioCheckOut", "DATETIME NULL AFTER GioCheckIn"),
    ("SoBlockQuaGio", "INT NOT NULL DEFAULT 0 AFTER GioCheckOut"),
    ("TienQuaGio", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER SoBlockQuaGio"),
    ("MaNV", "INT NULL AFTER MaSan")
]
for col, col_def in datsan_cols:
    if not column_exists("DatSan", col):
        run_sql(f"ALTER TABLE DatSan ADD COLUMN {col} {col_def};")
        print(f"Added {col} to DatSan")

run_sql("UPDATE DatSan SET TienSan = SoTien WHERE TienSan = 0 AND SoTien > 0;")
run_sql("UPDATE DatSan SET TienTraTruoc = SoTien WHERE TrangThaiThanhToan = 'DaThanhToan' AND TienTraTruoc = 0;")
run_sql("UPDATE DatSan SET HanThanhToan = DATE_ADD(NgayTao, INTERVAL 10 MINUTE) WHERE HanThanhToan IS NULL;")

# Drop check constraint on DatSan.TrangThaiDat if needed
drop_ck = """
SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'QuanLyDatSan' AND TABLE_NAME = 'DatSan' AND CONSTRAINT_TYPE = 'CHECK'
AND (CONSTRAINT_NAME LIKE '%TrangThaiDat%' OR CONSTRAINT_NAME LIKE '%CK_DatSan_TrangThaiDat%');
"""
ok, out = run_sql(drop_ck)
if ok:
    for line in out.strip().split('\n')[1:]:
        ck_name = line.strip()
        if ck_name:
            run_sql(f"ALTER TABLE DatSan DROP CHECK `{ck_name}`;")
            print(f"Dropped CHECK constraint: {ck_name}")

# 4. Role Staff & NhanVien table
run_sql("INSERT IGNORE INTO Role (TenRole) VALUES ('Staff');")

run_sql("""
CREATE TABLE IF NOT EXISTS NhanVien (
    MaNV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NULL,
    HoTen       VARCHAR(100) NOT NULL,
    SDT         VARCHAR(15)  NOT NULL UNIQUE,
    Email       VARCHAR(100) NULL,
    ChucVu      VARCHAR(20)  NOT NULL DEFAULT 'NhanVien',
    NgayVaoLam  DATE         NOT NULL DEFAULT (CURRENT_DATE),
    MaTK        INT          NULL UNIQUE,
    CONSTRAINT FK_NhanVien_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT FK_NhanVien_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified NhanVien table")

run_sql("""
INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Nguyễn Quản Trị', '0988888888', 'admin@datsan.vn', 'QuanTri', '2024-01-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE MaTK = (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'admin'));
""")

run_sql("""
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaRole, TrangThai)
SELECT 'staff.caugiay', '$2b$12$wnZrEYBPsOOZmPysC45jFukqGbA/eT9jVUI0yGSTHa1G6pQObPmke', (SELECT MaRole FROM Role WHERE TenRole = 'Staff' LIMIT 1), 'HoatDong'
WHERE NOT EXISTS (SELECT 1 FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay');
""")

run_sql("""
INSERT INTO NhanVien (MaDiaDiem, HoTen, SDT, Email, ChucVu, NgayVaoLam, MaTK)
SELECT 1, 'Trần Nhân Viên', '0912345678', 'staff.cg@datsan.vn', 'NhanVien', '2024-03-01', (SELECT MaTK FROM TaiKhoan WHERE TenDangNhap = 'staff.caugiay')
WHERE NOT EXISTS (SELECT 1 FROM NhanVien WHERE SDT = '0912345678');
""")

# 5. DichVu table
run_sql("""
CREATE TABLE IF NOT EXISTS DichVu (
    MaDV        INT AUTO_INCREMENT PRIMARY KEY,
    MaDiaDiem   INT NOT NULL,
    TenDV       VARCHAR(100) NOT NULL,
    LoaiDV      VARCHAR(20)  NOT NULL DEFAULT 'Ban',
    DonGia      DECIMAL(12,2) NOT NULL DEFAULT 0,
    SoLuongTon  INT NOT NULL DEFAULT 0,
    HinhAnh     VARCHAR(255) NULL,
    TrangThai   VARCHAR(20) NOT NULL DEFAULT 'HoatDong',
    CONSTRAINT FK_DichVu_DiaDiem FOREIGN KEY (MaDiaDiem) REFERENCES DiaDiem(MaDiaDiem),
    CONSTRAINT CK_DichVu_DonGia CHECK (DonGia >= 0),
    CONSTRAINT CK_DichVu_SoLuongTon CHECK (SoLuongTon >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified DichVu table")

# Seed DichVu
services = [
    (1, "Nước khoáng Aquafina 500ml", "Ban", 10000, 100),
    (1, "Nước tăng lực Revive chanh muối", "Ban", 15000, 80),
    (1, "Nước tăng lực RedBull", "Ban", 20000, 60),
    (1, "Thuê vợt Yonex cao cấp (cây/ca)", "ChoThue", 30000, 20),
    (1, "Quả cầu lông Thành Công (quả)", "Ban", 25000, 50),
    (2, "Nước khoáng Lavie 500ml", "Ban", 10000, 100),
    (2, "Thuê vợt Victor (cây/ca)", "ChoThue", 30000, 15)
]
for mdd, tendv, loaidv, dongia, sl in services:
    run_sql(f"""
    INSERT INTO DichVu (MaDiaDiem, TenDV, LoaiDV, DonGia, SoLuongTon)
    SELECT {mdd}, '{tendv}', '{loaidv}', {dongia}, {sl}
    WHERE NOT EXISTS (SELECT 1 FROM DichVu WHERE MaDiaDiem = {mdd} AND TenDV = '{tendv}');
    """)

# 6. ChiTietDatSan table
run_sql("""
CREATE TABLE IF NOT EXISTS ChiTietDatSan (
    MaCTDatSan    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaSan         INT NOT NULL,
    MaNV          INT NULL,
    BatDau        DATETIME NOT NULL,
    KetThuc       DATETIME NOT NULL,
    GioCheckIn    DATETIME NULL,
    GioCheckOut   DATETIME NULL,
    TienSan       DECIMAL(12,2) NOT NULL DEFAULT 0,
    SoBlockQuaGio INT NOT NULL DEFAULT 0,
    TienQuaGio    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaXacNhan',
    CONSTRAINT FK_CTDS_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan) ON DELETE CASCADE,
    CONSTRAINT FK_CTDS_San FOREIGN KEY (MaSan) REFERENCES San(MaSan),
    CONSTRAINT FK_CTDS_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified ChiTietDatSan table")

run_sql("""
INSERT INTO ChiTietDatSan (MaDatSan, MaSan, BatDau, KetThuc, TienSan, TrangThai)
SELECT 
    d.MaDatSan, 
    d.MaSan, 
    TIMESTAMP(d.NgayChoi, d.GioBatDau), 
    TIMESTAMP(d.NgayChoi, d.GioKetThuc), 
    d.SoTien, 
    CASE 
        WHEN d.TrangThaiDat = 'ChoXacNhan' THEN 'GiuCho'
        WHEN d.TrangThaiDat = 'DaXacNhan' THEN 'DaXacNhan'
        WHEN d.TrangThaiDat = 'HoanThanh' THEN 'HoanThanh'
        WHEN d.TrangThaiDat = 'DaHuy' AND d.LyDoHuy = 'KhongDenNhan' THEN 'KhongDen'
        WHEN d.TrangThaiDat = 'DaHuy' THEN 'DaHuy'
        ELSE 'DaXacNhan'
    END
FROM DatSan d
WHERE NOT EXISTS (SELECT 1 FROM ChiTietDatSan c WHERE c.MaDatSan = d.MaDatSan);
""")

# 7. ChiTietDichVu table
run_sql("""
CREATE TABLE IF NOT EXISTS ChiTietDichVu (
    MaCTDV      INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan    INT NOT NULL,
    MaDV        INT NOT NULL,
    SoLuong     INT NOT NULL DEFAULT 1,
    DonGia      DECIMAL(12,2) NOT NULL DEFAULT 0,
    GhiChu      VARCHAR(255) NULL,
    ThoiGian    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_CTDV_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan) ON DELETE CASCADE,
    CONSTRAINT FK_CTDV_DichVu FOREIGN KEY (MaDV) REFERENCES DichVu(MaDV),
    CONSTRAINT CK_CTDV_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CTDV_DonGia CHECK (DonGia >= 0)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified ChiTietDichVu table")

# 8. HoaDon table
run_sql("""
CREATE TABLE IF NOT EXISTS HoaDon (
    MaHoaDon        INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan        INT NOT NULL UNIQUE,
    NgayLap         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTienSan     DECIMAL(12,2) NOT NULL DEFAULT 0,
    TongTienDV      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienQuaGio      DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienTraTruoc    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TienHoanDuyet   DECIMAL(12,2) NOT NULL DEFAULT 0,
    ThanhTien       DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai       VARCHAR(20) NOT NULL DEFAULT 'DaThanhToan',
    CONSTRAINT FK_HoaDon_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified HoaDon table")

run_sql("""
INSERT INTO HoaDon (MaDatSan, NgayLap, TongTienSan, TongTienDV, TienQuaGio, TienTraTruoc, TienHoanDuyet, ThanhTien, TrangThai)
SELECT 
    d.MaDatSan,
    d.NgayTao,
    d.SoTien,
    0,
    0,
    d.SoTien,
    0,
    0,
    'DaThanhToan'
FROM DatSan d
WHERE d.TrangThaiDat = 'HoanThanh'
  AND NOT EXISTS (SELECT 1 FROM HoaDon h WHERE h.MaDatSan = d.MaDatSan);
""")

# 9. ThanhToan columns
if not column_exists("ThanhToan", "MaHoaDon"):
    run_sql("ALTER TABLE ThanhToan ADD COLUMN MaHoaDon INT NULL AFTER MaDatSan;")
    print("Added MaHoaDon to ThanhToan")
if not column_exists("ThanhToan", "MaGiaoDich"):
    run_sql("ALTER TABLE ThanhToan ADD COLUMN MaGiaoDich VARCHAR(100) NULL AFTER MaHoaDon;")
    print("Added MaGiaoDich to ThanhToan")
if not column_exists("ThanhToan", "LoaiThanhToan"):
    run_sql("ALTER TABLE ThanhToan ADD COLUMN LoaiThanhToan VARCHAR(20) NOT NULL DEFAULT 'TraTruoc' AFTER MaGiaoDich;")
    print("Added LoaiThanhToan to ThanhToan")

# 10. HoanTien table
run_sql("""
CREATE TABLE IF NOT EXISTS HoanTien (
    MaHoanTien    INT AUTO_INCREMENT PRIMARY KEY,
    MaDatSan      INT NOT NULL,
    MaThanhToan   INT NULL,
    NgayYeuCau    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LyDo          VARCHAR(255) NOT NULL,
    LoaiHuy       VARCHAR(20) NOT NULL DEFAULT 'KhachHuy',
    TyLeHoan      INT NOT NULL DEFAULT 0,
    SoTienHoan    DECIMAL(12,2) NOT NULL DEFAULT 0,
    TrangThai     VARCHAR(20) NOT NULL DEFAULT 'DaHoan',
    CONSTRAINT FK_HoanTien_DatSan FOREIGN KEY (MaDatSan) REFERENCES DatSan(MaDatSan),
    CONSTRAINT FK_HoanTien_ThanhToan FOREIGN KEY (MaThanhToan) REFERENCES ThanhToan(MaThanhToan)
) ENGINE=InnoDB CHARACTER SET utf8mb4;
""")
print("Created/verified HoanTien table")

run_sql("""
INSERT INTO HoanTien (MaDatSan, NgayYeuCau, LyDo, LoaiHuy, TyLeHoan, SoTienHoan, TrangThai)
SELECT 4, '2026-09-25 20:30:00', 'Khách không đến nhận sân quá 30 phút', 'KhongDen', 0, 0, 'KhongHoan'
WHERE EXISTS (SELECT 1 FROM DatSan WHERE MaDatSan = 4)
  AND NOT EXISTS (SELECT 1 FROM HoanTien WHERE MaDatSan = 4);
""")

print("Migration completed successfully!")
