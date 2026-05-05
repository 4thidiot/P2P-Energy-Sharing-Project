# Energy P2P Trading System

This is a simple second-year DBMS project. It shows how local renewable energy can be sold from a producer to a consumer using an Oracle database and PL/SQL backend logic.

The project is intentionally kept small and explainable:

- Frontend: HTML, CSS and JavaScript
- API layer: Node.js and Express
- Main backend logic: Oracle PL/SQL packages
- Database: Oracle tables, constraints, views and triggers

## Main Idea

A producer adds extra energy units for sale. A consumer buys units from the marketplace. During purchase, PL/SQL updates:

- available listing units
- buyer wallet balance
- seller wallet balance
- transaction table
- admin log

## Folder Structure

```text
energy-p2p/
  database/
    tables.sql
    procedures.sql
    seed.sql
    run_all.sql
    demo_queries.sql
  backend/
    src/server.js
    src/oracleGateway.js
    src/demoGateway.js
  frontend/
    index.html
    dashboard.html
    marketplace.html
    css/styles.css
    js/
  docs/
    PROJECT_REPORT.md
    VIVA_GUIDE.md
```

## Demo Login

Password for all demo users is `1234`.

| Role | Email |
| --- | --- |
| Producer | `producer@energy.com` |
| Consumer | `consumer@energy.com` |
| Admin | `admin@energy.com` |

## Run Frontend Only

The frontend has demo data fallback, so it works even if Node or Oracle is not running.

```bash
cd frontend
python3 -m http.server 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Run Node Backend In Demo Mode

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs at:

```text
http://127.0.0.1:4000
```

## Run With Oracle

First load the Oracle database scripts:

```sql
@database/run_all.sql
```

Then edit `backend/.env`:

```env
USE_MOCK_DB=false
ORACLE_USER=your_username
ORACLE_PASSWORD=your_password
ORACLE_CONNECT_STRING=localhost/FREEPDB1
```

Start backend:

```bash
cd backend
npm start
```

## PL/SQL Packages

- `PKG_USER`: register, login, approve user
- `PKG_TRADING`: add listing, show listings, buy energy, add meter reading
- `PKG_REPORT`: wallet, transactions, pending users, admin logs

## Main DBMS Concepts Used

- Primary key and foreign key
- Check constraint
- Unique constraint
- Index
- View
- Trigger
- PL/SQL package
- Transaction update logic
- Joins
