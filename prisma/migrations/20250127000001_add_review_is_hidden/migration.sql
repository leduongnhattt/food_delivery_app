-- Add IsHidden field to REVIEWS table
ALTER TABLE `REVIEWS` ADD COLUMN `IsHidden` BOOLEAN NOT NULL DEFAULT false;

-- Add index for IsHidden field for better query performance
CREATE INDEX `REVIEWS_IsHidden_idx` ON `REVIEWS` (`IsHidden`);

