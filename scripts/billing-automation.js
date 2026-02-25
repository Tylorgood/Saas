const db = require('./database');
const { v4: uuidv4 } = require('uuid');

db.initDatabase();

console.log('=== CashFlow AI - Subscription Billing Automation ===\n');

const today = new Date();
today.setHours(0, 0, 0, 0);

const users = db.users;
let newInvoices = 0;

users.forEach(user => {
  const subscriptions = db.getSubscriptions(user.id);
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  
  activeSubs.forEach(sub => {
    const nextBilling = new Date(sub.next_billing);
    nextBilling.setHours(0, 0, 0, 0);
    
    if (nextBilling <= today) {
      const invoiceCount = db.getInvoices(user.id).length + 1;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(4, '0')}`;
      
      db.createInvoice({
        id: uuidv4(),
        user_id: user.id,
        client_id: sub.client_id,
        invoice_number: invoiceNumber,
        amount: sub.amount,
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: JSON.stringify([{ description: `Recurring payment - ${sub.frequency}`, amount: sub.amount }])
      });
      
      const nextDate = new Date(sub.next_billing);
      if (sub.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (sub.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (sub.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      
      console.log(`Created invoice ${invoiceNumber} for ${sub.client_name}: $${sub.amount}`);
      newInvoices++;
    }
  });
});

if (newInvoices > 0) {
  console.log(`\nTotal new invoices created: ${newInvoices}`);
} else {
  console.log('No subscriptions due for billing today.');
}

console.log('\n[Automation] Run this script daily via cron to automate subscription billing.');
