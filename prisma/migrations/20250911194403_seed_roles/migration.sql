-- Seed data for ROLE table
-- This migration inserts the main roles for the food delivery application

INSERT INTO `ROLE` (`RoleID`, `RoleName`, `Description`, `Permissions`, `IsActive`, `CreatedAt`, `UpdatedAt`) VALUES
(UUID(), 'Admin', 'System administrator with full access to manage the platform', '{"users": ["create", "read", "update", "delete"], "restaurants": ["create", "read", "update", "delete"], "orders": ["read", "update"], "reports": ["read"], "system": ["manage"]}', true, NOW(), NULL),
(UUID(), 'Enterprise', 'Restaurant owner with access to manage their restaurant and menu', '{"restaurant": ["read", "update"], "menu": ["create", "read", "update", "delete"], "orders": ["read", "update"], "reports": ["read"]}', true, NOW(), NULL),
(UUID(), 'Customer', 'Regular customer who can place orders and manage their profile', '{"profile": ["read", "update"], "orders": ["create", "read"], "reviews": ["create", "read", "update"]}', true, NOW(), NULL);
