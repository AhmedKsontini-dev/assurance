-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : lun. 22 juin 2026 à 16:18
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `assurence_fraj`
--

-- --------------------------------------------------------

--
-- Structure de la table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` enum('ADD','UPDATE','DELETE','LOGIN','LOGOUT') DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=517 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action_type`, `client_id`, `description`, `created_at`) VALUES
(516, 9, 'ADD', 66, 'Ajout client: AA', '2026-06-22 16:16:47'),
(515, 9, 'UPDATE', 65, 'Tranche 2 payée (1000 DT) pour le client ID: 65', '2026-06-22 16:16:10'),
(514, 9, 'UPDATE', 65, 'Tranche 1 payée (1000 DT) pour le client ID: 65', '2026-06-22 16:15:28'),
(513, 9, 'ADD', 65, 'Ajout client: AAAA', '2026-06-22 16:14:39'),
(512, 9, 'UPDATE', 64, 'Tranche 2 payée (500 DT) pour le client ID: 64', '2026-06-22 16:11:56'),
(511, 9, 'UPDATE', 64, 'Tranche 1 payée (1000 DT) pour le client ID: 64', '2026-06-22 15:56:12'),
(510, 9, 'ADD', 64, 'Ajout client: ZZZ', '2026-06-22 15:39:33'),
(509, 9, 'LOGIN', NULL, 'User logged in from 100.113.217.68', '2026-06-22 14:41:14'),
(508, 9, 'ADD', 62, 'Ajout client: AAA', '2026-06-16 17:57:23'),
(507, 9, 'ADD', 61, 'Ajout client: AAA', '2026-06-16 17:55:18'),
(506, 9, 'LOGIN', NULL, 'User logged in from 100.113.217.68', '2026-06-16 14:32:40'),
(505, 9, 'LOGIN', NULL, 'User logged in from 100.113.217.68', '2026-06-16 13:32:55'),
(504, 8, 'ADD', NULL, 'Ajout Total Entrées (+): 300 TND - moncef', '2026-06-10 16:48:55'),
(501, 9, 'UPDATE', 59, 'Modification client: ID 59', '2026-06-10 14:47:58'),
(502, 8, 'DELETE', 59, 'Suppression client ID: 59', '2026-06-10 15:29:11'),
(503, 7, 'ADD', 60, 'Ajout client: AZDAZ', '2026-06-10 16:10:01'),
(498, 8, 'UPDATE', 59, 'Modification client: ADMIN', '2026-06-10 14:10:52'),
(499, 8, 'UPDATE', 59, 'Modification client: ADMIN', '2026-06-10 14:13:15'),
(500, 9, 'LOGIN', NULL, 'User logged in from 100.66.111.69', '2026-06-10 14:47:28'),
(497, 7, 'ADD', 59, 'Ajout client: ADMIN', '2026-06-10 14:09:50');

-- --------------------------------------------------------

--
-- Structure de la table `caisse_entries`
--

DROP TABLE IF EXISTS `caisse_entries`;
CREATE TABLE IF NOT EXISTS `caisse_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `montant` decimal(10,3) NOT NULL,
  `type` enum('INCOME','EXPENSE') NOT NULL,
  `description` varchar(255) NOT NULL,
  `date_operation` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `caisse_entries`
--

INSERT INTO `caisse_entries` (`id`, `user_id`, `montant`, `type`, `description`, `date_operation`, `created_at`) VALUES
(18, 8, 300.000, 'INCOME', 'moncef', '2026-06-10', '2026-06-10 16:48:55');

-- --------------------------------------------------------

--
-- Structure de la table `caisse_journaliere`
--

DROP TABLE IF EXISTS `caisse_journaliere`;
CREATE TABLE IF NOT EXISTS `caisse_journaliere` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `date` date NOT NULL,
  `montant_initial` decimal(10,3) NOT NULL DEFAULT '0.000',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`user_id`,`date`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `caisse_operations`
--

DROP TABLE IF EXISTS `caisse_operations`;
CREATE TABLE IF NOT EXISTS `caisse_operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `caisse_id` int NOT NULL,
  `montant` decimal(10,3) NOT NULL,
  `description` varchar(255) NOT NULL,
  `date_operation` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `caisse_id` (`caisse_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(12, 'kraheb');

-- --------------------------------------------------------

--
-- Structure de la table `clients`
--

DROP TABLE IF EXISTS `clients`;
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `police` varchar(50) DEFAULT NULL,
  `societaire` varchar(255) DEFAULT NULL,
  `adresse` text,
  `tel` varchar(20) DEFAULT NULL,
  `paiement` varchar(50) DEFAULT NULL,
  `montant` decimal(10,2) DEFAULT NULL,
  `reduction` decimal(10,2) DEFAULT NULL,
  `rc` varchar(100) DEFAULT NULL,
  `papier` varchar(255) DEFAULT NULL,
  `usage_vehicle` varchar(100) DEFAULT NULL,
  `immatriculation` varchar(50) DEFAULT NULL,
  `date_effet` date DEFAULT NULL,
  `date_expiration` date DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `renewal_status` varchar(50) DEFAULT NULL,
  `payment_status` varchar(50) DEFAULT 'Unpaid',
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `montant_paye` decimal(10,2) DEFAULT '0.00',
  `date_prochain_paiement` date DEFAULT NULL,
  `nb_tranches` int DEFAULT '0',
  `dates_tranches` json DEFAULT NULL,
  `reste_a_payer` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_created_by` (`created_by`)
) ENGINE=MyISAM AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `client_history`
--

DROP TABLE IF EXISTS `client_history`;
CREATE TABLE IF NOT EXISTS `client_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int DEFAULT NULL,
  `utilisateur_id` int NOT NULL,
  `nom_utilisateur` varchar(255) NOT NULL,
  `action_effectuee` varchar(255) NOT NULL,
  `ancienne_valeur` text,
  `nouvelle_valeur` text,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `client_history`
--

INSERT INTO `client_history` (`id`, `client_id`, `utilisateur_id`, `nom_utilisateur`, `action_effectuee`, `ancienne_valeur`, `nouvelle_valeur`, `date_modification`) VALUES
(126, 66, 9, 'bilel', 'Création du client', NULL, 'AA', '2026-06-22 16:16:47'),
(125, 65, 9, 'bilel', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-22 16:16:10'),
(124, 65, 9, 'bilel', 'Modification du montant payé', '1000.00 DT', '2000.00 DT', '2026-06-22 16:16:10'),
(123, 65, 9, 'bilel', 'Paiement de la tranche 2', 'En attente', 'Payée', '2026-06-22 16:16:10'),
(122, 65, 9, 'bilel', 'Modification du statut de paiement', 'Unpaid', 'Partial', '2026-06-22 16:15:28'),
(121, 65, 9, 'bilel', 'Modification du montant payé', '0.00 DT', '1000.00 DT', '2026-06-22 16:15:28'),
(119, 65, 9, 'bilel', 'Création du client', NULL, 'AAAA', '2026-06-22 16:14:39'),
(120, 65, 9, 'bilel', 'Paiement de la tranche 1', 'En attente', 'Payée', '2026-06-22 16:15:28'),
(118, 64, 9, 'bilel', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-22 16:11:56'),
(117, 64, 9, 'bilel', 'Modification du montant payé', '1000.00 DT', '1500.00 DT', '2026-06-22 16:11:56'),
(116, 64, 9, 'bilel', 'Paiement de la tranche 2', 'En attente', 'Payée', '2026-06-22 16:11:56'),
(115, 64, 9, 'bilel', 'Modification du statut de paiement', 'Unpaid', 'Partial', '2026-06-22 15:56:12'),
(112, 64, 9, 'bilel', 'Création du client', NULL, 'ZZZ', '2026-06-22 15:39:33'),
(113, 64, 9, 'bilel', 'Paiement de la tranche 1', 'En attente', 'Payée', '2026-06-22 15:56:12'),
(114, 64, 9, 'bilel', 'Modification du montant payé', '0.00 DT', '1000.00 DT', '2026-06-22 15:56:12'),
(111, 62, 9, 'bilel', 'Création du client', NULL, 'AAA', '2026-06-16 17:57:23'),
(109, 60, 7, 'Admin User', 'Création du client', NULL, 'AZDAZ', '2026-06-10 16:10:01'),
(110, 61, 9, 'bilel', 'Création du client', NULL, 'AAA', '2026-06-16 17:55:18'),
(108, 59, 8, 'ahmed', 'Suppression du client', 'ADMIN', NULL, '2026-06-10 15:29:11'),
(107, 59, 9, 'bilel', 'Modification du montant payé', '1000.00 DT', '0.00 DT', '2026-06-10 14:47:58'),
(106, 59, 9, 'bilel', 'Modification du statut de paiement', 'Paid', 'Unpaid', '2026-06-10 14:47:58'),
(105, 59, 8, 'ahmed', 'Modification du montant payé', '500.00 DT', '1000.00 DT', '2026-06-10 14:10:52'),
(104, 59, 8, 'ahmed', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-10 14:10:52'),
(103, 59, 7, 'Admin User', 'Création du client', NULL, 'ADMIN', '2026-06-10 14:09:50');

-- --------------------------------------------------------

--
-- Structure de la table `client_notes`
--

DROP TABLE IF EXISTS `client_notes`;
CREATE TABLE IF NOT EXISTS `client_notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `client_renewals`
--

DROP TABLE IF EXISTS `client_renewals`;
CREATE TABLE IF NOT EXISTS `client_renewals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `old_expiration_date` date DEFAULT NULL,
  `new_expiration_date` date NOT NULL,
  `renewal_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` int NOT NULL,
  `plan_duration` varchar(100) DEFAULT NULL,
  `notes` text,
  `status` enum('Accepted','Refused','Follow-up') DEFAULT 'Accepted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `client_versements`
--

DROP TABLE IF EXISTS `client_versements`;
CREATE TABLE IF NOT EXISTS `client_versements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `date_versement` date NOT NULL,
  `methode_paiement` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int DEFAULT NULL,
  `annule` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `fk_versement_user` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `events`
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `amount` decimal(15,2) DEFAULT NULL,
  `event_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `color` varchar(20) DEFAULT '#3b82f6',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `event_partage` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `payment_method` varchar(50) DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiement_tranches`
--

DROP TABLE IF EXISTS `paiement_tranches`;
CREATE TABLE IF NOT EXISTS `paiement_tranches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `numero_tranche` int NOT NULL,
  `date_echeance` date NOT NULL,
  `montant_tranche` decimal(10,2) NOT NULL,
  `statut` enum('En attente','Payée') DEFAULT 'En attente',
  `date_paiement_reel` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_time` timestamp NULL DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `login_time`, `logout_time`, `duration_minutes`) VALUES
(79, 9, '2026-06-22 14:41:14', NULL, NULL),
(78, 9, '2026-06-16 14:32:40', NULL, NULL),
(77, 9, '2026-06-16 13:32:55', NULL, NULL),
(76, 9, '2026-06-10 14:47:28', NULL, NULL),
(75, 8, '2026-06-10 11:49:51', NULL, NULL),
(74, 8, '2026-06-09 22:46:20', NULL, NULL),
(73, 7, '2026-06-09 22:46:01', NULL, NULL),
(72, 9, '2026-06-09 18:28:03', NULL, NULL),
(71, 7, '2026-06-09 18:17:55', NULL, NULL),
(70, 8, '2026-06-08 13:53:52', NULL, NULL),
(69, 8, '2026-06-08 13:53:21', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `sinistres`
--

DROP TABLE IF EXISTS `sinistres`;
CREATE TABLE IF NOT EXISTS `sinistres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_police` varchar(100) DEFAULT NULL,
  `nom_client` varchar(255) DEFAULT NULL,
  `immatriculation` varchar(100) DEFAULT NULL,
  `date_accident` date DEFAULT NULL,
  `numero_sinistre` varchar(100) DEFAULT NULL,
  `nom_expert` varchar(255) DEFAULT NULL,
  `nature_sinistre` varchar(255) DEFAULT NULL,
  `montant_rapport_expertise` decimal(15,2) DEFAULT NULL,
  `observation` text,
  `rapport_cheque` varchar(255) DEFAULT NULL,
  `date_cheque` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `sinistres`
--

INSERT INTO `sinistres` (`id`, `numero_police`, `nom_client`, `immatriculation`, `date_accident`, `numero_sinistre`, `nom_expert`, `nature_sinistre`, `montant_rapport_expertise`, `observation`, `rapport_cheque`, `date_cheque`, `created_at`, `updated_at`) VALUES
(8, '123', 'AAA', '123DF12', '2026-06-10', '123', 'AZDAZD', 'ZDAZ', 123.00, 'ZFZAEFZEF', 'sinistre-1781102597973-169200959.pdf', '2026-06-10', '2026-06-10 14:43:17', '2026-06-10 14:43:17'),
(9, '1651', 'ef', '15er516', '2026-06-01', '1561', 'zefzef', 'zeffe', 200.00, NULL, NULL, '2026-06-18', '2026-06-10 16:27:29', '2026-06-16 14:28:11');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','EMPLOYEE') DEFAULT 'EMPLOYEE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `can_add` tinyint(1) DEFAULT '1',
  `can_edit` tinyint(1) DEFAULT '1',
  `can_delete` tinyint(1) DEFAULT '1',
  `last_active` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `can_add`, `can_edit`, `can_delete`, `last_active`) VALUES
(9, 'bilel', 'bilel@gmail.com', '$2a$12$sI2EJdfAj3rgyGCO.SA5GuaIu3.azNmYs5LCMVDt0L1ACCQqrIW.y', 'ADMIN', '2026-06-09 18:27:57', 1, 1, 1, '2026-06-22 16:16:46'),
(7, 'Admin User', 'admin@assurance.com', '123456', 'ADMIN', '2026-06-03 21:25:12', 1, 1, 1, '2026-06-22 14:40:09'),
(8, 'ahmed', 'ahmed@gmail.com', '$2a$12$PFsSkUGtHKf.SvU..NAVp.MsTB2kcXp3Lr.fp/puHGUWhm5A6GKZO', 'ADMIN', '2026-06-03 21:26:13', 1, 1, 1, '2026-06-10 16:56:51');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
