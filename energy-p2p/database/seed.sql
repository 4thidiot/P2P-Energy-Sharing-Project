INSERT INTO USERS(name, email, password, role, zone_name, status)
VALUES('Thapar Solar House', 'producer@energy.com', '1234', 'PRODUCER', 'North Zone', 'APPROVED');

INSERT INTO USERS(name, email, password, role, zone_name, status)
VALUES('Hostel D Consumer', 'consumer@energy.com', '1234', 'CONSUMER', 'North Zone', 'APPROVED');

INSERT INTO USERS(name, email, password, role, zone_name, status)
VALUES('Admin User', 'admin@energy.com', '1234', 'ADMIN', 'Main Grid', 'APPROVED');

UPDATE WALLETS SET balance = 500 WHERE user_id = 1;
UPDATE WALLETS SET balance = 1000 WHERE user_id = 2;
UPDATE WALLETS SET balance = 0 WHERE user_id = 3;

INSERT INTO ENERGY_LISTINGS(producer_id, units_available, price_per_unit, energy_type)
VALUES(1, 50, 6.50, 'SOLAR');

INSERT INTO METER_READINGS(user_id, units_generated, units_consumed)
VALUES(1, 30, 12);

INSERT INTO ADMIN_LOGS(action)
VALUES('Sample data inserted');

COMMIT;
