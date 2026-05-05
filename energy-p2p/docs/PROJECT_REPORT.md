# Energy P2P Trading System - Project Report

## 1. Introduction

The Energy P2P Trading System is a simple DBMS project where a renewable energy producer can sell extra electricity units to a consumer. For example, a house with solar panels can list extra generated units, and another user can buy those units through a wallet.

This project mainly focuses on Oracle database and PL/SQL. The frontend is only used to make the system easy to demonstrate.

## 2. Objective

The objectives of the project are:

- register producer and consumer users
- approve users through admin
- allow producers to add energy listings
- allow consumers to buy available energy
- update buyer and seller wallets
- store transaction history
- store smart meter readings
- keep admin logs

## 3. Technologies Used

- HTML, CSS, JavaScript for frontend
- Node.js and Express for API routes
- Oracle SQL for tables, constraints and views
- Oracle PL/SQL for backend procedures and packages

## 4. System Modules

### User Module

Users can register as producer or consumer. New users are stored with `PENDING` status. Admin can approve or reject users.

### Producer Module

An approved producer can add an energy listing with units, price per unit and energy type.

### Consumer Module

An approved consumer can view available listings in the marketplace and buy energy units.

### Wallet Module

Every user has a wallet. When a purchase happens, the buyer wallet is debited and the seller wallet is credited.

### Admin Module

Admin can approve pending users and view basic system logs.

## 5. Database Tables

The database contains these main tables:

- `USERS`
- `WALLETS`
- `ENERGY_LISTINGS`
- `ENERGY_TRANSACTIONS`
- `METER_READINGS`
- `ADMIN_LOGS`

## 6. PL/SQL Packages

### PKG_USER

This package contains:

- `register_user`
- `login_user`
- `approve_user`

It handles user registration, login and admin approval.

### PKG_TRADING

This package contains:

- `add_listing`
- `get_listings`
- `buy_energy`
- `add_meter_reading`

The most important procedure is `buy_energy`. It checks whether the buyer is a consumer, checks available units, checks wallet balance, updates wallets, updates listing units and inserts a transaction.

### PKG_REPORT

This package contains:

- `get_wallet`
- `get_transactions`
- `get_pending_users`
- `get_admin_logs`

It is used to display data on the dashboard.

## 7. Important DBMS Concepts

### Constraints

Check constraints are used for user role, user status, listing status, wallet balance and transaction values.

### Foreign Keys

Foreign keys connect wallets, listings and transactions with users.

### Views

`VW_AVAILABLE_LISTINGS` displays only open listings from approved producers.

`VW_TRANSACTION_DETAILS` displays transaction data with buyer and seller names.

### Triggers

`TRG_CREATE_WALLET` automatically creates a wallet when a new user is inserted.

`TRG_METER_EXCESS` calculates excess units before inserting a meter reading.

## 8. Purchase Flow

1. Consumer selects a listing.
2. PL/SQL checks the user role and status.
3. PL/SQL checks available units.
4. PL/SQL checks wallet balance.
5. Buyer wallet is debited.
6. Seller wallet is credited.
7. Listing units are reduced.
8. Transaction is inserted.
9. Admin log is inserted.

## 9. Conclusion

This project demonstrates a basic peer-to-peer energy trading system using Oracle PL/SQL. It is simple enough to explain clearly, but it still includes important DBMS concepts such as constraints, joins, views, triggers and packages.
