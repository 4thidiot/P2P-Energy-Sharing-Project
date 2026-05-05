(function () {
  const user = App.requireLogin();
  if (!user) return;

  document.getElementById("logoutBtn").addEventListener("click", App.logout);
  document.getElementById("marketUser").textContent = `${user.name} | ${user.role}`;

  let allListings = [];

  function renderListings() {
    const search = document.getElementById("searchBox").value.toLowerCase();
    const rows = allListings.filter((item) => {
      return [item.producer_name, item.zone_name, item.energy_type]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    document.getElementById("listingRows").innerHTML = rows.length
      ? rows.map((item) => `
          <tr>
            <td>${item.listing_id}</td>
            <td>${item.producer_name}</td>
            <td>${item.zone_name}</td>
            <td>${item.units_available}</td>
            <td>${App.money(item.price_per_unit)}</td>
            <td>${item.energy_type}</td>
            <td>${App.status(item.status)}</td>
          </tr>
        `).join("")
      : '<tr><td colspan="7">No listings available.</td></tr>';
  }

  async function loadListings() {
    const data = await App.request("/listings");
    allListings = data.listings;
    renderListings();
  }

  document.getElementById("searchBox").addEventListener("input", renderListings);
  document.getElementById("refreshBtn").addEventListener("click", loadListings);

  document.getElementById("buyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("buyMessage");
    message.textContent = "Buying energy...";
    message.className = "message";

    try {
      const data = await App.request("/buy-energy", {
        method: "POST",
        body: {
          buyer_id: user.user_id,
          listing_id: Number(document.getElementById("buyListingId").value),
          units: Number(document.getElementById("buyUnits").value)
        }
      });
      message.textContent = data.message;
      message.className = "message success";
      loadListings();
    } catch (error) {
      message.textContent = error.message;
      message.className = "message error";
    }
  });

  loadListings();
})();
