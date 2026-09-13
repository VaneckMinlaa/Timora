/**
 * Configuration globale Jest pour les tests E2E
 */

// Augmenter le timeout par défaut
jest.setTimeout(60000);

// Configuration globale avant tous les tests
beforeAll(() => {
  console.log('🧪 Configuration des tests E2E...');
});

// Nettoyage après tous les tests
afterAll(() => {
  console.log('🧹 Nettoyage après les tests E2E...');
});

