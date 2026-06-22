ALTER TABLE clients 
ADD COLUMN nb_tranches INT DEFAULT 0 AFTER date_prochain_paiement,
ADD COLUMN dates_tranches JSON NULL AFTER nb_tranches;