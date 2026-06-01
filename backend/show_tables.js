const db = require('./src/config/db');

async function run() {
  try {
    const [rows] = await db.query('SHOW TABLE STATUS');
    console.log('Tables:', rows.map(r => ({ Name: r.Name, Engine: r.Engine, Collation: r.Collation })));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
