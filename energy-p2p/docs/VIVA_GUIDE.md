# Viva Guide

## Short Explanation

This is an Energy P2P Trading System. A producer can list extra energy units, and a consumer can buy those units. The main backend logic is written in Oracle PL/SQL packages. Node.js is only used to connect the frontend with Oracle.

## Why PL/SQL?

PL/SQL is used because the important operations are database operations:

- checking user role
- checking wallet balance
- updating buyer and seller wallet
- reducing listing units
- inserting transaction record

Keeping this logic in PL/SQL makes the database responsible for data correctness.

## Tables To Explain

- `USERS`: stores producer, consumer and admin users
- `WALLETS`: stores wallet balance for each user
- `ENERGY_LISTINGS`: stores energy units listed by producers
- `ENERGY_TRANSACTIONS`: stores buying history
- `METER_READINGS`: stores generated and consumed units
- `ADMIN_LOGS`: stores system activity

## PL/SQL Packages To Explain

### PKG_USER

Handles user registration, login and approval.

### PKG_TRADING

Handles listing creation, listing display, buying energy and meter reading.

### PKG_REPORT

Fetches wallet, transaction, pending user and log data for the dashboard.

## Demo Flow

1. Login as producer: `producer@energy.com`, password `1234`.
2. Add an energy listing.
3. Login as consumer: `consumer@energy.com`, password `1234`.
4. Open marketplace and buy energy.
5. Check wallet and transaction table on dashboard.
6. Login as admin: `admin@energy.com`, password `1234`.
7. Show pending users and admin logs.

## Explain The Buy Energy Procedure

Say:

"The consumer buys energy by calling `PKG_TRADING.buy_energy`. First it checks whether the user is a consumer and approved. Then it checks listing units and wallet balance. After that it debits the buyer wallet, credits the seller wallet, reduces listing units and inserts a transaction."

## Possible Questions

### Why is Node.js used?

Browser JavaScript cannot directly call Oracle PL/SQL. So Node.js works as the middle layer and exposes REST APIs.

### Which trigger did you use?

`TRG_CREATE_WALLET` creates a wallet automatically after a user is inserted. `TRG_METER_EXCESS` calculates excess units for meter readings.

### Which view did you use?

`VW_AVAILABLE_LISTINGS` joins listings with users and only shows open listings from approved producers.

### How do you avoid negative wallet balance?

There is a check constraint on wallet balance, and the `buy_energy` procedure checks balance before purchase.
