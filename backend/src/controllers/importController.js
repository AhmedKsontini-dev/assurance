const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const db = require('../config/db');
const Client = require('../models/clientModel');

const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
};

const parsePDF = async (buffer) => {
  const data = await pdfParse(buffer);
  const text = data.text;
  const lines = text.split('\n');
  const clients = [];

  // A simple regex to detect potential client lines based on common police formats like POL-XXXX
  // This is a generic approach; specific PDF formats might need custom parsing.
  const policeRegex = /(?:POL|N°\s*Police|Police)[\s:-]*([A-Z0-9-]+)/i;
  // A generic date regex for DD/MM/YYYY
  const dateRegex = /(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})/;
  // Phone regex
  const phoneRegex = /(?:\+?216)?\s*([234579]\d\s*\d{3}\s*\d{3}|\d{2}\s*\d{3}\s*\d{3})/i;

  let currentClient = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect police
    const policeMatch = line.match(policeRegex);
    if (policeMatch) {
      if (currentClient.police) {
        clients.push(currentClient);
        currentClient = {};
      }
      currentClient.police = policeMatch[1];
    } else if (!currentClient.police && /^[A-Z0-9-]+$/.test(line) && line.length > 5) {
      // Fallback for standalone police number if it looks like one
       currentClient.police = line;
    }

    if (currentClient.police) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch && !currentClient.date_expiration) {
        currentClient.date_expiration = dateMatch[1];
      }

      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch && !currentClient.tel) {
        currentClient.tel = phoneMatch[1].replace(/\s/g, '');
      }
      
      // If the line doesn't have police/date/phone, it might be the name
      if (!policeMatch && !dateMatch && !phoneMatch && line.length > 3 && !currentClient.societaire) {
         currentClient.societaire = line;
      }
    }
  }

  if (currentClient.police) {
    clients.push(currentClient);
  }

  return clients;
};

const normalizeHeader = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, ""); // keep only alphanumeric
};

const findKey = (row, possibleNames) => {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedName = normalizeHeader(name);
    for (const key of keys) {
      const normalizedKey = normalizeHeader(key);
      if (normalizedKey === normalizedName || normalizedKey.includes(normalizedName)) {
        return key;
      }
    }
  }
  return null;
};

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // If DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.match(/^(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})$/);
  if (parts) {
    return `${parts[3]}-${parts[2]}-${parts[1]}`;
  }
  return dateStr;
};

const mapToClientFormat = (rawClients) => {
  return rawClients.map((row, index) => {
    const policeKey = findKey(row, ['police', 'numpolice', 'npolice']);
    const societaireKey = findKey(row, ['nom', 'societaire', 'client', 'prenom']);
    const telKey = findKey(row, ['tel', 'telephone', 'phone', 'mobile']);
    
    // Priority order for date detection
    const dateExpPossibleNames = [
      "date d'expiration", "date expiration", "échéance", "echeance", "date d'échéance",
      "prochaine échéance", "date prochain paiement", "prochaine date de paiement",
      "date de paiement", "date paiement", "date renouvellement", "date de renouvellement",
      "date fin contrat", "fin de contrat", "date fin", "expiration", "échéance contrat"
    ];
    const dateExpKey = findKey(row, dateExpPossibleNames);
    
    // Some excel parsers return date as number, let's keep it simple here
    let dateExp = dateExpKey ? row[dateExpKey] : null;
    if (typeof dateExp === 'number') {
      // Convert Excel date serial number to string (roughly)
      const date = new Date((dateExp - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
         dateExp = date.toISOString().split('T')[0];
      }
    } else if (typeof dateExp === 'string') {
      dateExp = parseDateString(dateExp.trim());
    }

    return {
      _importId: index,
      _detectedDateColumn: dateExpKey || null,
      police: row[policeKey] || row.police || '',
      societaire: row[societaireKey] || row.societaire || '',
      tel: row[telKey] || row.tel || '',
      date_expiration: dateExp || '',
      payment_status: 'Unpaid'
    };
  });
};

exports.analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'Aucun fichier fourni' });
    }

    let rawClients = [];
    const mimetype = req.file.mimetype;

    if (mimetype === 'application/pdf') {
      rawClients = await parsePDF(req.file.buffer);
    } else if (
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      rawClients = parseExcel(req.file.buffer);
    } else {
      return res.status(400).json({ status: 'fail', message: 'Format non supporté' });
    }

    const mappedClients = mapToClientFormat(rawClients);

    // Validation and duplicates check
    const processedClients = [];
    let validCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    for (const client of mappedClients) {
      let status = 'Valide';
      let message = '';

      if (!client.police || client.police.trim() === '') {
        status = 'Erreur';
        message = 'Numéro de police manquant';
      } else if (!client.societaire || client.societaire.trim() === '') {
        status = 'Erreur';
        message = 'Nom du sociétaire manquant';
      } else {
        // Check duplicate
        const isDuplicate = await Client.isExactDuplicate({ police: client.police });
        if (isDuplicate) {
          status = 'Doublon';
          message = 'Client avec cette police déjà existant';
        }
      }

      if (status === 'Valide') validCount++;
      if (status === 'Erreur') errorCount++;
      if (status === 'Doublon') duplicateCount++;

      processedClients.push({
        ...client,
        _status: status,
        _message: message
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        total: processedClients.length,
        valid: validCount,
        errors: errorCount,
        duplicates: duplicateCount,
        clients: processedClients
      }
    });

  } catch (err) {
    console.error('Erreur lors de l\'analyse du fichier:', err);
    res.status(500).json({ status: 'error', message: 'Erreur lors de l\'analyse du fichier: ' + err.message });
  }
};

exports.confirmImport = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { clients } = req.body;
    
    if (!clients || !Array.isArray(clients)) {
      return res.status(400).json({ status: 'fail', message: 'Données de clients invalides' });
    }

    const validClients = clients.filter(c => c._status === 'Valide');
    
    if (validClients.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Aucun client valide à importer' });
    }

    await connection.beginTransaction();

    let importedCount = 0;
    
    for (const client of validClients) {
      // Re-validate duplicate just in case
      const [duplicateRows] = await connection.query('SELECT id FROM clients WHERE police = ? AND is_deleted = 0 LIMIT 1', [client.police]);
      
      if (duplicateRows.length > 0) {
         continue; // skip if added in the meantime
      }

      // Convert empty strings to null for date
      const dateExp = (client.date_expiration && client.date_expiration.trim() !== '') ? client.date_expiration : null;

      await connection.query(
        `INSERT INTO clients (
          police, societaire, tel, date_expiration, 
          payment_status, created_by, created_at, montant_paye, reste_a_payer
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, 0)`,
        [
          client.police || null,
          client.societaire || null,
          client.tel || null,
          dateExp,
          'Unpaid', // Force to Unpaid
          req.user.id
        ]
      );
      importedCount++;
    }

    await connection.commit();

    res.status(200).json({
      status: 'success',
      message: `${importedCount} nouveaux clients ont été ajoutés avec succès.`,
      importedCount
    });

  } catch (err) {
    await connection.rollback();
    console.error('Erreur lors de l\'importation:', err);
    res.status(500).json({ status: 'error', message: 'L\'importation a échoué. Aucun client n\'a été ajouté.' });
  } finally {
    connection.release();
  }
};
