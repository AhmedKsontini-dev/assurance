const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Création de la table paiement_tranches...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS paiement_tranches (
        id INT NOT NULL AUTO_INCREMENT,
        client_id INT NOT NULL,
        numero_tranche INT NOT NULL,
        date_echeance DATE NOT NULL,
        montant_tranche DECIMAL(10,2) NOT NULL,
        statut ENUM('En attente', 'Payée') DEFAULT 'En attente',
        date_paiement_reel DATE NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY client_id (client_id)
      ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

    console.log('Table paiement_tranches créée avec succès.');

    // We do not remove nb_tranches and dates_tranches from clients table just in case they were added and contain data.
    // They will just be ignored in favor of the new table.

    console.log('Migration terminée !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();
