-- Drop Logo column from ENTERPRISE if it exists (safe for shadow DB)

SET @has_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ENTERPRISE'
    AND COLUMN_NAME = 'Logo'
);

SET @ddl := IF(@has_col = 1,
  'ALTER TABLE `ENTERPRISE` DROP COLUMN `Logo`',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
