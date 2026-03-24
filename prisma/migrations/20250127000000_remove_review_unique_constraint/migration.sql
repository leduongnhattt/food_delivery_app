-- Remove unique constraint to allow multiple reviews from same customer for same restaurant
ALTER TABLE `REVIEWS` DROP INDEX `REVIEWS_CustomerID_EnterpriseID_key`;
