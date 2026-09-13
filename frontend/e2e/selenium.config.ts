/**
 * Configuration Selenium pour les tests E2E
 */
export interface SeleniumConfig {
  baseUrl: string;
  browser: 'chrome' | 'firefox' | 'edge';
  headless: boolean;
  timeout: number;
  implicitWait: number;
  windowSize: {
    width: number;
    height: number;
  };
  seleniumGrid?: {
    url: string;
    platform?: string;
    browserVersion?: string;
  };
}

export const defaultConfig: SeleniumConfig = {
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:4200',
  browser: (process.env.E2E_BROWSER as 'chrome' | 'firefox' | 'edge') || 'chrome',
  headless: process.env.E2E_HEADLESS === 'true' || process.env.CI === 'true',
  timeout: 30000,
  implicitWait: 10000,
  windowSize: {
    width: 1920,
    height: 1080
  },
  // Selenium Grid désactivé par défaut (pas de Docker)
  seleniumGrid: undefined
};

