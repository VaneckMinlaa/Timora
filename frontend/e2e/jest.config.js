/**
 * Configuration Jest pour les tests E2E Selenium
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.e2e.ts'],
  collectCoverageFrom: [
    'tests/**/*.ts',
    '!tests/**/*.spec.ts',
    '!tests/**/*.e2e.ts'
  ],
  coverageDirectory: 'coverage/e2e',
  testTimeout: 60000,
  maxWorkers: 1, // Exécuter les tests séquentiellement pour éviter les conflits
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
  bail: false
};

