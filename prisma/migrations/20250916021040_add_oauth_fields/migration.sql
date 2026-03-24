-- AlterTable
ALTER TABLE `account` ADD COLUMN `EmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `Provider` VARCHAR(50) NULL,
    ADD COLUMN `ProviderAccountId` VARCHAR(255) NULL,
    MODIFY `PasswordHash` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `ACCOUNT_Provider_idx` ON `ACCOUNT`(`Provider`);

-- CreateIndex
CREATE INDEX `ACCOUNT_ProviderAccountId_idx` ON `ACCOUNT`(`ProviderAccountId`);

-- CreateIndex
CREATE INDEX `ACCOUNT_EmailVerified_idx` ON `ACCOUNT`(`EmailVerified`);
