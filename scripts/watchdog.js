#!/usr/bin/env node

const https = require('https');

const RENDER_URL = 'cashflow-ai-40om.onrender.com';

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     CASHFLOW AI - REVENUE WATCHDOG v1.0                  ║');
console.log('║     CEO Accountability System - NO EXCUSES               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const GOALS = {
  revenue: 0,
  users: 0,
  leads: 0,
  invoices: 0
};

let cycle = 0;

function log(msg) {
  const time = new Date().toISOString();
  console.log(`[${time}] ${msg}`);
}

function checkRevenue() {
  return new Promise((resolve) => {
    const req = https.get(`https://${RENDER_URL}/api/cron/stats`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const stats = JSON.parse(data);
          resolve(stats);
        } catch(e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function watchdog() {
  cycle++;
  console.log('\n' + '='.repeat(60));
  console.log(`CYCLE ${cycle} - REVENUE WATCHDOG`);
  console.log('='.repeat(60));
  
  const stats = await checkRevenue();
  
  if (stats) {
    console.log('\n📊 CURRENT STATUS:');
    console.log(`   Users:      ${stats.users || 0}`);
    console.log(`   Clients:    ${stats.clients || 0}`);
    console.log(`   Invoices:   ${stats.invoices || 0}`);
    console.log(`   Revenue:    $${(stats.revenue || 0).toFixed(2)}`);
    console.log(`   Waitlist:   ${stats.waitlist || 0}`);
    
    const hasRevenue = (stats.revenue || 0) > 0;
    const hasUsers = (stats.users || 0) > 0;
    const hasLeads = (stats.waitlist || 0) > 0;
    
    if (hasRevenue) {
      console.log('\n🎉 REVENUE DETECTED! MISSION ACCOMPLISHED!');
      console.log('================================================');
      process.exit(0);
    } else {
      console.log('\n⚠️  NO REVENUE YET. CONTINUING...');
      console.log('\n📋 ACTION ITEMS:');
      console.log('   1. Share tools on social media');
      console.log('   2. Drive traffic to landing page');
      console.log('   3. Get users to create invoices');
      console.log('   4. Push for payments');
    }
  } else {
    console.log('\n❌ Could not fetch stats - service may be down');
  }
  
  console.log('\n⏰ Next check in 60 seconds...');
  console.log('   (Press Ctrl+C to stop)');
  
  setTimeout(watchdog, 60000);
}

log('Starting Revenue Watchdog...');
log('Press Ctrl+C to stop');
log('');
watchdog();
