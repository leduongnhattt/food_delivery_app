-- CreateTable
CREATE TABLE `ROLE` (
    `RoleID` VARCHAR(36) NOT NULL,
    `RoleName` VARCHAR(50) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `Permissions` JSON NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ROLE_RoleName_key`(`RoleName`),
    PRIMARY KEY (`RoleID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ACCOUNT` (
    `AccountID` VARCHAR(36) NOT NULL,
    `Email` VARCHAR(100) NOT NULL,
    `Username` VARCHAR(255) NOT NULL,
    `PasswordHash` VARCHAR(255) NOT NULL,
    `Avatar` VARCHAR(255) NULL,
    `RoleID` VARCHAR(36) NOT NULL,
    `Locale` VARCHAR(10) NULL,
    `Status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,
    `LastLogin` DATETIME(3) NULL,

    UNIQUE INDEX `ACCOUNT_Email_key`(`Email`),
    UNIQUE INDEX `ACCOUNT_Username_key`(`Username`),
    INDEX `ACCOUNT_RoleID_idx`(`RoleID`),
    INDEX `ACCOUNT_Locale_idx`(`Locale`),
    INDEX `ACCOUNT_Status_idx`(`Status`),
    INDEX `ACCOUNT_CreatedAt_idx`(`CreatedAt`),
    PRIMARY KEY (`AccountID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CUSTOMER` (
    `CustomerID` VARCHAR(36) NOT NULL,
    `FullName` VARCHAR(100) NOT NULL,
    `PhoneNumber` VARCHAR(15) NOT NULL,
    `Address` VARCHAR(255) NOT NULL,
    `DateOfBirth` DATETIME(3) NULL,
    `Gender` ENUM('Male', 'Female', 'Other') NULL,
    `PreferredPaymentMethod` ENUM('Cash', 'CreditCard', 'MoMo', 'BankTransfer') NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `CUSTOMER_PhoneNumber_key`(`PhoneNumber`),
    UNIQUE INDEX `CUSTOMER_AccountID_key`(`AccountID`),
    INDEX `CUSTOMER_PreferredPaymentMethod_idx`(`PreferredPaymentMethod`),
    PRIMARY KEY (`CustomerID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ENTERPRISE` (
    `EnterpriseID` VARCHAR(36) NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,
    `EnterpriseName` VARCHAR(100) NOT NULL,
    `Address` VARCHAR(255) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `PhoneNumber` VARCHAR(15) NOT NULL,
    `OpenHours` VARCHAR(10) NOT NULL,
    `CloseHours` VARCHAR(10) NOT NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,
    `DeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ENTERPRISE_AccountID_key`(`AccountID`),
    UNIQUE INDEX `ENTERPRISE_PhoneNumber_key`(`PhoneNumber`),
    INDEX `ENTERPRISE_AccountID_idx`(`AccountID`),
    INDEX `ENTERPRISE_EnterpriseName_idx`(`EnterpriseName`),
    INDEX `ENTERPRISE_DeletedAt_idx`(`DeletedAt`),
    FULLTEXT INDEX `ENTERPRISE_EnterpriseName_Description_idx`(`EnterpriseName`, `Description`),
    PRIMARY KEY (`EnterpriseID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ADMIN` (
    `AdminID` VARCHAR(36) NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,
    `Permission` JSON NULL,
    `CanManageSystem` BOOLEAN NOT NULL DEFAULT false,
    `CanViewReport` BOOLEAN NOT NULL DEFAULT false,
    `RoleLevel` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `ADMIN_AccountID_key`(`AccountID`),
    INDEX `ADMIN_RoleLevel_idx`(`RoleLevel`),
    PRIMARY KEY (`AdminID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FOOD_CATEGORY` (
    `CategoryID` VARCHAR(36) NOT NULL,
    `CategoryName` VARCHAR(50) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,
    `AdminID` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `FOOD_CATEGORY_CategoryName_key`(`CategoryName`),
    INDEX `FOOD_CATEGORY_AdminID_idx`(`AdminID`),
    PRIMARY KEY (`CategoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FOOD` (
    `FoodID` VARCHAR(36) NOT NULL,
    `DishName` VARCHAR(100) NOT NULL,
    `Price` DECIMAL(18, 2) NOT NULL,
    `Stock` INTEGER NOT NULL DEFAULT 0,
    `Description` VARCHAR(255) NULL,
    `ImageURL` VARCHAR(255) NULL,
    `FoodCategoryID` VARCHAR(36) NOT NULL,
    `IsAvailable` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    INDEX `FOOD_FoodCategoryID_idx`(`FoodCategoryID`),
    INDEX `FOOD_Price_idx`(`Price`),
    INDEX `FOOD_DishName_idx`(`DishName`),
    INDEX `FOOD_FoodCategoryID_IsAvailable_Price_idx`(`FoodCategoryID`, `IsAvailable`, `Price`),
    FULLTEXT INDEX `FOOD_DishName_Description_idx`(`DishName`, `Description`),
    PRIMARY KEY (`FoodID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MENU` (
    `MenuID` VARCHAR(36) NOT NULL,
    `EnterpriseID` VARCHAR(36) NOT NULL,
    `Description` VARCHAR(100) NULL,
    `MenuName` VARCHAR(100) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    INDEX `MENU_EnterpriseID_idx`(`EnterpriseID`),
    INDEX `MENU_CreatedAt_idx`(`CreatedAt`),
    PRIMARY KEY (`MenuID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MENU_FOOD` (
    `FoodID` VARCHAR(36) NOT NULL,
    `MenuID` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`FoodID`, `MenuID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VOUCHER` (
    `VoucherID` VARCHAR(36) NOT NULL,
    `EnterpriseID` VARCHAR(36) NULL,
    `AdminID` VARCHAR(36) NULL,
    `Code` VARCHAR(100) NOT NULL,
    `DiscountPercent` DECIMAL(5, 2) NULL,
    `DiscountAmount` DECIMAL(10, 2) NULL,
    `CreatedBy` ENUM('Admin', 'Business') NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,
    `Status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `ExpiryDate` DATETIME(3) NULL,
    `MaxUsage` INTEGER NULL,
    `UsedCount` INTEGER NOT NULL DEFAULT 0,
    `MinOrderValue` DECIMAL(10, 2) NULL,

    INDEX `VOUCHER_Status_idx`(`Status`),
    INDEX `VOUCHER_ExpiryDate_idx`(`ExpiryDate`),
    INDEX `VOUCHER_EnterpriseID_idx`(`EnterpriseID`),
    INDEX `VOUCHER_AdminID_idx`(`AdminID`),
    INDEX `VOUCHER_CreatedAt_idx`(`CreatedAt`),
    UNIQUE INDEX `VOUCHER_Code_key`(`Code`),
    PRIMARY KEY (`VoucherID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ORDER` (
    `OrderID` VARCHAR(36) NOT NULL,
    `CustomerID` VARCHAR(36) NOT NULL,
    `VoucherID` VARCHAR(36) NULL,
    `TotalAmount` DECIMAL(18, 2) NOT NULL,
    `OrderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `DeliveryAddress` TEXT NOT NULL,
    `DeliveryNote` TEXT NULL,
    `EstimatedDeliveryTime` DATETIME(3) NULL,
    `Status` ENUM('Pending', 'Completed', 'Canceled') NOT NULL DEFAULT 'Pending',

    INDEX `ORDER_VoucherID_idx`(`VoucherID`),
    INDEX `ORDER_Status_idx`(`Status`),
    INDEX `ORDER_OrderDate_idx`(`OrderDate`),
    INDEX `ORDER_TotalAmount_idx`(`TotalAmount`),
    INDEX `ORDER_CustomerID_Status_idx`(`CustomerID`, `Status`),
    INDEX `ORDER_Status_OrderDate_idx`(`Status`, `OrderDate`),
    INDEX `ORDER_CustomerID_OrderDate_idx`(`CustomerID`, `OrderDate`),
    PRIMARY KEY (`OrderID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ORDER_DETAIL` (
    `OrderDetailID` VARCHAR(36) NOT NULL,
    `OrderID` VARCHAR(36) NOT NULL,
    `FoodID` VARCHAR(36) NOT NULL,
    `SubTotal` DECIMAL(18, 2) NOT NULL,
    `Quantity` INTEGER NOT NULL,

    INDEX `ORDER_DETAIL_OrderID_idx`(`OrderID`),
    INDEX `ORDER_DETAIL_FoodID_idx`(`FoodID`),
    UNIQUE INDEX `ORDER_DETAIL_OrderID_FoodID_key`(`OrderID`, `FoodID`),
    PRIMARY KEY (`OrderDetailID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CART` (
    `CartID` VARCHAR(36) NOT NULL,
    `CustomerID` VARCHAR(36) NOT NULL,
    `EnterpriseID` VARCHAR(36) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    INDEX `CART_CustomerID_idx`(`CustomerID`),
    INDEX `CART_EnterpriseID_idx`(`EnterpriseID`),
    PRIMARY KEY (`CartID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CART_ITEM` (
    `CartItemID` VARCHAR(36) NOT NULL,
    `CartID` VARCHAR(36) NOT NULL,
    `FoodID` VARCHAR(36) NOT NULL,
    `Quantity` INTEGER NOT NULL DEFAULT 1,
    `Note` VARCHAR(255) NULL,
    `Price` DECIMAL(18, 2) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    INDEX `CART_ITEM_CartID_idx`(`CartID`),
    INDEX `CART_ITEM_FoodID_idx`(`FoodID`),
    UNIQUE INDEX `CART_ITEM_CartID_FoodID_key`(`CartID`, `FoodID`),
    PRIMARY KEY (`CartItemID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DELIVERY_DRIVER` (
    `DriverID` VARCHAR(36) NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,
    `FullName` VARCHAR(100) NOT NULL,
    `PhoneNumber` VARCHAR(15) NOT NULL,
    `VehicleType` VARCHAR(50) NULL,
    `Status` ENUM('Offline', 'Idle', 'EnRoute', 'Delivering', 'Unavailable') NOT NULL DEFAULT 'Offline',
    `CurrentLat` DECIMAL(10, 7) NULL,
    `CurrentLng` DECIMAL(10, 7) NULL,
    `LastActiveAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `DELIVERY_DRIVER_AccountID_key`(`AccountID`),
    UNIQUE INDEX `DELIVERY_DRIVER_PhoneNumber_key`(`PhoneNumber`),
    INDEX `DELIVERY_DRIVER_Status_idx`(`Status`),
    INDEX `DELIVERY_DRIVER_AccountID_idx`(`AccountID`),
    PRIMARY KEY (`DriverID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PAYMENT` (
    `PaymentID` VARCHAR(36) NOT NULL,
    `OrderID` VARCHAR(36) NOT NULL,
    `PaymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `PaymentStatus` ENUM('Pending', 'Completed', 'Failed') NOT NULL DEFAULT 'Pending',
    `TransactionID` VARCHAR(255) NULL,
    `PaymentMethod` ENUM('Cash', 'CreditCard', 'MoMo', 'BankTransfer') NOT NULL,
    `TransactionData` JSON NULL,

    UNIQUE INDEX `PAYMENT_TransactionID_key`(`TransactionID`),
    INDEX `PAYMENT_OrderID_idx`(`OrderID`),
    INDEX `PAYMENT_PaymentStatus_idx`(`PaymentStatus`),
    INDEX `PAYMENT_PaymentDate_idx`(`PaymentDate`),
    PRIMARY KEY (`PaymentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SUPPORT` (
    `MessageID` VARCHAR(36) NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,
    `Subject` VARCHAR(255) NOT NULL,
    `Description` VARCHAR(255) NULL,
    `SentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Status` ENUM('Pending', 'InProgress', 'Resolved', 'Closed') NOT NULL DEFAULT 'Pending',
    `ReplyMessage` TEXT NULL,

    INDEX `SUPPORT_AccountID_idx`(`AccountID`),
    INDEX `SUPPORT_Status_idx`(`Status`),
    INDEX `SUPPORT_SentAt_idx`(`SentAt`),
    PRIMARY KEY (`MessageID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `REVIEWS` (
    `ReviewID` VARCHAR(36) NOT NULL,
    `CustomerID` VARCHAR(36) NOT NULL,
    `EnterpriseID` VARCHAR(36) NOT NULL,
    `Rating` TINYINT NULL,
    `Comment` VARCHAR(100) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NULL,
    `Images` JSON NULL,

    INDEX `REVIEWS_CustomerID_idx`(`CustomerID`),
    INDEX `REVIEWS_EnterpriseID_idx`(`EnterpriseID`),
    INDEX `REVIEWS_Rating_idx`(`Rating`),
    INDEX `REVIEWS_CreatedAt_idx`(`CreatedAt`),
    UNIQUE INDEX `REVIEWS_CustomerID_EnterpriseID_key`(`CustomerID`, `EnterpriseID`),
    PRIMARY KEY (`ReviewID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `USER_HEALTH` (
    `HealthID` VARCHAR(36) NOT NULL,
    `CustomerID` VARCHAR(36) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Age` INTEGER NULL,
    `Gender` ENUM('Male', 'Female', 'Other') NULL,
    `Height` DECIMAL(8, 2) NULL,
    `Weight` DECIMAL(8, 2) NULL,
    `Goal` VARCHAR(100) NULL,
    `MedicalConditions` JSON NULL,
    `PreferredCuisine` JSON NULL,
    `UpdatedAt` DATETIME(3) NULL,

    INDEX `USER_HEALTH_CustomerID_idx`(`CustomerID`),
    INDEX `USER_HEALTH_UpdatedAt_idx`(`UpdatedAt`),
    PRIMARY KEY (`HealthID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AUTH_TOKEN` (
    `TokenID` VARCHAR(36) NOT NULL,
    `AccountID` VARCHAR(36) NOT NULL,
    `RefreshToken` VARCHAR(255) NOT NULL,
    `AccessToken` VARCHAR(255) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ExpiredAt` DATETIME(3) NOT NULL,
    `RevokedAt` DATETIME(3) NULL,
    `IsValid` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `AUTH_TOKEN_RefreshToken_key`(`RefreshToken`),
    INDEX `AUTH_TOKEN_AccountID_idx`(`AccountID`),
    INDEX `AUTH_TOKEN_ExpiredAt_idx`(`ExpiredAt`),
    INDEX `AUTH_TOKEN_CreatedAt_idx`(`CreatedAt`),
    INDEX `AUTH_TOKEN_AccountID_IsValid_ExpiredAt_idx`(`AccountID`, `IsValid`, `ExpiredAt`),
    PRIMARY KEY (`TokenID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ACCOUNT` ADD CONSTRAINT `ACCOUNT_RoleID_fkey` FOREIGN KEY (`RoleID`) REFERENCES `ROLE`(`RoleID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CUSTOMER` ADD CONSTRAINT `CUSTOMER_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ENTERPRISE` ADD CONSTRAINT `ENTERPRISE_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ADMIN` ADD CONSTRAINT `ADMIN_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FOOD_CATEGORY` ADD CONSTRAINT `FOOD_CATEGORY_AdminID_fkey` FOREIGN KEY (`AdminID`) REFERENCES `ADMIN`(`AdminID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FOOD` ADD CONSTRAINT `FOOD_FoodCategoryID_fkey` FOREIGN KEY (`FoodCategoryID`) REFERENCES `FOOD_CATEGORY`(`CategoryID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MENU` ADD CONSTRAINT `MENU_EnterpriseID_fkey` FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MENU_FOOD` ADD CONSTRAINT `MENU_FOOD_FoodID_fkey` FOREIGN KEY (`FoodID`) REFERENCES `FOOD`(`FoodID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MENU_FOOD` ADD CONSTRAINT `MENU_FOOD_MenuID_fkey` FOREIGN KEY (`MenuID`) REFERENCES `MENU`(`MenuID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VOUCHER` ADD CONSTRAINT `VOUCHER_EnterpriseID_fkey` FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VOUCHER` ADD CONSTRAINT `VOUCHER_AdminID_fkey` FOREIGN KEY (`AdminID`) REFERENCES `ADMIN`(`AdminID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ORDER` ADD CONSTRAINT `ORDER_CustomerID_fkey` FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`CustomerID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ORDER` ADD CONSTRAINT `ORDER_VoucherID_fkey` FOREIGN KEY (`VoucherID`) REFERENCES `VOUCHER`(`VoucherID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ORDER_DETAIL` ADD CONSTRAINT `ORDER_DETAIL_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `ORDER`(`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ORDER_DETAIL` ADD CONSTRAINT `ORDER_DETAIL_FoodID_fkey` FOREIGN KEY (`FoodID`) REFERENCES `FOOD`(`FoodID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CART` ADD CONSTRAINT `CART_CustomerID_fkey` FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CART` ADD CONSTRAINT `CART_EnterpriseID_fkey` FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CART_ITEM` ADD CONSTRAINT `CART_ITEM_CartID_fkey` FOREIGN KEY (`CartID`) REFERENCES `CART`(`CartID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CART_ITEM` ADD CONSTRAINT `CART_ITEM_FoodID_fkey` FOREIGN KEY (`FoodID`) REFERENCES `FOOD`(`FoodID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DELIVERY_DRIVER` ADD CONSTRAINT `DELIVERY_DRIVER_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PAYMENT` ADD CONSTRAINT `PAYMENT_OrderID_fkey` FOREIGN KEY (`OrderID`) REFERENCES `ORDER`(`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SUPPORT` ADD CONSTRAINT `SUPPORT_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `REVIEWS` ADD CONSTRAINT `REVIEWS_CustomerID_fkey` FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `REVIEWS` ADD CONSTRAINT `REVIEWS_EnterpriseID_fkey` FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `USER_HEALTH` ADD CONSTRAINT `USER_HEALTH_CustomerID_fkey` FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AUTH_TOKEN` ADD CONSTRAINT `AUTH_TOKEN_AccountID_fkey` FOREIGN KEY (`AccountID`) REFERENCES `ACCOUNT`(`AccountID`) ON DELETE CASCADE ON UPDATE CASCADE;
