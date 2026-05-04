(function () {
  const user = App.requireLogin();
  if (!user) return;

  document.getElementById("logoutBtn").addEventListener("click", App.logout);
  document.getElementById("userLine").textContent = `${user.role} · ${user.zone_name}`;
  document.getElementById("userLine").textContent = `${user.name} | ${user.role} | ${user.zone_name}`;

  const producerBox = document.getElementById("producerBox");
  const consumerBox = document.getElementById("consumerBox");
  const adminBox = document.getElementById("adminBox");

  if (user.role === "PRODUCER") producerBox.classList.remove("hide");
  if (user.role === "CONSUMER") consumerBox.classList.remove("hide");
  if (user.role === "ADMIN") adminBox.classList.remove("hide");

  async function loadSummary() {
    const [walletData, listingData, transactionData] = await Promise.all([
      App.request(`/wallet/${user.user_id}`),
      App.request("/listings"),
      App.request(`/transactions/${user.user_id}`)
    ]);

    document.getElementById("summaryName").textContent = user.name;
    document.getElementById("summaryRole").textContent = user.role;
    document.getElementById("summaryWallet").textContent = App.money(walletData.wallet?.balance);

    const myListings = listingData.listings.filter((item) => Number(item.producer_id) === Number(user.user_id));
    document.getElementById("myListings").innerHTML = myListings.length
      ? myListings.map((item) => `
          <tr>
            <td>${item.listing_id}</td>
            <td>${item.units_available}</td>
            <td>${App.money(item.price_per_unit)}</td>
            <td>${item.energy_type}</td>
            <td>${App.status(item.status)}</td>
          </tr>
        `).join("")
      : '<tr class="empty-row"><td colspan="5">No listings yet.</td></tr>';

    document.getElementById("transactions").innerHTML = transactionData.transactions.length
      ? transactionData.transactions.map((item) => `
          <tr>
            <td>${item.transaction_id}</td>
            <td>${item.buyer_name}</td>
            <td>${item.seller_name}</td>
            <td>${item.units_bought}</td>
            <td>${App.money(item.total_amount)}</td>
          </tr>
        `).join("")
      : '<tr class="empty-row"><td colspan="5">No transactions yet.</td></tr>';
  }

  async function loadAdmin() {
    if (user.role !== "ADMIN") return;
    const [pendingData, logData] = await Promise.all([
      App.request("/admin/pending-users"),
      App.request("/admin/logs")
    ]);

    document.getElementById("pendingUsers").innerHTML = pendingData.users.length
      ? pendingData.users.map((item) => `
          <tr>
            <td>${item.user_id}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.role}</td>
            <td>${App.status(item.status)}</td>
            <td>
              <button class="approve" data-approve="${item.user_id}" type="button">Approve</button>
              <button class="danger" data-reject="${item.user_id}" type="button">Reject</button>
            </td>
          </tr>
        `).join("")
      : '<tr class="empty-row"><td colspan="6">No pending users.</td></tr>';

    document.querySelectorAll("[data-approve]").forEach((button) => {
      button.addEventListener("click", () => updateUser(button.dataset.approve, "APPROVED"));
    });
    document.querySelectorAll("[data-reject]").forEach((button) => {
      button.addEventListener("click", () => updateUser(button.dataset.reject, "REJECTED"));
    });

    document.getElementById("adminLogs").innerHTML = logData.logs.length
      ? logData.logs.map((item) => `
          <tr>
            <td>${item.log_id}</td>
            <td>${item.action}</td>
            <td>${App.date(item.log_time)}</td>
          </tr>
        `).join("")
      : '<tr class="empty-row"><td colspan="3">No logs yet.</td></tr>';
  }

  async function updateUser(userId, status) {
    await App.request("/admin/approve-user", {
      method: "POST",
      body: { user_id: Number(userId), status }
    });
    loadAdmin();
  }

  document.getElementById("listingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("listingMessage");
    message.textContent = "Adding listing...";
    message.className = "message";

    try {
      const data = await App.request("/sell-energy", {
        method: "POST",
        body: {
          producer_id: user.user_id,
          units: document.getElementById("listingUnits").value,
          price_per_unit: document.getElementById("listingPrice").value,
          energy_type: document.getElementById("energyType").value
        }
      });
      message.textContent = data.message;
      message.className = "message success";
      loadSummary();
    } catch (error) {
      message.textContent = error.message;
      message.className = "message error";
    }
  });

  document.getElementById("meterForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("meterMessage");

    try {
      const data = await App.request("/meter-reading", {
        method: "POST",
        body: {
          user_id: user.user_id,
          units_generated: document.getElementById("generatedUnits").value,
          units_consumed: document.getElementById("consumedUnits").value
        }
      });
      message.textContent = data.message;
      message.className = "message success";
    } catch (error) {
      message.textContent = error.message;
      message.className = "message error";
    }
  });

  loadSummary();
  loadAdmin();
})();
