
CREATE OR REPLACE PACKAGE PKG_USER AS
    PROCEDURE register_user(
        p_name IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_role IN VARCHAR2,
        p_zone_name IN VARCHAR2,
        p_user_id OUT NUMBER
    );

    PROCEDURE login_user(
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    );

    PROCEDURE approve_user(
        p_user_id IN NUMBER,
        p_status IN VARCHAR2
    );
END PKG_USER;
/

CREATE OR REPLACE PACKAGE BODY PKG_USER AS
    PROCEDURE register_user(
        p_name IN VARCHAR2,
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_role IN VARCHAR2,
        p_zone_name IN VARCHAR2,
        p_user_id OUT NUMBER
    ) AS
    BEGIN
        INSERT INTO USERS(name, email, password, role, zone_name)
        VALUES(TRIM(p_name), LOWER(TRIM(p_email)), p_password, UPPER(p_role), p_zone_name)
        RETURNING user_id INTO p_user_id;

        INSERT INTO ADMIN_LOGS(action)
        VALUES('New user registered: ' || p_name);
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20001, 'Email already exists');
    END register_user;

    PROCEDURE login_user(
        p_email IN VARCHAR2,
        p_password IN VARCHAR2,
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT user_id, name, email, role, zone_name, status
            FROM USERS
            WHERE LOWER(email) = LOWER(TRIM(p_email))
              AND password = p_password;
    END login_user;

    PROCEDURE approve_user(
        p_user_id IN NUMBER,
        p_status IN VARCHAR2
    ) AS
    BEGIN
        UPDATE USERS
        SET status = UPPER(p_status)
        WHERE user_id = p_user_id;

        INSERT INTO ADMIN_LOGS(action)
        VALUES('User ' || p_user_id || ' marked as ' || UPPER(p_status));
    END approve_user;
END PKG_USER;
/

CREATE OR REPLACE PACKAGE PKG_TRADING AS
    PROCEDURE add_listing(
        p_producer_id IN NUMBER,
        p_units IN NUMBER,
        p_price IN NUMBER,
        p_energy_type IN VARCHAR2,
        p_listing_id OUT NUMBER
    );

    PROCEDURE get_listings(
        p_result OUT SYS_REFCURSOR
    );

    PROCEDURE buy_energy(
        p_buyer_id IN NUMBER,
        p_listing_id IN NUMBER,
        p_units IN NUMBER,
        p_transaction_id OUT NUMBER
    );

    PROCEDURE add_meter_reading(
        p_user_id IN NUMBER,
        p_generated IN NUMBER,
        p_consumed IN NUMBER
    );
END PKG_TRADING;
/

CREATE OR REPLACE PACKAGE BODY PKG_TRADING AS
    PROCEDURE add_listing(
        p_producer_id IN NUMBER,
        p_units IN NUMBER,
        p_price IN NUMBER,
        p_energy_type IN VARCHAR2,
        p_listing_id OUT NUMBER
    ) AS
        v_role USERS.role%TYPE;
        v_status USERS.status%TYPE;
    BEGIN
        SELECT role, status
        INTO v_role, v_status
        FROM USERS
        WHERE user_id = p_producer_id;

        IF v_role <> 'PRODUCER' THEN
            RAISE_APPLICATION_ERROR(-20101, 'Only producers can add listings');
        END IF;

        IF v_status <> 'APPROVED' THEN
            RAISE_APPLICATION_ERROR(-20102, 'Producer is not approved');
        END IF;

        INSERT INTO ENERGY_LISTINGS(producer_id, units_available, price_per_unit, energy_type)
        VALUES(p_producer_id, p_units, p_price, UPPER(p_energy_type))
        RETURNING listing_id INTO p_listing_id;

        INSERT INTO ADMIN_LOGS(action)
        VALUES('Producer ' || p_producer_id || ' added a listing');
    END add_listing;

    PROCEDURE get_listings(
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT *
            FROM VW_AVAILABLE_LISTINGS
            ORDER BY price_per_unit;
    END get_listings;

    PROCEDURE buy_energy(
        p_buyer_id IN NUMBER,
        p_listing_id IN NUMBER,
        p_units IN NUMBER,
        p_transaction_id OUT NUMBER
    ) AS
        v_buyer_role USERS.role%TYPE;
        v_buyer_status USERS.status%TYPE;
        v_seller_id NUMBER;
        v_units NUMBER(8,2);
        v_price NUMBER(8,2);
        v_total NUMBER(10,2);
        v_balance NUMBER(10,2);
    BEGIN
        SELECT role, status
        INTO v_buyer_role, v_buyer_status
        FROM USERS
        WHERE user_id = p_buyer_id;

        IF v_buyer_role <> 'CONSUMER' THEN
            RAISE_APPLICATION_ERROR(-20103, 'Only consumers can buy energy');
        END IF;

        IF v_buyer_status <> 'APPROVED' THEN
            RAISE_APPLICATION_ERROR(-20104, 'Consumer is not approved');
        END IF;

        SELECT producer_id, units_available, price_per_unit
        INTO v_seller_id, v_units, v_price
        FROM ENERGY_LISTINGS
        WHERE listing_id = p_listing_id
          AND status = 'OPEN'
        FOR UPDATE;

        IF p_units > v_units THEN
            RAISE_APPLICATION_ERROR(-20105, 'Not enough units available');
        END IF;

        v_total := p_units * v_price;

        SELECT balance
        INTO v_balance
        FROM WALLETS
        WHERE user_id = p_buyer_id
        FOR UPDATE;

        IF v_balance < v_total THEN
            RAISE_APPLICATION_ERROR(-20106, 'Insufficient wallet balance');
        END IF;

        UPDATE WALLETS
        SET balance = balance - v_total
        WHERE user_id = p_buyer_id;

        UPDATE WALLETS
        SET balance = balance + v_total
        WHERE user_id = v_seller_id;

        UPDATE ENERGY_LISTINGS
        SET units_available = units_available - p_units,
            status = CASE WHEN units_available - p_units = 0 THEN 'SOLD' ELSE 'OPEN' END
        WHERE listing_id = p_listing_id;

        INSERT INTO ENERGY_TRANSACTIONS(buyer_id, seller_id, listing_id, units_bought, total_amount)
        VALUES(p_buyer_id, v_seller_id, p_listing_id, p_units, v_total)
        RETURNING transaction_id INTO p_transaction_id;

        INSERT INTO ADMIN_LOGS(action)
        VALUES('Energy bought. Transaction id: ' || p_transaction_id);
    END buy_energy;

    PROCEDURE add_meter_reading(
        p_user_id IN NUMBER,
        p_generated IN NUMBER,
        p_consumed IN NUMBER
    ) AS
    BEGIN
        INSERT INTO METER_READINGS(user_id, units_generated, units_consumed)
        VALUES(p_user_id, p_generated, p_consumed);
    END add_meter_reading;
END PKG_TRADING;
/

CREATE OR REPLACE PACKAGE PKG_REPORT AS
    PROCEDURE get_wallet(
        p_user_id IN NUMBER,
        p_result OUT SYS_REFCURSOR
    );

    PROCEDURE get_transactions(
        p_user_id IN NUMBER,
        p_result OUT SYS_REFCURSOR
    );

    PROCEDURE get_pending_users(
        p_result OUT SYS_REFCURSOR
    );

    PROCEDURE get_admin_logs(
        p_result OUT SYS_REFCURSOR
    );
END PKG_REPORT;
/

CREATE OR REPLACE PACKAGE BODY PKG_REPORT AS
    PROCEDURE get_wallet(
        p_user_id IN NUMBER,
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT w.wallet_id, w.user_id, u.name, w.balance
            FROM WALLETS w
            JOIN USERS u ON u.user_id = w.user_id
            WHERE w.user_id = p_user_id;
    END get_wallet;

    PROCEDURE get_transactions(
        p_user_id IN NUMBER,
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT
                t.transaction_id,
                t.buyer_id,
                buyer.name AS buyer_name,
                t.seller_id,
                seller.name AS seller_name,
                t.listing_id,
                t.units_bought,
                t.total_amount,
                t.transaction_date
            FROM ENERGY_TRANSACTIONS t
            JOIN USERS buyer ON buyer.user_id = t.buyer_id
            JOIN USERS seller ON seller.user_id = t.seller_id
            WHERE t.buyer_id = p_user_id
               OR t.seller_id = p_user_id
            ORDER BY t.transaction_date DESC;
    END get_transactions;

    PROCEDURE get_pending_users(
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT user_id, name, email, role, zone_name, status
            FROM USERS
            WHERE status = 'PENDING'
            ORDER BY created_at;
    END get_pending_users;

    PROCEDURE get_admin_logs(
        p_result OUT SYS_REFCURSOR
    ) AS
    BEGIN
        OPEN p_result FOR
            SELECT log_id, action, log_time
            FROM ADMIN_LOGS
            ORDER BY log_time DESC;
    END get_admin_logs;
END PKG_REPORT;
/
