# Tests E2E avec Selenium

Ce dossier contient les tests end-to-end (E2E) utilisant Selenium WebDriver pour tester l'application Angular.

## Structure

```
e2e/
├── selenium.config.ts      # Configuration Selenium
├── setup.ts                # Setup et création du WebDriver
├── runner.ts               # Runner pour exécuter les tests
├── jest.config.js          # Configuration Jest pour les tests E2E
├── jest.setup.ts           # Setup global Jest
├── tests/                  # Tests E2E
│   ├── login.e2e.ts
│   ├── dashboard.e2e.ts
│   └── user-management.e2e.ts
└── reports/                # Rapports de tests (générés)
```

## Installation

```bash
cd frontend
npm install
```

## Configuration

Les variables d'environnement suivantes peuvent être configurées :

- `E2E_BASE_URL` : URL de base de l'application (défaut: http://localhost:4200)
- `E2E_BROWSER` : Navigateur à utiliser (chrome, firefox, edge)
- `E2E_HEADLESS` : Mode headless (true/false)
- `SELENIUM_GRID_URL` : URL du Selenium Grid (optionnel)
- `E2E_TEST_EMAIL` : Email pour les tests de connexion
- `E2E_TEST_PASSWORD` : Mot de passe pour les tests de connexion

## Exécution des tests

### Localement

1. Démarrer l'application :
```bash
npm start
```

2. Dans un autre terminal, exécuter les tests :
```bash
npm run test:e2e
```

### Avec Selenium Grid

1. Démarrer Selenium Grid (via Docker) :
```bash
docker-compose -f docker-compose.selenium.yml up -d
```

2. Configurer les variables d'environnement :
```bash
export SELENIUM_GRID_URL=http://localhost:4444/wd/hub
export E2E_BASE_URL=http://localhost:4200
npm run test:e2e
```

### En mode CI/CD

Les tests sont automatiquement exécutés dans la pipeline GitHub Actions lors des commits et pull requests.

## Écrire de nouveaux tests

1. Créer un nouveau fichier dans `e2e/tests/` :
```typescript
import { WebDriver, By, until } from 'selenium-webdriver';
import { SeleniumSetup } from '../setup';
import { defaultConfig } from '../selenium.config';

describe('Mon Test E2E', () => {
  let setup: SeleniumSetup;
  let driver: WebDriver;

  beforeAll(async () => {
    setup = new SeleniumSetup(defaultConfig);
    driver = await setup.createDriver();
  });

  afterAll(async () => {
    await setup.quit();
  });

  it('devrait faire quelque chose', async () => {
    await driver.get(`${defaultConfig.baseUrl}/ma-page`);
    // Votre test ici
  });
});
```

2. Importer le test dans `runner.ts`

## Bonnes pratiques

- Utiliser des sélecteurs CSS stables et spécifiques
- Attendre explicitement les éléments avec `until.elementLocated()`
- Prendre des captures d'écran en cas d'échec
- Nettoyer les données de test après chaque test
- Utiliser des timeouts appropriés

## Dépannage

### L'application n'est pas accessible
- Vérifier que l'application est démarrée sur le port configuré
- Vérifier les variables d'environnement `E2E_BASE_URL`

### Les tests échouent de manière aléatoire
- Augmenter les timeouts dans `selenium.config.ts`
- Vérifier la stabilité des sélecteurs CSS
- Utiliser des attentes explicites au lieu de `sleep()`

### Problèmes avec Selenium Grid
- Vérifier que le Grid est démarré et accessible
- Vérifier la configuration des capabilities
- Consulter les logs du Grid

