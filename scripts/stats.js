const db = require('./database');

db.initDatabase();

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║           CashFlow AI - Company Statistics              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📊 OVERVIEW');
console.log('─'.repeat(50));
console.log(`Total Users:        ${db.users.length}`);
console.log(`Total Clients:     ${db.clients.length}`);
console.log(`Total Invoices:    ${db.invoices.length}`);
console.log(`Paid Invoices:     ${db.invoices.filter(i => i.status === 'paid').length}`);
console.log(`Pending Invoices:  ${db.invoices.filter(i => i.status === 'pending').length}`);
console.log(`Total Expenses:    ${db.expenses.length}`);
console.log(`Subscriptions:     ${db.subscriptions.length}`);
console.log(`Active Subs:       ${db.subscriptions.filter(s => s.status === 'active').length}`);
console.log(`Waitlist Signups:  ${db.waitlist ? db.waitlist.length : 0}`);

const totalRevenue = db.invoices
  .filter(i => i.status === 'paid')
  .reduce((sum, i) => sum + i.amount, 0);

const pendingRevenue = db.invoices
  .filter(i => i.status === 'pending')
  .reduce((sum, i) => sum + i.amount, 0);

const totalExpenses = db.expenses
  .reduce((sum, e) => sum + e.amount, 0);

console.log('\n💰 FINANCIAL SUMMARY');
console.log('─'.repeat(50));
console.log(`Total Revenue:     $${totalRevenue.toFixed(2)}`);
console.log(`Pending Revenue:  $${pendingRevenue.toFixed(2)}`);
console.log(`Total Expenses:    $${totalExpenses.toFixed(2)}`);
console.log(`Net Profit:        $${(totalRevenue - totalExpenses).toFixed(2)}`);

if (db.waitlist && db.waitlist.length > 0) {
  console.log('\n📧 WAITLIST');
  console.log('─'.repeat(50));
  db.waitlist.forEach(w => {
    console.log(`${w.email} - ${new Date(w.created_at).toLocaleDateString()}`);
  });
}

if (db.users.length > 0) {
  console.log('\n👥 USERS');
  console.log('─'.repeat(50));
  db.users.forEach(u => {
    const userInvoices = db.invoices.filter(i => i.user_id === u.id);
    const userRevenue = userInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    console.log(`${u.name} (${u.email}) - $${userRevenue.toFixed(2)} revenue`);
  });
}

console.log('\n' + '='.repeat(50));
