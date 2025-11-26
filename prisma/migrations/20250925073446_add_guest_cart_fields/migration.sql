/*
  Warnings:

  - You are about to drop the column `Permission` on the `admin` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[GuestToken]` on the table `CART` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `admin` DROP COLUMN `Permission`;

-- AlterTable
ALTER TABLE `cart` ADD COLUMN `ExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `GuestToken` VARCHAR(64) NULL,
    ADD COLUMN `Status` ENUM('Active', 'CheckedOut', 'Abandoned') NOT NULL DEFAULT 'Active',
    MODIFY `CustomerID` VARCHAR(36) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CART_GuestToken_key` ON `CART`(`GuestToken`);

-- CreateIndex
CREATE INDEX `CART_ExpiresAt_idx` ON `CART`(`ExpiresAt`);
