# Energy P2P Backend

This backend is a small Node/Express API gateway. The main trading rules are kept in Oracle PL/SQL packages under `../database/procedures.sql`.

## Run In Demo Mode

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

`USE_MOCK_DB=true` runs the same REST APIs using an in-memory data store. This is useful for UI demos.

## Run With Oracle PL/SQL

1. Create an Oracle user/schema.
2. Run `database/run_all.sql` from SQL*Plus or SQLcl.
3. Set `USE_MOCK_DB=false` in `.env`.
4. Fill `ORACLE_USER`, `ORACLE_PASSWORD`, and `ORACLE_CONNECT_STRING`.
5. Start the backend with `npm start`.

## Demo Logins

All demo accounts use password `1234`.

- `producer@energy.com`
- `consumer@energy.com`
- `admin@energy.com`
