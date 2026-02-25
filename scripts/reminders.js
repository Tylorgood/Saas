const db = require('./database');

db.initDatabase();

console.log('=== CashFlow AI - Invoice Reminder Automation ===\n');

const today = new Date();
const users = db.users;

let totalReminders = 0;

users.forEach(user => {
  const invoices = db.getInvoices(user.id);
  const pendingInvoices = invoices.filter(i => {
    if (i.status !== 'pending') return false;
    const dueDate = new Date(i.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  });
  
  if (pendingInvoices.length > 0) {
    console.log(`User: ${user.email}`);
    pendingInvoices.forEach(inv => {
      const dueDate = new Date(inv.due_date);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      console.log(`  - ${inv.invoice_number}: $${inv.amount} due in ${daysUntilDue} days (${inv.client_name})`);
      totalReminders++;
    });
    console.log('');
  }
});

console.log(`Total reminders to send: ${totalReminders}`);
console.log('\n[Automation] In production, this would send email/SMS reminders.');
console.log('Configure with email service (SendGrid, Mailgun) for real notifications.');
