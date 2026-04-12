# 📦 iPOS Zen — Guide de Build Complet

## Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | >= 18.0.0 | `node --version` |
| npm | >= 9.0.0 | `npm --version` |
| Git | >= 2.x | `git --version` |

---

## 1. Installation

```bash
# Cloner ou extraire le projet
cd ipos-zen

# Installer toutes les dépendances (y compris Electron)
npm install
```

---

## 2. Développement Web (Next.js seul)

```bash
npm run dev
# → http://localhost:3000
```

---

## 3. Développement Desktop (Electron + Next.js)

```bash
npm run electron:dev
```

Cela lance en parallèle :
- `next dev` sur le port 3000
- `electron .` qui attend que Next.js soit prêt puis ouvre la fenêtre

---

## 4. Build Production Web (PWA)

```bash
npm run build
# Génère : out/   (export statique Next.js)
```

Pour tester le build statique localement :
```bash
npx serve out
```

---

## 5. Build Desktop — Windows (.exe)

```bash
npm run electron:win
# Résultat : dist/iPOS-Zen-Setup-1.0.0.exe
```

> **Remarque :** La compilation Windows peut se faire depuis Linux/macOS
> si `wine` est installé, sinon lancez cette commande depuis Windows.

---

## 6. Build Desktop — Linux (.AppImage)

```bash
npm run electron:linux
# Résultat : dist/iPOS-Zen-1.0.0.AppImage
```

Pour rendre l'AppImage exécutable :
```bash
chmod +x dist/iPOS-Zen-1.0.0.AppImage
./dist/iPOS-Zen-1.0.0.AppImage
```

---

## 7. Build Desktop — macOS (.dmg)

```bash
npm run electron:mac
# Résultat : dist/iPOS-Zen-1.0.0.dmg
```

> **Remarque :** La compilation macOS nécessite macOS + Xcode Command Line Tools.

---

## 8. Vérification de qualité avant livraison

```bash
# Vérifier les erreurs TypeScript
npm run typecheck

# Vérifier le linting ESLint
npm run lint

# Build complet
npm run build
```

---

## 9. Structure des icônes requises

Avant de builder, assurez-vous que ces fichiers existent :

```
public/
├── icon.png          ← 512×512 PNG (Electron Linux)
├── icon.ico          ← ICO multi-résolutions (Electron Windows)
├── icon.icns         ← ICNS (Electron macOS)
└── icons/
    ├── icon-192x192.png  ← PWA Android
    └── icon-512x512.png  ← PWA splash screen
```

### Générer icon.ico depuis icon.png (Linux/macOS)
```bash
# Via ImageMagick
convert icon.png -resize 256x256 icon.ico

# Ou via npx
npx electron-icon-maker --input=public/icon.png --output=public/
```

---

## 10. Configuration Supabase (optionnel)

Supabase est **entièrement optionnel**. L'application fonctionne
100% hors-ligne sans aucune configuration cloud.

Pour activer la synchronisation cloud :

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter le script SQL suivant dans l'éditeur SQL Supabase :

```sql
-- Désactiver RLS pour toutes les tables iPOS
ALTER TABLE company_profile   DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE products          DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_intakes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales             DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns   DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments          DISABLE ROW LEVEL SECURITY;
ALTER TABLE bread_orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs    DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments DISABLE ROW LEVEL SECURITY;
```

3. Dans l'application → **Profil** → coller l'URL et la clé Supabase
4. Dans **Paramètres** → tester la connexion

---

## 11. AutoPrint thermique 80mm

Pour activer l'impression automatique après chaque vente :

1. Brancher l'imprimante thermique 80mm (USB ou réseau)
2. La définir comme imprimante par défaut du système
3. Dans iPOS → **Paramètres** → activer le toggle **AutoPrint thermique**

L'impression se déclenche automatiquement à chaque vente confirmée
sans ouvrir de boîte de dialogue.

---

## 12. Variables d'environnement (optionnel)

Créer `.env.local` à la racine si nécessaire :

```env
# Aucune variable requise par défaut
# L'app est 100% client-side
```

---

## 13. Résolution des problèmes fréquents

### `npm run electron:dev` ne démarre pas
```bash
# S'assurer que electron est installé
npm install electron --save-dev

# Vérifier que le port 3000 est libre
lsof -ti:3000 | xargs kill -9
```

### Build Windows échoue sur Linux
```bash
# Installer wine
sudo apt-get install wine64

# Ou utiliser Docker
docker run --rm -v $(pwd):/project electronuserland/builder:wine \
  sh -c "cd /project && npm run electron:win"
```

### Erreur `useSearchParams` au build
Tous les composants utilisant `useSearchParams` doivent être
enveloppés dans `<Suspense>`. Vérifier les pages concernées.

### IndexedDB vide après reload en Electron
C'est normal en mode `electron:dev` si `next dev` recrée la base.
En production (`electron:build`), les données persistent.

---

## 14. Arborescence finale du projet

```
ipos-zen/
├── electron/
│   ├── main.js          ← Process principal Electron
│   └── preload.js       ← Bridge context isolation
├── public/
│   ├── icon.png / .ico / .icns
│   ├── manifest.json    ← PWA manifest (icônes PNG)
│   ├── offline.html
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src/
│   ├── app/             ← Pages Next.js (App Router)
│   ├── components/      ← Composants React
│   ├── hooks/           ← Hooks personnalisés
│   ├── lib/             ← Types, utils, DB config
│   ├── services/        ← Logique métier (Dexie)
│   └── stores/          ← État global (Zustand)
├── next.config.js       ← output: export, unoptimized
├── package.json         ← Scripts Electron + electron-builder
├── tailwind.config.ts
└── tsconfig.json
```

---

## 15. Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| Next.js | 14.x | Framework React (App Router) |
| TypeScript | 5.x | Typage statique |
| Dexie.js | 3.x | IndexedDB (stockage local) |
| Zustand | 4.x | État global |
| ShadCN UI | latest | Composants UI |
| Tailwind CSS | 3.x | Styles utilitaires |
| Supabase JS | 2.x | Sync cloud (optionnel) |
| Electron | 30.x | Application desktop |
| electron-builder | 24.x | Packaging multi-plateforme |
| QRCode | 1.x | Génération QR sur les reçus |

---

*iPOS Zen v1.0.0 — Build Stable*
