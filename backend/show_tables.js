const db = require('./src/config/db');

async function run() {
  try {
    const [rows] = await db.query('DESCRIBE client_versements');
    console.log('Columns in client_versements:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error describing table:', err.message);
    process.exit(1);
  }
}

run();
