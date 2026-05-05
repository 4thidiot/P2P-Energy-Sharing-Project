function today() {
  return new Date().toISOString();
}

export function createDemoGateway() {
  const users = [
    { user_id: 1, name: "Ravi Solar House", email: "producer@energy.com", password: "1234", role: "PRODUCER", zone_name: "North Zone", status: "APPROVED" },
    { user_id: 2, name: "Anita Consumer", email: "consumer@energy.com", password: "1234", role: "CONSUMER", zone_name: "North Zone", status: "APPROVED" },
    { user_id: 3, name: "Admin User", email: "admin@energy.com", password: "1234", role: "ADMIN", zone_name: "Main Grid", status: "APPROVED" }
  ];
  const wallets = [
    { wallet_id: 1, user_id: 1, balance: 500 },
    { wallet_id: 2, user_id: 2, balance: 1000 },
    { wallet_id: 3, user_id: 3, balance: 0 }
  ];
  const listings = [
    { listing_id: 1, producer_id: 1, units_available: 50, price_per_unit: 6.5, energy_type: "SOLAR", status: "OPEN", created_at: today() }
  ];
  const transactions = [];
  const logs = [{ log_id: 1, action: "Sample data inserted", log_time: today() }];
  let nextUser = 4;
  let nextListing = 2;
  let nextTransaction = 1;
  let nextLog = 2;

  function addLog(action) {
    logs.unshift({ log_id: nextLog++, action, log_time: today() });
  }

  function listingRow(listing) {
    const producer = users.find((user) => user.user_id === listing.producer_id);
    return {
      ...listing,
      producer_name: producer?.name,
      zone_name: producer?.zone_name
    };
  }

  return {
    async registerUser(data) {
      if (users.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error("Email already exists");
      }
      const user = {
        user_id: nextUser++,
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        role: String(data.role).toUpperCase(),
        zone_name: data.zone_name || "Local Grid",
        status: "PENDING"
      };
      users.push(user);
      wallets.push({ wallet_id: wallets.length + 1, user_id: user.user_id, balance: 1000 });
      addLog(`New user registered: ${user.name}`);
      return user.user_id;
    },

    async loginUser(email, password) {
      const user = users.find((item) => item.email.toLowerCase() === String(email).toLowerCase() && item.password === password);
      return user ? { ...user, password: undefined } : null;
    },

    async listListings() {
      return listings.filter((item) => item.status === "OPEN" && item.units_available > 0).map(listingRow);
    },

    async sellEnergy(data) {
      const producer = users.find((user) => user.user_id === Number(data.producer_id));
      if (!producer || producer.role !== "PRODUCER") throw new Error("Only producers can add listings");
      if (producer.status !== "APPROVED") throw new Error("Producer is not approved");

      const listing = {
        listing_id: nextListing++,
        producer_id: producer.user_id,
        units_available: Number(data.units),
        price_per_unit: Number(data.price_per_unit || data.price),
        energy_type: String(data.energy_type || "SOLAR").toUpperCase(),
        status: "OPEN",
        created_at: today()
      };
      listings.push(listing);
      addLog(`Producer ${producer.user_id} added a listing`);
      return listing.listing_id;
    },

    async buyEnergy(data) {
      const buyer = users.find((user) => user.user_id === Number(data.buyer_id));
      const listing = listings.find((item) => item.listing_id === Number(data.listing_id));
      if (!buyer || buyer.role !== "CONSUMER") throw new Error("Only consumers can buy energy");
      if (!listing || listing.status !== "OPEN") throw new Error("Listing is not available");
      if (Number(data.units) > listing.units_available) throw new Error("Not enough units available");

      const total = Number(data.units) * listing.price_per_unit;
      const buyerWallet = wallets.find((wallet) => wallet.user_id === buyer.user_id);
      const sellerWallet = wallets.find((wallet) => wallet.user_id === listing.producer_id);
      if (buyerWallet.balance < total) throw new Error("Insufficient wallet balance");

      buyerWallet.balance -= total;
      sellerWallet.balance += total;
      listing.units_available -= Number(data.units);
      if (listing.units_available === 0) listing.status = "SOLD";

      const seller = users.find((user) => user.user_id === listing.producer_id);
      const transaction = {
        transaction_id: nextTransaction++,
        buyer_id: buyer.user_id,
        buyer_name: buyer.name,
        seller_id: seller.user_id,
        seller_name: seller.name,
        listing_id: listing.listing_id,
        units_bought: Number(data.units),
        total_amount: total,
        transaction_date: today()
      };
      transactions.unshift(transaction);
      addLog(`Energy bought. Transaction id: ${transaction.transaction_id}`);
      return transaction.transaction_id;
    },

    async addMeterReading(data) {
      addLog(`Meter reading saved for user ${data.user_id}`);
    },

    async wallet(userId) {
      const wallet = wallets.find((item) => item.user_id === userId);
      const user = users.find((item) => item.user_id === userId);
      return wallet ? { ...wallet, name: user?.name } : null;
    },

    async transactions(userId) {
      return transactions.filter((item) => item.buyer_id === userId || item.seller_id === userId);
    },

    async pendingUsers() {
      return users.filter((item) => item.status === "PENDING").map((item) => ({ ...item, password: undefined }));
    },

    async approveUser(data) {
      const user = users.find((item) => item.user_id === Number(data.user_id));
      if (!user) throw new Error("User not found");
      user.status = String(data.status || "APPROVED").toUpperCase();
      addLog(`User ${user.user_id} marked as ${user.status}`);
    },

    async adminLogs() {
      return logs;
    }
  };
}
