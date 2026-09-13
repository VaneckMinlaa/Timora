# Polices Locales - Instructions de Téléchargement

Pour que les polices fonctionnent en mode hors ligne, vous devez télécharger les fichiers de polices.

## 1. Police Inter

Téléchargez les fichiers de la police Inter depuis :
https://fonts.google.com/specimen/Inter

Ou directement depuis :
https://github.com/rsms/inter/releases

**Fichiers nécessaires** (à placer dans `frontend/src/assets/fonts/inter/`):
- Inter-Regular.woff2
- Inter-Medium.woff2
- Inter-SemiBold.woff2
- Inter-Bold.woff2
- Inter-ExtraBold.woff2
- Inter-Black.woff2

**Alternative rapide** (via npm) :
```bash
cd frontend
npm install @fontsource/inter
```
Puis copiez les fichiers depuis `node_modules/@fontsource/inter/files/` vers `src/assets/fonts/inter/`

## 2. Material Symbols Outlined

Téléchargez depuis :
https://fonts.google.com/icons

Ou utilisez le CDN pour télécharger :
https://fonts.gstatic.com/s/materialsymbolsoutlined/v227/gNNBW2J8Roq16WD5xFObUd5v1inJw0xHZbdgOq0HrmUd3dkA.ttf

**Fichier nécessaire** (à placer dans `frontend/src/assets/fonts/material-symbols/`):
- MaterialSymbolsOutlined.woff2

**Alternative rapide** :
```bash
cd frontend
npm install material-symbols
```
Puis copiez le fichier depuis `node_modules/material-symbols/` vers `src/assets/fonts/material-symbols/`

## Script de téléchargement automatique

Vous pouvez créer un script pour télécharger automatiquement ces fichiers.

