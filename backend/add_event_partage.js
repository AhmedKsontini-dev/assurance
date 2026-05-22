const db = require('./src/config/db');

async function run() {
  try {
    console.log('Checking database table events...');
    // Describe events to see if event_partage column exists
    const [columns] = await db.query('SHOW COLUMNS FROM events LIKE "event_partage"');
    
    if (columns.length === 0) {
      console.log('Adding event_partage column to events table...');
      await db.query('ALTER TABLE events ADD COLUMN event_partage BOOLEAN DEFAULT FALSE');
      console.log('✅ Column event_partage successfully added.');
    } else {
      console.log('✅ Column event_partage already exists in events table.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating events table:', err.message);
    process.exit(1);
  }
}

run();
