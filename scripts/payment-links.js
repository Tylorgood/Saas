const db = require('./database');
const { v4: uuidv4 } = require('uuid');

db.initDatabase();

console.log('=== CashFlow AI - Payment Link Generator ===\n');

const BASE_URL = 'https://cashflow-ai-40om.onrender.com/pay';

function generatePaymentLink(invoice) {
  const data = {
    id: invoice.id,
    inv: invoice.invoice_number,
    from: 'Your Business Name', // In production, fetch from user settings
    due: new Date(invoice.due_date).toLocaleDateString(),
    amt: invoice.amount
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
  return `${BASE_URL}?d=${encoded}`;
}

const users = db.users;

if (users.length === 0) {
  console.log('No users found. Create an account first at:');
  console.log('https://cashflow-ai-40om.onrender.com/app');
  process.exit(0);
}

console.log('Generated Payment Links:\n' + '='.repeat(50) + '\n');

users.forEach(user => {
  const invoices = db.getInvoices(user.id);
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  
  if (pendingInvoices.length > 0) {
    console.log(`User: ${user.email}\n`);
    pendingInvoices.forEach(inv => {
      const paymentLink = generatePaymentLink(inv);
      console.log(`Invoice: ${inv.invoice_number}`);
      console.log(`Client: ${inv.client_name}`);
      console.log(`Amount: $${inv.amount.toFixed(2)}`);
      console.log(`Due: ${inv.due_date}`);
      console.log(`Payment Link: ${paymentLink}\n`);
      console.log('-'.repeat(50));
    });
  }
});

console.log('\n📋 NEXT STEPS:');
console.log('1. Share payment links with your clients');
console.log('2. Clients click link → see invoice → click "Pay Now"');
console.log('3. Currently simulates payment (shows success screen)');
console.log('4. To enable real payments: set up Stripe and update pay.html');
