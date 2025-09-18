// app.js - full logic (GET, POST, PUT, DELETE + limit UI + modal)
const API_URL = "http://localhost:8080/api/expenses"; // backend endpoint
let allExpenses = [];

// monthly limit (persisted in localStorage)
let monthlyLimit = Number(localStorage.getItem("monthlyLimit")) || 20000;

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const limitInput = document.getElementById("limitInput");
  const currentLimitEl = document.getElementById("currentLimit");
  const setLimitBtn = document.getElementById("setLimitBtn");
  const filterSelect = document.getElementById("filterCategory");
  const sortSelect = document.getElementById("sortExpenses");

  // sync UI with saved limit
  limitInput.value = monthlyLimit;
  currentLimitEl.textContent = `Current Monthly Limit: ₹${monthlyLimit.toFixed(0)}`;

  // event handlers
  setLimitBtn.addEventListener("click", () => {
    const val = Number(limitInput.value);
    if (!isNaN(val) && val > 0) {
      monthlyLimit = val;
      localStorage.setItem("monthlyLimit", monthlyLimit);
      currentLimitEl.textContent = `Current Monthly Limit: ₹${monthlyLimit.toFixed(0)}`;
      checkLimit();
      alert(`Monthly limit set to ₹${monthlyLimit.toFixed(0)}`);
    } else {
      alert("Please enter a valid monthly limit (greater than 0).");
    }
  });

  filterSelect.addEventListener("change", applyFilters);
  sortSelect.addEventListener("change", applyFilters);

  document.getElementById("expenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await addExpenseHandler();
  });

  document.getElementById("updateForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await updateExpenseHandler();
  });

  // modal close hooks
  document.getElementById("modalOverlay").addEventListener("click", closeModal);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("cancelUpdate").addEventListener("click", closeModal);

  // initial load
  getExpenses();
});

// ------- Fetch expenses -------
async function getExpenses() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const data = await res.json();
    allExpenses = Array.isArray(data) ? data : [];
    renderExpenses(allExpenses);
    checkLimit();
  } catch (err) {
    console.error("Error fetching expenses:", err);
    // keep UI usable even if backend is down
    allExpenses = [];
    renderExpenses([]);
    document.getElementById("limitMessage").textContent = "Error fetching expenses from backend.";
  }
}

// ------- Render table (for any array) -------
function renderExpenses(data) {
  const table = document.getElementById("expenseTable");
  table.innerHTML = "";

  let total = 0;
  data.forEach((exp, idx) => {
    const amt = Number(exp.amount) || 0;
    total += amt;

    const tr = document.createElement("tr");
    const title = escapeHtml(exp.title || "");
    const cat = escapeHtml(exp.category || "");
    const date = exp.date || "";

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${title}</td>
      <td>₹${amt.toFixed(2)}</td>
      <td>${cat}</td>
      <td>${date}</td>
      <td>
        <button class="btn update" onclick="openModal(${exp.id})">Update</button>
        <button class="btn delete" onclick="deleteExpense(${exp.id})">Delete</button>
      </td>
    `;
    table.appendChild(tr);
  });

  document.getElementById("totalExpenses").textContent = `Total: ₹${total.toFixed(2)}`;
}

// ------- Add expense -------
async function addExpenseHandler() {
  const title = document.getElementById("title").value.trim();
  const amountRaw = document.getElementById("amount").value;
  const amount = Number(amountRaw);
  const category = document.getElementById("category").value.trim();
  const date = document.getElementById("date").value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    alert("Please fill valid Title, Amount (>0), Category and Date.");
    return;
  }

  const newExpense = { title, amount, category, date };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newExpense)
    });

    // backend returns text message (per your controller). show it.
    const msg = await res.text();
    alert(msg || "Expense added.");
    // refresh UI
    await getExpenses();
    document.getElementById("expenseForm").reset();
  } catch (err) {
    console.error("Error adding expense:", err);
    alert("Error adding expense. Check console.");
  }
}

// ------- Delete expense -------
async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    await getExpenses();
  } catch (err) {
    console.error("Error deleting:", err);
    alert("Failed to delete. See console.");
  }
}

// ------- Modal open/close & update -------
function openModal(id) {
  const exp = allExpenses.find(e => String(e.id) === String(id));
  if (!exp) return;
  document.getElementById("updateId").value = exp.id;
  document.getElementById("updateTitle").value = exp.title || "";
  document.getElementById("updateAmount").value = exp.amount || "";
  document.getElementById("updateCategory").value = exp.category || "";
  document.getElementById("updateDate").value = exp.date || "";

  const modal = document.getElementById("updateModal");
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("updateModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

async function updateExpenseHandler() {
  const id = document.getElementById("updateId").value;
  const title = document.getElementById("updateTitle").value.trim();
  const amount = Number(document.getElementById("updateAmount").value);
  const category = document.getElementById("updateCategory").value.trim();
  const date = document.getElementById("updateDate").value;

  if (!id || !title || isNaN(amount) || amount <= 0 || !category || !date) {
    alert("Please fill valid fields to update.");
    return;
  }

  const updated = { title, amount, category, date };

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    if (!res.ok) throw new Error("Update failed");
    closeModal();
    await getExpenses();
  } catch (err) {
    console.error("Error updating expense:", err);
    alert("Failed to update. See console.");
  }
}

// ------- Filters & Sort -------
function applyFilters() {
  let filtered = [...allExpenses];
  const cat = document.getElementById("filterCategory").value;
  if (cat !== "all") filtered = filtered.filter(e => e.category === cat);

  const sortVal = document.getElementById("sortExpenses").value;
  if (sortVal === "date-desc") filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  else if (sortVal === "date-asc") filtered.sort((a,b) => new Date(a.date) - new Date(b.date));
  else if (sortVal === "amount-desc") filtered.sort((a,b) => Number(b.amount) - Number(a.amount));
  else if (sortVal === "amount-asc") filtered.sort((a,b) => Number(a.amount) - Number(b.amount));

  renderExpenses(filtered);
}

// ------- Limit logic -------
function checkLimit() {
  const totalAll = allExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const el = document.getElementById("limitMessage");

  if (totalAll > monthlyLimit) {
    el.style.background = "#fff7f7";
    el.style.color = "#b71c1c";
    el.textContent = `⚠️ Limit exceeded — Limit: ₹${monthlyLimit.toFixed(0)} | Spent: ₹${totalAll.toFixed(2)}`;
  } else {
    el.style.background = "#f7fff7";
    el.style.color = "#0b8a3c";
    el.textContent = `✅ Current Limit: ₹${monthlyLimit.toFixed(0)} | Spent: ₹${totalAll.toFixed(2)}`;
  }
}

// ------- Utility to escape HTML to avoid injection in table rendering -------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
