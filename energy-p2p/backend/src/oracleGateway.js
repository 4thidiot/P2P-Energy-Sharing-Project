let oracleModule;

async function loadOracle() {
  if (!oracleModule) {
    const imported = await import("oracledb");
    oracleModule = imported.default || imported;
    oracleModule.outFormat = oracleModule.OUT_FORMAT_OBJECT;
  }
  return oracleModule;
}

function lowerKeys(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key.toLowerCase(), value]));
}

async function cursorRows(cursor) {
  const rows = [];
  let row;
  while ((row = await cursor.getRow())) rows.push(lowerKeys(row));
  await cursor.close();
  return rows;
}

export async function createOracleGateway() {
  const oracledb = await loadOracle();
  const pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING
  });

  async function useConnection(work) {
    const connection = await pool.getConnection();
    try {
      return await work(connection, oracledb);
    } finally {
      await connection.close();
    }
  }

  return {
    registerUser(data) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_USER.register_user(:name, :email, :password, :role, :zone_name, :user_id); END;`,
          {
            name: data.name,
            email: data.email,
            password: data.password,
            role: data.role,
            zone_name: data.zone_name || "Local Grid",
            user_id: { dir: db.BIND_OUT, type: db.NUMBER }
          },
          { autoCommit: true }
        );
        return result.outBinds.user_id;
      });
    },

    loginUser(email, password) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_USER.login_user(:email, :password, :result); END;`,
          {
            email,
            password,
            result: { dir: db.BIND_OUT, type: db.CURSOR }
          }
        );
        const rows = await cursorRows(result.outBinds.result);
        return rows[0] || null;
      });
    },

    listListings() {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_TRADING.get_listings(:result); END;`,
          { result: { dir: db.BIND_OUT, type: db.CURSOR } }
        );
        return cursorRows(result.outBinds.result);
      });
    },

    sellEnergy(data) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_TRADING.add_listing(:producer_id, :units, :price, :energy_type, :listing_id); END;`,
          {
            producer_id: Number(data.producer_id),
            units: Number(data.units),
            price: Number(data.price_per_unit || data.price),
            energy_type: data.energy_type || "SOLAR",
            listing_id: { dir: db.BIND_OUT, type: db.NUMBER }
          },
          { autoCommit: true }
        );
        return result.outBinds.listing_id;
      });
    },

    buyEnergy(data) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_TRADING.buy_energy(:buyer_id, :listing_id, :units, :transaction_id); END;`,
          {
            buyer_id: Number(data.buyer_id),
            listing_id: Number(data.listing_id),
            units: Number(data.units),
            transaction_id: { dir: db.BIND_OUT, type: db.NUMBER }
          },
          { autoCommit: true }
        );
        return result.outBinds.transaction_id;
      });
    },

    addMeterReading(data) {
      return useConnection((connection) => connection.execute(
        `BEGIN PKG_TRADING.add_meter_reading(:user_id, :generated, :consumed); END;`,
        {
          user_id: Number(data.user_id),
          generated: Number(data.units_generated),
          consumed: Number(data.units_consumed)
        },
        { autoCommit: true }
      ));
    },

    wallet(userId) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_REPORT.get_wallet(:user_id, :result); END;`,
          {
            user_id: userId,
            result: { dir: db.BIND_OUT, type: db.CURSOR }
          }
        );
        const rows = await cursorRows(result.outBinds.result);
        return rows[0] || null;
      });
    },

    transactions(userId) {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_REPORT.get_transactions(:user_id, :result); END;`,
          {
            user_id: userId,
            result: { dir: db.BIND_OUT, type: db.CURSOR }
          }
        );
        return cursorRows(result.outBinds.result);
      });
    },

    pendingUsers() {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_REPORT.get_pending_users(:result); END;`,
          { result: { dir: db.BIND_OUT, type: db.CURSOR } }
        );
        return cursorRows(result.outBinds.result);
      });
    },

    approveUser(data) {
      return useConnection((connection) => connection.execute(
        `BEGIN PKG_USER.approve_user(:user_id, :status); END;`,
        { user_id: Number(data.user_id), status: data.status || "APPROVED" },
        { autoCommit: true }
      ));
    },

    adminLogs() {
      return useConnection(async (connection, db) => {
        const result = await connection.execute(
          `BEGIN PKG_REPORT.get_admin_logs(:result); END;`,
          { result: { dir: db.BIND_OUT, type: db.CURSOR } }
        );
        return cursorRows(result.outBinds.result);
      });
    }
  };
}
