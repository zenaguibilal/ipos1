# iPOS - Point de Vente Intelligent (Version Ultra-Clean)

**iPOS** est une application de point de vente (POS) avancée, fonctionnant entièrement dans le navigateur (Client-side) en utilisant la technologie **IndexedDB**. Ce projet a été entièrement épuré pour être idéal en termes de performance et de propreté du code.

## 🚀 Architecture Technique Finale

*   **Framework:** Next.js 14 (App Router)
*   **Base de Données:** IndexedDB (via Dexie.js) - 100% locale et sécurisée.
*   **Gestion d'état:** Zustand (avec persistance LocalStorage) pour les paniers et le profil.
*   **UI:** ShadCN UI & Tailwind CSS (Dark Mode premium).
*   **Offline-first:** L'application fonctionne totalement sans internet après le premier chargement.

## 📁 Structure du Projet

- `src/app/`: Routes et pages (Tableau de bord, Vente, Produits, Clients...).
- `src/services/`: Logique métier isolée (Ventes, Stocks, Clients, Dépenses, Pain).
- `src/lib/db.ts`: Définition de la base de données locale.
- `src/stores/`: Gestion de l'état global (App Store, Cart Store).
- `src/components/`: Composants UI organisés.

## ✨ Fonctionnalités Principales Stables

1.  **Système de Vente Rapide:** Support multi-paniers, vérification de stock en temps réel et ajout d'articles personnalisés.
2.  **Gestion de Stock Avancée:** Suivi précis des mouvements (Logs d'inventaire) et alertes d'expiration.
3.  **Dettes et Clients:** Historique complet pour chaque client avec relevés de compte professionnels imprimables.
4.  **Système de Pain:** Gestion unique des commandes quotidiennes récurrentes avec conversion en ventes en un clic.
5.  **Sécurité et Sauvegarde:** Système d'exportation et d'importation manuelle des données pour garantir la pleine propriété de vos informations.

## 🗑️ Nettoyage Appliqué
Toutes les dépendances inutilisées ont été supprimées, et les styles ou animations superflus ont été élagués pour garantir un temps de réponse ultra-rapide. Le projet est désormais exempt de "code mort".
