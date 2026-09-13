/**
 * Script pour télécharger les polices Google Fonts localement
 * Exécutez avec: node scripts/download-fonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../src/assets/fonts');

// Créer les dossiers si nécessaire
const interDir = path.join(fontsDir, 'inter');
const materialDir = path.join(fontsDir, 'material-symbols');

[fontsDir, interDir, materialDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Créé le dossier: ${dir}`);
  }
});

// URLs des polices Inter (depuis Google Fonts API)
const interFonts = {
  'Inter-Regular.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
  'Inter-Medium.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA-Ek-_EeA.woff2',
  'Inter-SemiBold.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiB-Ek-_EeA.woff2',
  'Inter-Bold.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiC-Ek-_EeA.woff2',
  'Inter-ExtraBold.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiD-Ek-_EeA.woff2',
  'Inter-Black.woff2': 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiE-Ek-_EeA.woff2'
};

// URL Material Symbols
const materialSymbolsUrl = 'https://fonts.gstatic.com/s/materialsymbolsoutlined/v227/gNNBW2J8Roq16WD5xFObUd5v1inJw0xHZbdgOq0HrmUd3dkA.woff2';

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Téléchargé: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Redirection
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Erreur ${response.statusCode} pour ${url}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadFonts() {
  console.log('📥 Téléchargement des polices...\n');

  // Télécharger les polices Inter
  console.log('Téléchargement de la police Inter...');
  for (const [filename, url] of Object.entries(interFonts)) {
    const filepath = path.join(interDir, filename);
    try {
      await downloadFile(url, filepath);
    } catch (error) {
      console.error(`✗ Erreur pour ${filename}:`, error.message);
    }
  }

  // Télécharger Material Symbols
  console.log('\nTéléchargement de Material Symbols...');
  const materialPath = path.join(materialDir, 'MaterialSymbolsOutlined.woff2');
  try {
    await downloadFile(materialSymbolsUrl, materialPath);
  } catch (error) {
    console.error('✗ Erreur pour Material Symbols:', error.message);
  }

  console.log('\n✅ Téléchargement terminé!');
  console.log('\nNote: Les URLs peuvent changer. Si le téléchargement échoue,');
  console.log('téléchargez manuellement depuis https://fonts.google.com/');
}

downloadFonts().catch(console.error);

