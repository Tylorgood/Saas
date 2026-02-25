const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('./database');

let stripe = null;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (stripeSecret) {
  const Stripe = require('stripe');
  stripe = Stripe(stripeSecret);
  console.log('Stripe initialized');
} else {
  console.log('Stripe not configured - payments disabled');
}

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cashflow-ai-secret-key-change-in-production';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      plan: 'free'
    };
    
    db.createUser(user);
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

app.post('/api/clients', authenticateToken, (req, res) => {
  try {
    const { name, email, company, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Client name required' });
    }
    
    const client = {
      id: uuidv4(),
      user_id: req.user.id,
      name,
      email: email || '',
      company: company || '',
      address: address || ''
    };
    
    db.createClient(client);
    res.json({ client });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.get('/api/clients', authenticateToken, (req, res) => {
  const clients = db.getClients(req.user.id);
  res.json({ clients });
});

app.post('/api/invoices', authenticateToken, (req, res) => {
  try {
    const { client_id, amount, due_date, items } = req.body;
    
    if (!client_id || !amount) {
      return res.status(400).json({ error: 'Client and amount required' });
    }
    
    const userClients = db.getClients(req.user.id);
    const clientExists = userClients.find(c => c.id === client_id);
    
    if (!clientExists) {
      return res.status(400).json({ error: 'Client not found' });
    }
    
    const invoiceCount = db.getInvoices(req.user.id).length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(4, '0')}`;
    
    const invoice = {
      id: uuidv4(),
      user_id: req.user.id,
      client_id,
      invoice_number: invoiceNumber,
      amount: parseFloat(amount),
      status: 'pending',
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: JSON.stringify(items || [{ description: 'Services', amount: parseFloat(amount) }])
    };
    
    db.createInvoice(invoice);
    res.json({ invoice: { ...invoice, client_name: clientExists.name } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.get('/api/invoices', authenticateToken, (req, res) => {
  const invoices = db.getInvoices(req.user.id);
  res.json({ invoices });
});

app.patch('/api/invoices/:id', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.updateInvoiceStatus(req.params.id, status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  try {
    const { description, amount, category, date, receipt } = req.body;
    
    if (!description || !amount) {
      return res.status(400).json({ error: 'Description and amount required' });
    }
    
    const expense = {
      id: uuidv4(),
      user_id: req.user.id,
      description,
      amount: parseFloat(amount),
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0],
      receipt: receipt || ''
    };
    
    db.createExpense(expense);
    res.json({ expense });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.get('/api/expenses', authenticateToken, (req, res) => {
  const expenses = db.getExpenses(req.user.id);
  res.json({ expenses });
});

app.get('/api/summary', authenticateToken, (req, res) => {
  const summary = db.getFinancialSummary(req.user.id);
  res.json({ summary });
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  try {
    const { client_id, amount, frequency, next_billing } = req.body;
    
    if (!client_id || !amount) {
      return res.status(400).json({ error: 'Client and amount required' });
    }
    
    const subscription = {
      id: uuidv4(),
      user_id: req.user.id,
      client_id,
      amount: parseFloat(amount),
      frequency: frequency || 'monthly',
      status: 'active',
      next_billing: next_billing || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    db.createSubscription(subscription);
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

app.get('/api/subscriptions', authenticateToken, (req, res) => {
  const subscriptions = db.getSubscriptions(req.user.id);
  res.json({ subscriptions });
});

app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  db.addToWaitlist({ email });
  res.json({ success: true });
});

app.get('/api/cron/:action', (req, res) => {
  const { action } = req.params;
  
  if (action === 'stats') {
    const stats = {
      users: db.users.length,
      clients: db.clients.length,
      invoices: db.invoices.length,
      revenue: db.invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
      waitlist: db.waitlist ? db.waitlist.length : 0
    };
    return res.json(stats);
  }
  
  res.json({ error: 'Unknown action' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/pay', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pay.html'));
});

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  
  try {
    const { invoiceId } = req.body;
    
    let invoice;
    if (invoiceId) {
      invoice = db.invoices.find(i => i.id === invoiceId);
    }
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for ${invoice.invoice_number}`
          },
          unit_amount: Math.round(invoice.amount * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/pay?success=true&id=${invoice.id}`,
      cancel_url: `${req.protocol}://${req.get('host')}/pay?canceled=true&id=${invoice.id}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number
      }
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoice_id;
    
    if (invoiceId) {
      db.updateInvoiceStatus(invoiceId, 'paid');
      console.log(`Invoice ${invoiceId} marked as paid!`);
    }
  }
  
  res.json({ received: true });
});

app.post('/api/invoice/:id/mark-paid', (req, res) => {
  const { id } = req.params;
  db.updateInvoiceStatus(id, 'paid');
  res.json({ success: true });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    stripe: !!stripe,
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

db.initDatabase();
app.listen(PORT, () => {
  console.log(`CashFlow AI running on http://localhost:${PORT}`);
});
