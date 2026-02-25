#!/usr/bin/env node

const https = require('https');
const { exec } = require('child_process');

const RENDER_URL = 'cashflow-ai-40om.onrender.com';

const GOAL_REVENUE = 100;

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function fetchStats() {
  return new Promise((resolve) => {
    const req = https.get(`https://${RENDER_URL}/api/cron/stats`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  CASHFLOW AI - CEO ACCOUNTABILITY SYSTEM');
  console.log('  Objective: Generate $100 in revenue');
  console.log('═'.repeat(60) + '\n');
  
  let cycle = 0;
  
  while(true) {
    cycle++;
    console.log(`\n🔄 CYCLE ${cycle} - Checking revenue...\n`);
    
    const stats = await fetchStats();
    
    if (!stats) {
      console.log('❌ Could not connect to server');
    } else {
      const revenue = stats.revenue || 0;
      const users = stats.users || 0;
      const invoices = stats.invoices || 0;
      const waitlist = stats.waitlist || 0;
      
      console.log('📊 CURRENT METRICS:');
      console.log(`   💰 Revenue:   $${revenue.toFixed(2)} / $${GOAL_REVENUE}`);
      console.log(`   👥 Users:     ${users}`);
      console.log(`   📄 Invoices:  ${invoices}`);
      console.log(`   📧 Leads:     ${waitlist}`);
      
      if (revenue >= GOAL_REVENUE) {
        console.log('\n🎉🎉🎉 REVENUE GOAL ACHIEVED! 🎉🎉🎉');
        console.log('═══════════════════════════════════════════════════════');
        process.exit(0);
      }
      
      const progress = (revenue / GOAL_REVENUE * 100).toFixed(1);
      console.log(`\n📈 Progress: ${progress}%`);
      console.log('\n💡 TO GENERATE REVENUE:');
      console.log('   1. Share: https://cashflow-ai-40om.onrender.com/');
      console.log('   2. Use payment link: /pay?amount=25');
      console.log('   3. Create invoices → Get Pay Link → Send to client');
    }
    
    console.log('\n⏰ Next check in 30 seconds...');
    await new Promise(r => setTimeout(r, 30000));
  }
}

main();
