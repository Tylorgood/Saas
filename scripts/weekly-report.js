const db = require('./database');

db.initDatabase();

console.log('=== CashFlow AI - Weekly Financial Report ===\n');
console.log(`Report Generated: ${new Date().toLocaleDateString()}\n`);

const users = db.users;

users.forEach(user => {
  const summary = db.getFinancialSummary(user.id);
  const invoices = db.getInvoices(user.id);
  const expenses = db.getExpenses(user.id);
  const subscriptions = db.getSubscriptions(user.id);
  
  const thisWeekInvoices = invoices.filter(i => {
    const created = new Date(i.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created >= weekAgo;
  });
  
  const thisWeekExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });
  
  console.log(`User: ${user.name} (${user.email})`);
  console.log('─'.repeat(40));
  console.log(`  Total Revenue: $${summary.totalRevenue.toFixed(2)}`);
  console.log(`  Pending Revenue: $${summary.pendingRevenue.toFixed(2)}`);
  console.log(`  Total Expenses: $${summary.totalExpenses.toFixed(2)}`);
  console.log(`  Net Profit: $${summary.profit.toFixed(2)}`);
  console.log(`  Active Subscriptions: ${subscriptions.filter(s => s.status === 'active').length}`);
  console.log(`\n  This Week:`);
  console.log(`    New Invoices: ${thisWeekInvoices.length}`);
  console.log(`    New Expenses: ${thisWeekExpenses.length}`);
  console.log('');
});

console.log('[Automation] Configure cron job to run weekly.');
console.log('Add email integration to send reports automatically.');
