(function () {
  const API = "http://127.0.0.1:4000";
  const USER_KEY = "energy_simple_user";
  const STATE_KEY = "energy_simple_state";

  function now() {
    return new Date().toISOString();
  }

  function starterState() {
    return {
      users: [
        { user_id: 1, name: "Ravi Solar House", email: "producer@energy.com", password: "1234", role: "PRODUCER", zone_name: "North Zone", status: "APPROVED" },
        { user_id: 2, name: "Anita Consumer", email: "consumer@energy.com", password: "1234", role: "CONSUMER", zone_name: "North Zone", status: "APPROVED" },
        { user_id: 3, name: "Admin User", email: "admin@energy.com", password: "1234", role: "ADMIN", zone_name: "Main Grid", status: "APPROVED" }
      ],
      wallets: [
        { wallet_id: 1, user_id: 1, balance: 500 },
        { wallet_id: 2, user_id: 2, balance: 1000 },
        { wallet_id: 3, user_id: 3, balance: 0 }
      ],
      listings: [
        { listing_id: 1, producer_id: 1, units_available: 50, price_per_unit: 6.5, energy_type: "SOLAR", status: "OPEN", created_at: now() }
      ],
      transactions: [],
      logs: [{ log_id: 1, action: "Sample data inserted", log_time: now() }],
      next: { user: 4, listing: 2, transaction: 1, log: 2 }
    };
  }

  function getState() {
    const old = localStorage.getItem(STATE_KEY);
    if (old) return JSON.parse(old);
    const fresh = starterState();
    localStorage.setItem(STATE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function addLog(state, action) {
    state.logs.unshift({ log_id: state.next.log++, action, log_time: now() });
  }

  function currentUser() {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    window.location.href = "index.html";
  }

  function requireLogin() {
    const user = currentUser();
    if (!user) {
      window.location.href = "index.html";
      return null;
    }
    return user;
  }

  function publicUser(user) {
    const copy = { ...user };
    delete copy.password;
    return copy;
  }

  function addProducerName(state, listing) {
    const producer = state.users.find((user) => user.user_id === listing.producer_id);
    return {
      ...listing,
      producer_name: producer ? producer.name : "-",
      zone_name: producer ? producer.zone_name : "-"
    };
  }

  async function request(path, options = {}) {
    try {
      const response = await fetch(`${API}${path}`, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Request failed");
      return data;
    } catch (_error) {
      return demoRequest(path, options);
    }
  }

  function demoRequest(path, options = {}) {
    const state = getState();
    const body = options.body || {};
    let result;

    if (path === "/login") {
      const user = state.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase() && item.password === body.password);
      if (!user) throw new Error("Invalid login details.");
      result = { success: true, user: publicUser(user) };
    } else if (path === "/register") {
      if (state.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
        throw new Error("Email already exists");
      }
      const user = {
        user_id: state.next.user++,
        name: body.name,
        email: body.email.toLowerCase(),
        password: body.password,
        role: body.role,
        zone_name: body.zone_name || "Local Grid",
        status: "PENDING"
      };
      state.users.push(user);
      state.wallets.push({ wallet_id: state.wallets.length + 1, user_id: user.user_id, balance: 1000 });
      addLog(state, `New user registered: ${user.name}`);
      result = { success: true, message: "Registration done. Admin approval is needed before trading.", user_id: user.user_id };
    } else if (path === "/listings") {
      result = {
        success: true,
        listings: state.listings
          .filter((item) => item.status === "OPEN" && item.units_available > 0)
          .map((item) => addProducerName(state, item))
      };
    } else if (path === "/sell-energy") {
      const producer = state.users.find((user) => user.user_id === Number(body.producer_id));
      if (!producer || producer.role !== "PRODUCER") throw new Error("Only producers can add listings");
      if (producer.status !== "APPROVED") throw new Error("Producer is not approved");
      const listing = {
        listing_id: state.next.listing++,
        producer_id: producer.user_id,
        units_available: Number(body.units),
        price_per_unit: Number(body.price_per_unit),
        energy_type: body.energy_type,
        status: "OPEN",
        created_at: now()
      };
      state.listings.push(listing);
      addLog(state, `Producer ${producer.user_id} added a listing`);
      result = { success: true, message: "Listing added.", listing_id: listing.listing_id };
    } else if (path === "/buy-energy") {
      const buyer = state.users.find((user) => user.user_id === Number(body.buyer_id));
      const listing = state.listings.find((item) => item.listing_id === Number(body.listing_id));
      if (!buyer || buyer.role !== "CONSUMER") throw new Error("Only consumers can buy energy");
      if (!listing || listing.status !== "OPEN") throw new Error("Listing is not available");
      if (Number(body.units) > listing.units_available) throw new Error("Not enough units available");

      const total = Number(body.units) * listing.price_per_unit;
      const buyerWallet = state.wallets.find((wallet) => wallet.user_id === buyer.user_id);
      const sellerWallet = state.wallets.find((wallet) => wallet.user_id === listing.producer_id);
      if (buyerWallet.balance < total) throw new Error("Insufficient wallet balance");

      buyerWallet.balance -= total;
      sellerWallet.balance += total;
      listing.units_available -= Number(body.units);
      if (listing.units_available === 0) listing.status = "SOLD";

      const seller = state.users.find((user) => user.user_id === listing.producer_id);
      const transaction = {
        transaction_id: state.next.transaction++,
        buyer_id: buyer.user_id,
        buyer_name: buyer.name,
        seller_id: seller.user_id,
        seller_name: seller.name,
        listing_id: listing.listing_id,
        units_bought: Number(body.units),
        total_amount: total,
        transaction_date: now()
      };
      state.transactions.unshift(transaction);
      addLog(state, `Energy bought. Transaction id: ${transaction.transaction_id}`);
      result = { success: true, message: "Energy purchased.", transaction_id: transaction.transaction_id };
    } else if (path === "/meter-reading") {
      addLog(state, `Meter reading saved for user ${body.user_id}`);
      result = { success: true, message: "Meter reading saved." };
    } else if (path.startsWith("/wallet/")) {
      const userId = Number(path.split("/").pop());
      const wallet = state.wallets.find((item) => item.user_id === userId);
      const user = state.users.find((item) => item.user_id === userId);
      result = { success: true, wallet: { ...wallet, name: user ? user.name : "-" } };
    } else if (path.startsWith("/transactions/")) {
      const userId = Number(path.split("/").pop());
      result = {
        success: true,
        transactions: state.transactions.filter((item) => item.buyer_id === userId || item.seller_id === userId)
      };
    } else if (path === "/admin/pending-users") {
      result = { success: true, users: state.users.filter((item) => item.status === "PENDING").map(publicUser) };
    } else if (path === "/admin/approve-user") {
      const user = state.users.find((item) => item.user_id === Number(body.user_id));
      if (!user) throw new Error("User not found");
      user.status = body.status;
      addLog(state, `User ${user.user_id} marked as ${body.status}`);
      result = { success: true, message: "User status updated." };
    } else if (path === "/admin/logs") {
      result = { success: true, logs: state.logs };
    } else {
      throw new Error(`Route missing: ${path}`);
    }

    saveState(state);
    return result;
  }

  function money(value) {
    return `Rs. ${Number(value || 0).toFixed(2)}`;
  }

  function date(value) {
    return value ? new Date(value).toLocaleString() : "-";
  }

  function status(value) {
    return `<span class="status ${String(value || "").toLowerCase()}">${value}</span>`;
  }

  window.App = {
    currentUser,
    setUser,
    logout,
    requireLogin,
    request,
    money,
    date,
    status
  };
})();
