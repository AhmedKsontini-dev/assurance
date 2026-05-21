const db = require('./src/config/db');

async function run() {
  try {
    console.log('Altering clients table column rc...');
    await db.query('ALTER TABLE clients MODIFY COLUMN rc VARCHAR(100)');
    console.log('✅ Column rc successfully altered to VARCHAR(100).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error altering rc column:', err.message);
    process.exit(1);
  }
}

run();
