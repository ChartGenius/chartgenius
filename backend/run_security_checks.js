const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function runSecurityChecks() {
  const pool = new Pool({ connectionString });
  const results = {
    failedLogins: null,
    bruteForce: null,
    suspiciousLogins: null,
    activityVolume: null,
    error: null
  };

  try {
    // Check 1: Failed logins (last 30 min)
    const failedLogins = await pool.query(`
      SELECT ip_address, email, COUNT(*) as attempts 
      FROM activity_log 
      WHERE action = 'login_failed' 
      AND created_at > NOW() - INTERVAL '30 minutes'
      GROUP BY ip_address, email 
      ORDER BY attempts DESC;
    `);
    results.failedLogins = failedLogins.rows;

    // Check 2: Brute force detection (3+ failures from same IP in 30 min)
    const bruteForce = await pool.query(`
      SELECT ip_address, COUNT(*) as attempts, array_agg(DISTINCT email) as targeted_emails 
      FROM activity_log 
      WHERE action = 'login_failed' 
      AND created_at > NOW() - INTERVAL '30 minutes'
      GROUP BY ip_address 
      HAVING COUNT(*) >= 3;
    `);
    results.bruteForce = bruteForce.rows;

    // Check 3: Successful logins from suspicious IPs
    const suspiciousLogins = await pool.query(`
      SELECT a.ip_address, a.email, a.action, a.created_at 
      FROM activity_log a 
      WHERE a.created_at > NOW() - INTERVAL '30 minutes' 
      AND a.ip_address IN (
        SELECT ip_address 
        FROM activity_log 
        WHERE action = 'login_failed' 
        AND created_at > NOW() - INTERVAL '30 minutes'
      ) 
      ORDER BY a.created_at;
    `);
    results.suspiciousLogins = suspiciousLogins.rows;

    // Check 4: Unusual activity volume
    const activityVolume = await pool.query(`
      SELECT action, COUNT(*) as count 
      FROM activity_log 
      WHERE created_at > NOW() - INTERVAL '30 minutes'
      GROUP BY action 
      ORDER BY count DESC;
    `);
    results.activityVolume = activityVolume.rows;

  } catch (err) {
    results.error = err.message;
  } finally {
    await pool.end();
  }

  return results;
}

runSecurityChecks().then(results => {
  console.log(JSON.stringify(results, null, 2));
});
