-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : jeu. 04 juin 2026 à 14:09
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
) ENGINE=MyISAM AUTO_INCREMENT=433 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action_type`, `client_id`, `description`, `created_at`) VALUES
(432, 8, 'DELETE', 41, 'Suppression client ID: 41', '2026-06-04 14:06:59'),
(431, 7, 'UPDATE', 40, 'Modification client: ID 40', '2026-06-04 14:05:41'),
(430, 7, 'UPDATE', 40, 'Modification client: ID 40', '2026-06-04 14:05:38'),
(429, 7, 'UPDATE', 41, 'Modification client: BBBBB', '2026-06-04 14:03:46'),
(427, 7, 'ADD', 41, 'Ajout client: BBBBB', '2026-06-04 13:57:31'),
(428, 8, 'UPDATE', 41, 'Modification client: BBBBB', '2026-06-04 14:00:35'),
(426, 8, 'ADD', 40, 'Ajout client:  AAAAAAA', '2026-06-04 13:56:39'),
(425, 7, 'DELETE', 38, 'Suppression client ID: 38', '2026-06-04 13:55:38'),
(423, 8, 'LOGIN', NULL, 'User logged in from 100.113.217.68', '2026-06-04 13:54:44'),
(424, 7, 'LOGIN', NULL, 'User logged in from 100.113.217.68', '2026-06-04 13:54:56'),
(422, 7, 'DELETE', 39, 'Suppression client ID: 39', '2026-06-04 12:55:15'),
(421, 8, 'UPDATE', 38, 'Modification client: ID 38', '2026-06-04 12:51:32'),
(420, 7, 'UPDATE', 38, 'Modification client: CREE PAR ADMIN', '2026-06-04 12:50:01'),
(419, 8, 'UPDATE', 38, 'Modification client: CREE PAR ADMIN', '2026-06-04 12:47:16'),
(418, 8, 'UPDATE', 39, 'Modification client: ID 39', '2026-06-04 12:45:03'),
(417, 7, 'UPDATE', 39, 'Modification client: CREE PAR AHMED', '2026-06-04 12:44:20'),
(416, 8, 'UPDATE', 39, 'Modification client: CREE PAR AHMED', '2026-06-04 12:34:06'),
(415, 7, 'UPDATE', 39, 'Modification client: CREE PAR AHMED', '2026-06-04 12:32:05'),
(414, 8, 'ADD', 39, 'Ajout client: CREE PAR AHMED', '2026-06-04 12:13:21'),
(413, 7, 'ADD', 38, 'Ajout client: CREE PAR ADMIN', '2026-06-04 12:12:32');

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
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(9, 'voiture');

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
  `reste_a_payer` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_created_by` (`created_by`)
) ENGINE=MyISAM AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `clients`
--

INSERT INTO `clients` (`id`, `police`, `societaire`, `adresse`, `tel`, `paiement`, `montant`, `reduction`, `rc`, `papier`, `usage_vehicle`, `immatriculation`, `date_effet`, `date_expiration`, `total`, `created_at`, `created_by`, `renewal_status`, `payment_status`, `payment_date`, `payment_method`, `category`, `montant_paye`, `date_prochain_paiement`, `reste_a_payer`, `is_deleted`) VALUES
(38, '111111', 'CREE PAR ADMIN', 'HAMAMET', '124124', 'Espece', 3000.00, 200.00, '', 'COMPLET', 'TAXI', '12 TU 56', '2026-06-04', '2026-06-30', 2800.00, '2026-06-03 23:00:00', 7, NULL, 'Paid', '2026-06-04', '', 'voiture', 2800.00, NULL, 0.00, 1),
(40, '1111', ' AAAAAAA', 'AAAAAAA', '111111111', NULL, 2000.00, NULL, NULL, 'COMPLET', 'TAXI', '11 AA 1111', '2026-06-01', '2026-06-30', 2000.00, '2026-06-03 23:00:00', 8, NULL, 'Paid', '2026-06-04', NULL, 'voiture', 2000.00, NULL, 0.00, 0),
(41, '2222', 'BBBBB', 'BBBBB', '22222', 'Espece', 3800.00, 200.00, '', 'COMPLET', '', '22 BBB 222', '2026-06-01', '2026-06-30', 3600.00, '2026-06-03 23:00:00', 7, NULL, 'Paid', '2026-06-05', '', 'voiture', 3600.00, NULL, 0.00, 1);

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
) ENGINE=MyISAM AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `client_history`
--

INSERT INTO `client_history` (`id`, `client_id`, `utilisateur_id`, `nom_utilisateur`, `action_effectuee`, `ancienne_valeur`, `nouvelle_valeur`, `date_modification`) VALUES
(18, 39, 8, 'ahmed', 'Modification du montant payé', '3000.00 DT', '5000.00 DT', '2026-06-04 12:45:03'),
(17, 39, 8, 'ahmed', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-04 12:45:03'),
(16, 39, 7, 'Admin User', 'Modification du montant payé', '1000.00 DT', '3000.00 DT', '2026-06-04 12:44:20'),
(15, 39, 8, 'ahmed', 'Modification du montant payé', '2000.00 DT', '1000.00 DT', '2026-06-04 12:34:06'),
(14, 39, 7, 'Admin User', 'Modification du montant payé', '1000.00 DT', '2000.00 DT', '2026-06-04 12:32:05'),
(13, 39, 8, 'ahmed', 'Création du client', NULL, 'CREE PAR AHMED', '2026-06-04 12:13:21'),
(12, 38, 7, 'Admin User', 'Création du client', NULL, 'CREE PAR ADMIN', '2026-06-04 12:12:32'),
(19, 38, 8, 'ahmed', 'Modification du statut de paiement', 'Unpaid', 'Partial', '2026-06-04 12:47:16'),
(20, 38, 8, 'ahmed', 'Modification du montant payé', '0.00 DT', '1000.00 DT', '2026-06-04 12:47:16'),
(21, 38, 7, 'Admin User', 'Modification du montant payé', '1000.00 DT', '2000.00 DT', '2026-06-04 12:50:01'),
(22, 38, 8, 'ahmed', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-04 12:51:32'),
(23, 38, 8, 'ahmed', 'Modification du montant payé', '2000.00 DT', '2800.00 DT', '2026-06-04 12:51:32'),
(24, 39, 7, 'Admin User', 'Suppression du client', 'CREE PAR AHMED', NULL, '2026-06-04 12:55:15'),
(25, 38, 7, 'Admin User', 'Suppression du client', 'CREE PAR ADMIN', NULL, '2026-06-04 13:55:38'),
(26, 40, 8, 'ahmed', 'Création du client', NULL, ' AAAAAAA', '2026-06-04 13:56:39'),
(27, 41, 7, 'Admin User', 'Création du client', NULL, 'BBBBB', '2026-06-04 13:57:31'),
(28, 41, 8, 'ahmed', 'Modification du montant payé', '600.00 DT', '1600.00 DT', '2026-06-04 14:00:35'),
(29, 41, 7, 'Admin User', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-04 14:03:46'),
(30, 41, 7, 'Admin User', 'Modification du montant payé', '1600.00 DT', '3600.00 DT', '2026-06-04 14:03:46'),
(31, 40, 7, 'Admin User', 'Modification du statut de paiement', 'Unpaid', 'Partial', '2026-06-04 14:05:38'),
(32, 40, 7, 'Admin User', 'Modification du montant payé', '0.00 DT', '1000.00 DT', '2026-06-04 14:05:38'),
(33, 40, 7, 'Admin User', 'Modification du statut de paiement', 'Partial', 'Paid', '2026-06-04 14:05:41'),
(34, 40, 7, 'Admin User', 'Modification du montant payé', '1000.00 DT', '2000.00 DT', '2026-06-04 14:05:41'),
(35, 41, 8, 'ahmed', 'Suppression du client', 'BBBBB', NULL, '2026-06-04 14:06:59');

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=MyISAM AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `client_versements`
--

INSERT INTO `client_versements` (`id`, `client_id`, `montant`, `date_versement`, `methode_paiement`, `created_at`, `user_id`, `annule`) VALUES
(45, 38, 1000.00, '2026-06-04', 'Espece', '2026-06-04 12:47:16', 8, 1),
(47, 38, 800.00, '2026-06-04', 'Espece', '2026-06-04 12:51:32', 8, 1),
(46, 38, 1000.00, '2026-06-04', 'Espece', '2026-06-04 12:50:01', 7, 1),
(44, 39, 2000.00, '2026-06-04', 'Espece', '2026-06-04 12:45:03', 8, 0),
(43, 39, 2000.00, '2026-06-06', 'Espece', '2026-06-04 12:44:20', 7, 0),
(42, 39, -1000.00, '2026-06-06', 'Espece', '2026-06-04 12:34:06', 8, 0),
(41, 39, 1000.00, '2026-06-05', 'Espece', '2026-06-04 12:32:05', 7, 0),
(40, 39, 1000.00, '2026-06-04', 'Espece', '2026-06-04 12:13:21', 8, 0),
(48, 41, 600.00, '2026-06-04', 'Espece', '2026-06-04 13:57:31', 7, 1),
(49, 41, 1000.00, '2026-06-05', 'Espece', '2026-06-04 14:00:35', 8, 1),
(50, 41, 2000.00, '2026-06-05', 'Espece', '2026-06-04 14:03:46', 7, 1),
(51, 40, 1000.00, '2026-06-04', 'Espece', '2026-06-04 14:05:38', 7, 0),
(52, 40, 1000.00, '2026-06-04', 'Espece', '2026-06-04 14:05:41', 7, 0);

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
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=MyISAM AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `login_time`, `logout_time`, `duration_minutes`) VALUES
(67, 7, '2026-06-04 13:54:56', NULL, NULL),
(66, 8, '2026-06-04 13:54:44', NULL, NULL);

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
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `can_add`, `can_edit`, `can_delete`, `last_active`) VALUES
(7, 'Admin User', 'admin@assurance.com', '$2b$10$lkKR2.Vd1sS56zY35EcDcuf624WQ4pcKm9HnrfspvONf7Uf6wK9X6', 'ADMIN', '2026-06-03 21:25:12', 1, 1, 1, '2026-06-04 14:08:35'),
(8, 'ahmed', 'ahmed@gmail.com', '$2a$12$PFsSkUGtHKf.SvU..NAVp.MsTB2kcXp3Lr.fp/puHGUWhm5A6GKZO', 'EMPLOYEE', '2026-06-03 21:26:13', 1, 1, 1, '2026-06-04 14:08:24');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
