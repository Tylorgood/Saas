const API_URL = '/api';

let token = localStorage.getItem('token');
let currentUser = null;

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });
  if (response.status === 401) {
    logout();
    return null;
  }
  return response.json();
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  const page = document.getElementById(`${pageId}Page`);
  if (page) page.classList.remove('hidden');
  
  const navLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (navLink) navLink.classList.add('active');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Auth
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
    document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const [email, password] = e.target.querySelectorAll('input');
  
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.value, password: password.value })
  });
  
  if (data.token) {
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    showApp();
  } else {
    alert(data.error || 'Login failed');
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const [name, email, password] = e.target.querySelectorAll('input');
  
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: name.value, email: email.value, password: password.value })
  });
  
  if (data.token) {
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    showApp();
  } else {
    alert(data.error || 'Registration failed');
  }
});

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  document.getElementById('authPage').classList.remove('hidden');
  document.getElementById('nav').classList.add('hidden');
  document.getElementById('dashboardPage').classList.add('hidden');
  document.getElementById('invoicesPage').classList.add('hidden');
  document.getElementById('clientsPage').classList.add('hidden');
  document.getElementById('expensesPage').classList.add('hidden');
  document.getElementById('subscriptionsPage').classList.add('hidden');
}

document.getElementById('logoutBtn').addEventListener('click', logout);

async function showApp() {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('nav').classList.remove('hidden');
  showPage('dashboard');
  await loadDashboard();
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(link.dataset.page);
    loadPageData(link.dataset.page);
  });
});

// Quick Actions
document.querySelectorAll('.btn-action').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'new-invoice') openModal('invoice');
    else if (action === 'new-client') openModal('client');
    else if (action === 'new-expense') openModal('expense');
  });
});

// Dashboard
async function loadDashboard() {
  const summary = await request('/summary');
  if (summary) {
    document.getElementById('totalRevenue').textContent = formatCurrency(summary.summary.totalRevenue);
    document.getElementById('pendingRevenue').textContent = formatCurrency(summary.summary.pendingRevenue);
    document.getElementById('totalExpenses').textContent = formatCurrency(summary.summary.totalExpenses);
    const profitEl = document.getElementById('netProfit');
    profitEl.textContent = formatCurrency(summary.summary.profit);
    profitEl.className = `stat-value ${summary.summary.profit >= 0 ? 'positive' : 'negative'}`;
  }
  
  const invoices = await request('/invoices');
  if (invoices) {
    const recent = invoices.invoices.slice(0, 5);
    const container = document.getElementById('recentInvoices');
    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state">No invoices yet</div>';
    } else {
      container.innerHTML = recent.map(inv => `
        <div class="list-item">
          <div class="list-item-info">
            <span class="list-item-label">${inv.invoice_number}</span>
            <span class="list-item-sub">${inv.client_name}</span>
          </div>
          <div class="list-item-value">
            <span class="status-badge ${inv.status}">${inv.status}</span>
          </div>
        </div>
      `).join('');
    }
  }
  
  const subs = await request('/subscriptions');
  if (subs) {
    const upcoming = subs.subscriptions.filter(s => s.status === 'active').slice(0, 5);
    const container = document.getElementById('upcomingSubscriptions');
    if (upcoming.length === 0) {
      container.innerHTML = '<div class="empty-state">No subscriptions</div>';
    } else {
      container.innerHTML = upcoming.map(s => `
        <div class="list-item">
          <div class="list-item-info">
            <span class="list-item-label">${s.client_name}</span>
            <span class="list-item-sub">${s.frequency}</span>
          </div>
          <div class="list-item-value">${formatCurrency(s.amount)}</div>
        </div>
      `).join('');
    }
  }
}

// Page Data Loading
async function loadPageData(page) {
  if (page === 'invoices') await loadInvoices();
  else if (page === 'clients') await loadClients();
  else if (page === 'expenses') await loadExpenses();
  else if (page === 'subscriptions') await loadSubscriptions();
}

async function loadInvoices() {
  const data = await request('/invoices');
  if (!data) return;
  
  const tbody = document.getElementById('invoicesTable');
  if (data.invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No invoices yet</td></tr>';
  } else {
    tbody.innerHTML = data.invoices.map(inv => `
      <tr>
        <td>${inv.invoice_number}</td>
        <td>${inv.client_name}</td>
        <td>${formatCurrency(inv.amount)}</td>
        <td>${formatDate(inv.due_date)}</td>
        <td><span class="status-badge ${inv.status}">${inv.status}</span></td>
        <td>
          ${inv.status === 'pending' ? `
            <button class="btn-small" onclick="getPaymentLink('${inv.id}', '${inv.invoice_number}', ${inv.amount})">Get Pay Link</button>
            <button class="btn-small" onclick="markPaid('${inv.id}')">Mark Paid</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }
}

async function getPaymentLink(id, number, amount) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ invoiceId: id })
    });
    
    const data = await res.json();
    console.log('Payment response:', data);
    
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      alert('Payment link copied to clipboard!\n\n' + data.url);
    } else {
      alert('Error: ' + (data.error || 'Failed to create payment link'));
    }
  } catch(err) {
    console.error('Payment error:', err);
    alert('Error creating payment link: ' + err.message);
  }
}

async function markPaid(id) {
  await request(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
  loadInvoices();
  loadDashboard();
}

async function loadClients() {
  const data = await request('/clients');
  if (!data) return;
  
  const tbody = document.getElementById('clientsTable');
  if (data.clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No clients yet</td></tr>';
  } else {
    tbody.innerHTML = data.clients.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.company || '-'}</td>
        <td>${c.email || '-'}</td>
        <td>${formatDate(c.created_at)}</td>
      </tr>
    `).join('');
  }
}

async function loadExpenses() {
  const data = await request('/expenses');
  if (!data) return;
  
  const tbody = document.getElementById('expensesTable');
  if (data.expenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No expenses yet</td></tr>';
  } else {
    tbody.innerHTML = data.expenses.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.description}</td>
        <td>${e.category}</td>
        <td>${formatCurrency(e.amount)}</td>
      </tr>
    `).join('');
  }
}

async function loadSubscriptions() {
  const data = await request('/subscriptions');
  if (!data) return;
  
  const tbody = document.getElementById('subscriptionsTable');
  if (data.subscriptions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No subscriptions yet</td></tr>';
  } else {
    tbody.innerHTML = data.subscriptions.map(s => `
      <tr>
        <td>${s.client_name}</td>
        <td>${formatCurrency(s.amount)}</td>
        <td>${s.frequency}</td>
        <td>${formatDate(s.next_billing)}</td>
        <td><span class="status-badge ${s.status}">${s.status}</span></td>
      </tr>
    `).join('');
  }
}

// Modals
function openModal(type) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  
  if (type === 'client') {
    body.innerHTML = `
      <h2>New Client</h2>
      <form id="clientForm">
        <div class="form-group">
          <label>Name *</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>Company</label>
          <input type="text" name="company">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email">
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" name="address">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Create Client</button>
          <button type="button" class="btn-small" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    `;
    document.getElementById('clientForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      await request('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.value,
          company: form.company.value,
          email: form.email.value,
          address: form.address.value
        })
      });
      closeModal();
      loadClients();
      if (!document.getElementById('dashboardPage').classList.contains('hidden')) loadDashboard();
    });
  }
  
  else if (type === 'invoice') {
    request('/clients').then(data => {
      if (!data.clients.length) {
        body.innerHTML = `
          <h2>New Invoice</h2>
          <p>Please create a client first.</p>
          <button class="btn-primary" onclick="openModal('client')">Create Client</button>
        `;
        return;
      }
      
      body.innerHTML = `
        <h2>New Invoice</h2>
        <form id="invoiceForm">
          <div class="form-group">
            <label>Client *</label>
            <select name="client_id" required>
              ${data.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Amount *</label>
            <input type="number" name="amount" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" name="due_date">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Create Invoice</button>
            <button type="button" class="btn-small" onclick="closeModal()">Cancel</button>
          </div>
        </form>
      `;
      
      document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        await request('/invoices', {
          method: 'POST',
          body: JSON.stringify({
            client_id: form.client_id.value,
            amount: parseFloat(form.amount.value),
            due_date: form.due_date.value
          })
        });
        closeModal();
        loadInvoices();
        loadDashboard();
      });
    });
  }
  
  else if (type === 'expense') {
    body.innerHTML = `
      <h2>New Expense</h2>
      <form id="expenseForm">
        <div class="form-group">
          <label>Description *</label>
          <input type="text" name="description" required>
        </div>
        <div class="form-group">
          <label>Amount *</label>
          <input type="number" name="amount" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select name="category">
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Services">Services</option>
            <option value="Marketing">Marketing</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Add Expense</button>
          <button type="button" class="btn-small" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    `;
    document.getElementById('expenseForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      await request('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: form.description.value,
          amount: parseFloat(form.amount.value),
          category: form.category.value,
          date: form.date.value
        })
      });
      closeModal();
      loadExpenses();
      loadDashboard();
    });
  }
  
  else if (type === 'subscription') {
    request('/clients').then(data => {
      if (!data.clients.length) {
        body.innerHTML = `
          <h2>New Subscription</h2>
          <p>Please create a client first.</p>
          <button class="btn-primary" onclick="openModal('client')">Create Client</button>
        `;
        return;
      }
      
      body.innerHTML = `
        <h2>New Subscription</h2>
        <form id="subscriptionForm">
          <div class="form-group">
            <label>Client *</label>
            <select name="client_id" required>
              ${data.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Amount *</label>
            <input type="number" name="amount" step="0.01" min="0" required>
          </div>
          <div class="form-group">
            <label>Frequency</label>
            <select name="frequency">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div class="form-group">
            <label>Next Billing Date</label>
            <input type="date" name="next_billing">
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary">Create Subscription</button>
            <button type="button" class="btn-small" onclick="closeModal()">Cancel</button>
        </div>
        </form>
      `;
      
      document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        await request('/subscriptions', {
          method: 'POST',
          body: JSON.stringify({
            client_id: form.client_id.value,
            amount: parseFloat(form.amount.value),
            frequency: form.frequency.value,
            next_billing: form.next_billing.value
          })
        });
        closeModal();
        loadSubscriptions();
        loadDashboard();
      });
    });
  }
  
  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('newInvoiceBtn')?.addEventListener('click', () => openModal('invoice'));
document.getElementById('newClientBtn')?.addEventListener('click', () => openModal('client'));
document.getElementById('newExpenseBtn')?.addEventListener('click', () => openModal('expense'));
document.getElementById('newSubscriptionBtn')?.addEventListener('click', () => openModal('subscription'));
document.getElementById('testPaymentBtn')?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/test-payment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error: ' + data.error);
    }
  } catch(err) {
    alert('Error: ' + err.message);
  }
});

// Init
if (token) {
  request('/auth/me').then(data => {
    if (data && data.user) {
      currentUser = data.user;
      showApp();
    } else {
      logout();
    }
  });
} else {
  logout();
}
