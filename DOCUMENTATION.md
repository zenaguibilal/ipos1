# iPOS - Point de Vente Intelligent

**iPOS** est une application de point de vente (POS) complète, conçue pour la vente au détail et simplifiée pour une utilisation en mode mono-poste. Elle utilise IndexedDB, une base de données intégrée à votre navigateur, pour un stockage de données local, rapide et privé. L'application est une Progressive Web App (PWA), ce qui signifie qu'elle est installable, rapide et peut fonctionner hors ligne.

## 🚀 Pile Technique

*   **Framework :** Next.js avec App Router
*   **Bibliothèque UI :** React
*   **Composants :** ShadCN UI
*   **Style :** Tailwind CSS
*   **Base de Données :** IndexedDB (stockage local dans le navigateur via Dexie.js)
*   **Gestion d'état :** Zustand
*   **Langage :** TypeScript
*   **PWA :** Service Worker pour la mise en cache et le support hors ligne.

## ✨ Fonctionnalités

L'application iPOS est dotée d'un ensemble riche de fonctionnalités pour répondre aux besoins de la plupart des commerces de détail.

### Historique des Ventes
- Consultation de l'historique des ventes.
- Annulation complète des ventes avec restauration automatique du stock et des soldes clients.

### Gestion des Produits
- CRUD complet pour les produits.
- Suivi des quantités en stock, prix d'achat et de vente.
- Définition de niveaux de stock minimum avec alertes visuelles.
- Gestion des codes-barres multiples.
- Organisation par catégories et par fournisseurs.
- Impression d'étiquettes avec codes-barres.
- Importation en masse de produits via un fichier CSV.

### Gestion des Clients
- CRUD complet pour les clients.
- Suivi détaillé des dettes et de l'historique des paiements.
- Définition de limites de crédit et de délais de paiement.
- Alertes visuelles pour les retards de paiement et les dépassements de limite.
- Consultation de l'historique complet d'activité d'un client (ventes, paiements, retours).
- Impression de relevés de compte détaillés.
- Importation en masse de clients via un fichier CSV.

### Gestion des Stocks
- Enregistrement des réceptions de stock (entrées de marchandises).
- Association des réceptions à des fournisseurs (existants ou nouveaux).
- Mise à jour automatique des quantités en stock.

### Retours
- Enregistrement des retours de produits basés sur une vente existante.
- Option de réintégration des articles retournés au stock.

### Finances et Rapports
- **Gestion des Dépenses :** Suivi et catégorisation de toutes les charges de l'entreprise.

### Commandes Spécifiques
- **Gestion du Pain :** Module dédié à la gestion des commandes de pain récurrentes ou manuelles, avec conversion facile en ventes.

### Administration et Données
- **Profil de l'Entreprise :** Personnalisation des informations de l'entreprise pour les reçus et documents.
- **Sauvegarde et Restauration :** Exportation de l'intégralité de la base de données locale dans un fichier JSON, et restauration à partir de ce fichier.
