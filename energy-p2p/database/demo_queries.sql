-- Simple demo queries for viva.

-- 1. Show available energy listings using a join view.
SELECT * FROM VW_AVAILABLE_LISTINGS;

-- 2. Show wallet balances.
SELECT u.name, u.role, w.balance
FROM USERS u
JOIN WALLETS w ON w.user_id = u.user_id;

-- 3. Show transaction details using joins.
SELECT * FROM VW_TRANSACTION_DETAILS;

-- 4. Show meter reading and excess units calculated by trigger.
SELECT * FROM METER_READINGS;

-- 5. Show admin logs.
SELECT * FROM ADMIN_LOGS ORDER BY log_time DESC;
