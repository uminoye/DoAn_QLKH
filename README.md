# WMS - Hệ thống Quản lý Kho Đa Chi Nhánh

Hệ thống Quản lý Kho (Warehouse Management System) chuyên nghiệp, đáp ứng bài toán quản lý hàng hóa đa kho (Multi-Warehouse) với chiến lược Lưu trữ động (Dynamic Storage).

## Cong nghệ

- **Frontend**: React 18 + Vite, Tailwind CSS, React Router DOM v6, Axios, Recharts, Lucide React
- **Backend**: Node.js + Express.js, Sequelize ORM, PostgreSQL
- **Database**: PostgreSQL (Neon.tech hoac local)
- **Auth**: JWT + Bcryptjs (RBAC 4 vai tro)

## Cau truc du an

```
DoAn_QLKH/
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection, app config
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, RBAC, error handling
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   ├── scripts/
│   │   ├── init-db.sql    # Database schema + seed data
│   │   └── setupDb.js     # DB setup script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # Shared UI components
│   │   ├── contexts/      # Auth + Warehouse contexts
│   │   ├── layouts/       # Sidebar + Header layout
│   │   ├── pages/         # Feature pages
│   │   └── utils/         # Helpers
│   └── package.json
└── package.json            # Monorepo root
```

## Cai dat

### 1. Database (PostgreSQL)

Tao database tren Neon.tech hoac local PostgreSQL:

```sql
CREATE DATABASE wms_db;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Chinh sua .env voi thong tin DB cua ban
npm install
```

### 3. Chay DB Schema + Seed Data

```bash
cd backend
npm run db:setup
```

### 4. Frontend

```bash
cd frontend
npm install
```

## Chay he thong

### Che do development (dong thoi):

```bash
npm run dev
```

Hoac chay rieng le:

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

## Tai khoan demo

Tat ca mat khau: `123456`

| Tai khoan | Mat khau | Vai tro |
|-----------|----------|--------|
| admin | 123456 | ADMIN |
| manager | 123456 | MANAGER |
| kho | 123456 | KHO |
| sales | 123456 | SALES |

## Tinh nang chinh

### Phan he Quản lý Kho
- Tao chi nhanh kho + tu dong sinh ma ke (A-A1-R1-S1-B1)
- Dashboard suc chua theo phan tram

### Phan he San pham
- San pham generic (khong hardcode danh muc)
- Tu dong sinh ma SKU (SP-000001)

### Nhap kho (Inbound)
- Tao phieu + gợi ý ke trong (Auto-Bin Suggestion)
- Duyệt phieu + cap nhat inventory + trang thai bin

### Xuat kho (Outbound)
- Tao phieu + tu dong FIFO (First-In-First-Out)
- Duyệt + hoan tat (tu dong rut hang tu bin cu nhat)

### Ban hang (Sales)
- Tao don hang + kiem tra ton kho
- Duyệt don -> tu dong tao phieu xuat kho

### Bao cao
- Bang pivot ton kho da kho
- Tong hop nhap/xuat/ban hang

## RBAC - Phan quyen

| Chuc nang | ADMIN | MANAGER | KHO | SALES |
|-----------|-------|---------|-----|-------|
| Dashboard | X | X | X | X |
| QL Kho | CRUD | Xem | - | - |
| San pham | CRUD | Xem | Xem | Xem |
| Danh muc | CRUD | - | - | - |
| Khach hang | CRUD | Xem | - | CRUD |
| Ton kho | X | X | X | - |
| Nhap kho | CRUD | Duyet | CRUD | - |
| Xuat kho | CRUD | Duyet | CRUD | - |
| Don hang | CRUD | Duyet | - | CRUD |
| Bao cao | X | X | - | - |
| Nguoi dung | CRUD | - | - | - |

## API Endpoints

Xem chi tiet trong phan mo ta yeu cau he thong. Tat ca endpoint deu can token JWT (tru /api/auth/login).

## SQL Transactions

Moi giao dich nghiep vu deu duoc bao ve boi SQL Transaction (BEGIN/COMMIT/ROLLBACK):
- Tao kho + sinh bins
- Duyet phieu nhap + cap nhat inventory
- Duyet phieu xuat + FIFO rut hang
- Duyet don hang + tao outbound tu dong
