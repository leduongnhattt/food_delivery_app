-- Capture schema changes pushed directly to MySQL
-- Settlement tables and commission-related fields

-- Create SETTLEMENT table
CREATE TABLE `SETTLEMENT` (
  `SettlementID` varchar(36) NOT NULL,
  `EnterpriseID` varchar(36) NOT NULL,
  `PeriodStart` datetime(3) NOT NULL,
  `PeriodEnd` datetime(3) NOT NULL,
  `NetPayout` decimal(18, 2) NULL,
  `Status` ENUM('Pending','Processing','Completed','Failed') NOT NULL DEFAULT 'Pending',
  `PaidAt` datetime(3) NULL,
  `TransactionID` varchar(255) NULL,
  `CreatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`SettlementID`),
  INDEX `SETTLEMENT_EnterpriseID_idx` (`EnterpriseID`),
  INDEX `SETTLEMENT_Status_idx` (`Status`),
  INDEX `SETTLEMENT_PeriodStart_PeriodEnd_idx` (`PeriodStart`, `PeriodEnd`),
  CONSTRAINT `SETTLEMENT_EnterpriseID_fkey`
    FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create SETTLEMENT_ITEM table
CREATE TABLE `SETTLEMENT_ITEM` (
  `SettlementItemID` varchar(36) NOT NULL,
  `SettlementID` varchar(36) NOT NULL,
  `OrderID` varchar(36) NOT NULL,
  `IsCOD` boolean NOT NULL DEFAULT 0,
  PRIMARY KEY (`SettlementItemID`),
  INDEX `SETTLEMENT_ITEM_SettlementID_idx` (`SettlementID`),
  INDEX `SETTLEMENT_ITEM_OrderID_idx` (`OrderID`),
  CONSTRAINT `SETTLEMENT_ITEM_SettlementID_fkey`
    FOREIGN KEY (`SettlementID`) REFERENCES `SETTLEMENT`(`SettlementID`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SETTLEMENT_ITEM_OrderID_fkey`
    FOREIGN KEY (`OrderID`) REFERENCES `ORDER`(`OrderID`)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add commission and cycle fields
ALTER TABLE `ENTERPRISE`
  ADD COLUMN `CommissionRate` decimal(5, 2) NULL,
  ADD COLUMN `SettlementCycle` ENUM('Weekly','Monthly','Yearly') NULL;

-- Add commission amount on orders
ALTER TABLE `ORDER`
  ADD COLUMN `CommissionAmount` decimal(18, 2) NULL;

-- Add Currency column on ACCOUNT to match schema and index it
ALTER TABLE `ACCOUNT`
  ADD COLUMN `Currency` varchar(3) NULL;

CREATE INDEX `ACCOUNT_Currency_idx` ON `ACCOUNT`(`Currency`);


