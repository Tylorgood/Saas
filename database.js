const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

let db = {
  users: [],
  clients: [],
  invoices: [],
  expenses: [],
  subscriptions: [],
  waitlist: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Starting with fresh database');
  }
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function initDatabase() {
  loadDb();
}

function createUser(user) {
  db.users.push(user);
  saveDb();
  return user;
}

function findUserByEmail(email) {
  return db.users.find(u => u.email === email);
}

function findUserById(id) {
  const user = db.users.find(u => u.id === id);
  if (user) {
    return { id: user.id, email: user.email, name: user.name, plan: user.plan, created_at: user.created_at };
  }
  return null;
}

function createClient(client) {
  db.clients.push(client);
  saveDb();
  return client;
}

function getClients(userId) {
  return db.clients.filter(c => c.user_id === userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function createInvoice(invoice) {
  db.invoices.push(invoice);
  saveDb();
  return invoice;
}

function getInvoices(userId) {
  const userClients = getClients(userId);
  const clientMap = {};
  userClients.forEach(c => { clientMap[c.id] = c; });
  
  return db.invoices
    .filter(i => i.user_id === userId)
    .map(i => ({
      ...i,
      client_name: clientMap[i.client_id]?.name || 'Unknown',
      client_email: clientMap[i.client_id]?.email || ''
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function updateInvoiceStatus(id, status) {
  const invoice = db.invoices.find(i => i.id === id);
  if (invoice) {
    invoice.status = status;
    saveDb();
  }
}

function createExpense(expense) {
  db.expenses.push(expense);
  saveDb();
  return expense;
}

function getExpenses(userId) {
  return db.expenses
    .filter(e => e.user_id === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getFinancialSummary(userId) {
  const userInvoices = db.invoices.filter(i => i.user_id === userId);
  const userExpenses = db.expenses.filter(e => e.user_id === userId);
  
  const totalRevenue = userInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const pendingRevenue = userInvoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const totalExpenses = userExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    totalRevenue,
    pendingRevenue,
    totalExpenses,
    profit: totalRevenue - totalExpenses
  };
}

function createSubscription(subscription) {
  db.subscriptions.push(subscription);
  saveDb();
  return subscription;
}

function getSubscriptions(userId) {
  const userClients = getClients(userId);
  const clientMap = {};
  userClients.forEach(c => { clientMap[c.id] = c; });
  
  return db.subscriptions
    .filter(s => s.user_id === userId)
    .map(s => ({
      ...s,
      client_name: clientMap[s.client_id]?.name || 'Unknown'
    }))
    .sort((a, b) => new Date(a.next_billing) - new Date(b.next_billing));
}

function addToWaitlist(entry) {
  if (!db.waitlist) db.waitlist = [];
  const exists = db.waitlist.find(w => w.email === entry.email);
  if (!exists) {
    db.waitlist.push({ ...entry, created_at: new Date().toISOString() });
    saveDb();
  }
  return entry;
}

function getWaitlist() {
  return db.waitlist || [];
}

module.exports = {
  initDatabase,
  createUser,
  findUserByEmail,
  findUserById,
  createClient,
  getClients,
  createInvoice,
  getInvoices,
  updateInvoiceStatus,
  createExpense,
  getExpenses,
  getFinancialSummary,
  createSubscription,
  getSubscriptions,
  addToWaitlist,
  getWaitlist
};
