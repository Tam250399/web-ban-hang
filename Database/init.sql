-- 1. Bảng Vai trò (Roles)
CREATE TABLE Roles (
    Id INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

-- 2. Bảng Người dùng (Users)
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    PhoneNumber VARCHAR(15),
    RoleId INT FOREIGN KEY REFERENCES Roles(Id),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 3. Bảng Sản phẩm Vật liệu Xây dựng (Products)
CREATE TABLE Products (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProductCode VARCHAR(50) NOT NULL UNIQUE,
    ProductName NVARCHAR(200) NOT NULL,
    Unit NVARCHAR(50) NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    StockQuantity DECIMAL(18, 2) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- 4. Bảng Quản lý Ảnh sản phẩm (ProductImages - Kết nối MinIO)
CREATE TABLE ProductImages (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT FOREIGN KEY REFERENCES Products(Id) ON DELETE CASCADE,
    MinIoObjectName VARCHAR(255) NOT NULL,
    ImageUrl VARCHAR(500) NOT NULL,
    IsMain BIT DEFAULT 0
);

-- 5. Bảng Giao dịch kho (StockTransactions)
CREATE TABLE StockTransactions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT FOREIGN KEY REFERENCES Products(Id) ON DELETE CASCADE,
    Type VARCHAR(20) NOT NULL CHECK (Type IN ('Import', 'Export')),
    Quantity DECIMAL(18, 2) NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    Note NVARCHAR(500),
    TransactionDate DATETIME DEFAULT GETDATE()
);

-- Chèn dữ liệu mẫu cho Roles
SET IDENTITY_INSERT Roles ON;
INSERT INTO Roles (Id, RoleName) VALUES (1, 'Admin'), (2, 'Customer'), (3, 'Staff');
SET IDENTITY_INSERT Roles OFF;
