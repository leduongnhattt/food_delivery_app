/*
  Warnings:

  - The values [Canceled] on the enum `ORDER_Status` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `EnterpriseID` to the `FOOD` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `food` ADD COLUMN `EnterpriseID` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `order` MODIFY `Status` ENUM('Pending', 'Confirmed', 'Preparing', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Completed', 'Cancelled', 'Refunded') NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE INDEX `FOOD_EnterpriseID_idx` ON `FOOD`(`EnterpriseID`);

-- CreateIndex
CREATE INDEX `FOOD_EnterpriseID_IsAvailable_idx` ON `FOOD`(`EnterpriseID`, `IsAvailable`);

-- AddForeignKey
ALTER TABLE `FOOD` ADD CONSTRAINT `FOOD_EnterpriseID_fkey` FOREIGN KEY (`EnterpriseID`) REFERENCES `ENTERPRISE`(`EnterpriseID`) ON DELETE RESTRICT ON UPDATE CASCADE;
