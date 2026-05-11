const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDB = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database "${process.env.DB_NAME}" ensured`);

    // Switch to the database
    await connection.query(`USE \`${process.env.DB_NAME}\``);

    // Create clients table
    const createClientsTable = `
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      police VARCHAR(50),
      societaire VARCHAR(255),
      adresse TEXT,
      tel VARCHAR(20),
      paiement VARCHAR(50),
      montant DECIMAL(10, 2),
      reduction DECIMAL(10, 2),
      rc DECIMAL(10, 2),
      papier VARCHAR(255),
      usage_vehicle VARCHAR(100),
      immatriculation VARCHAR(50),
      date_effet DATE,
      date_expiration DATE,
      total DECIMAL(10, 2),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    `;
    await connection.query(createClientsTable);
    console.log('✅ Table "clients" ensured');

    // Create users table
    const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('ADMIN', 'EMPLOYEE') DEFAULT 'EMPLOYEE',
      can_add BOOLEAN DEFAULT TRUE,
      can_edit BOOLEAN DEFAULT TRUE,
      can_delete BOOLEAN DEFAULT TRUE,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await connection.query(createUsersTable);
    console.log('✅ Table "users" ensured');

    // Create activity_logs table
    const createLogsTable = `
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action_type ENUM('ADD', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'),
      client_id INT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    `;
    await connection.query(createLogsTable);
    console.log('✅ Table "activity_logs" ensured');

    // Create sessions table
    const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      logout_time TIMESTAMP NULL,
      duration_minutes INT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `;
    await connection.query(createSessionsTable);
    console.log('✅ Table "sessions" ensured');

    // Create expenses table
    const createExpensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      description TEXT,
      payment_method VARCHAR(50),
      expense_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `;
    await connection.query(createExpensesTable);
    console.log('✅ Table "expenses" ensured');

    // Create default admin if not exists
    const [adminExists] = await connection.query('SELECT * FROM users WHERE role = "ADMIN"');
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@assurance.com', hashedPassword, 'ADMIN']
      );
      console.log('👤 Default admin user created (admin@assurance.com / admin123)');
    }

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during initialization:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

initDB();
