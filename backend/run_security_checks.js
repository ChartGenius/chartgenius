const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ChartG3n1us_Pr0d_2026!@db.ryckpsjmsrxbiylddqnb.supabase.co:5432/postgres';
const client = new Client({ connectionString: DATABASE_URL });

async function runSecurityChecks() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Query 1: Failed logins (last 30 min)
    const failedLogins = await client.query(`
      SELECT ip_address, email, COUNT(*) as attempts 
      FROM activity_log 
      WHERE action = 'login_failed' 
      AND created_at > NOW() - INTERVAL '30 minutes' 
      GROUP BY ip_address, email 
      ORDER BY attempts DESC
    `);
    console.log('\n[1] Failed Logins (30 min):', JSON.stringify(failedLogins.rows, null, 2));

    // Query 2: Brute force detection (3+ failures)
    const bruteForce = await client.query(`
      SELECT ip_address, COUNT(*) as attempts, array_agg(DISTINCT email) as targeted_emails 
      FROM activity_log 
      WHERE action = 'login_failed' 
      AND created_at > NOW() - INTERVAL '30 minutes' 
      GROUP BY ip_address 
      HAVING COUNT(*) >= 3
    `);
    console.log('\n[2] Brute Force (3+ failures):', JSON.stringify(bruteForce.rows, null, 2));

    // Query 3: Successful logins from suspicious IPs
    const suspiciousSuccessful = await client.query(`
      SELECT a.ip_address, a.email, a.action, a.created_at 
      FROM activity_log a 
      WHERE a.created_at > NOW() - INTERVAL '30 minutes' 
      AND a.ip_address IN (
        SELECT ip_address FROM activity_log 
        WHERE action = 'login_failed' 
        AND created_at > NOW() - INTERVAL '30 minutes'
      ) 
      ORDER BY a.created_at
    `);
    console.log('\n[3] Successful Logins from Suspicious IPs:', JSON.stringify(suspiciousSuccessful.rows, null, 2));

    // Query 4: Unusual activity volume
    const activityVolume = await client.query(`
      SELECT action, COUNT(*) as count 
      FROM activity_log 
      WHERE created_at > NOW() - INTERVAL '30 minutes' 
      GROUP BY action 
      ORDER BY count DESC
    `);
    console.log('\n[4] Activity Volume (30 min):', JSON.stringify(activityVolume.rows, null, 2));

    // Determine result
    let result = 'clean';
    let details = 'All checks passed - no suspicious activity detected';

    // Check for alerts (5+ failed logins from same IP)
    const maxFailures = bruteForce.rows.length > 0 ? Math.max(...bruteForce.rows.map(r => parseInt(r.attempts))) : 0;
    if (maxFailures >= 5) {
      result = 'alert';
      const alertIP = bruteForce.rows.find(r => parseInt(r.attempts) >= 5);
      details = `URGENT: ${alertIP.attempts} failed login attempts from IP ${alertIP.ip_address}. Targeted emails: ${alertIP.targeted_emails.join(', ')}`;
    } else if (maxFailures >= 3) {
      result = 'warning';
      details = `Brute force attempts detected: ${bruteForce.rows.length} IP(s) with 3+ failures. Details: ${JSON.stringify(bruteForce.rows)}`;
    }

    // Check for successful logins from suspicious IPs
    if (suspiciousSuccessful.rows.length > 0 && result !== 'alert') {
      result = 'warning';
      details = `Successful login(s) from IP(s) with failed attempts: ${suspiciousSuccessful.rows.length} events. Details: ${JSON.stringify(suspiciousSuccessful.rows)}`;
    }

    // Check for unusual volume (100+ API actions from single IP)
    const apiActions = activityVolume.rows.find(r => r.action.includes('api') || r.action.includes('request'));
    if (apiActions && parseInt(apiActions.count) >= 100) {
      result = result === 'clean' ? 'warning' : result;
      details += `\nHigh API volume detected: ${apiActions.count} actions from activity type`;
    }

    console.log('\n========== RESULT ==========');
    console.log(`Result: ${result.toUpperCase()}`);
    console.log(`Details: ${details}`);
    console.log(JSON.stringify({ result, details, failedLogins: failedLogins.rows, bruteForce: bruteForce.rows, suspiciousSuccessful: suspiciousSuccessful.rows, activityVolume: activityVolume.rows }));

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

runSecurityChecks();
