/**
 * Tests E2E pour le dashboard
 */
import { WebDriver, By, until } from 'selenium-webdriver';
import { SeleniumSetup } from '../setup';
import { defaultConfig } from '../selenium.config';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toContain(expected: string): R;
      toBeGreaterThan(expected: number): R;
    }
  }
}

describe('Dashboard E2E Tests', () => {
  let setup: SeleniumSetup;
  let driver: WebDriver;

  beforeAll(async () => {
    setup = new SeleniumSetup(defaultConfig);
    driver = await setup.createDriver();
    
    // Se connecter d'abord
    await driver.get(`${defaultConfig.baseUrl}/login`);
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys(process.env.E2E_TEST_EMAIL || 'admin@example.com');
    await passwordInput.sendKeys(process.env.E2E_TEST_PASSWORD || 'admin123');
    await submitButton.click();

    // Attendre la redirection vers le dashboard
    await driver.wait(until.urlContains('/dashboard'), 15000);
  });

  afterAll(async () => {
    await setup.quit();
  });

  it('devrait afficher le dashboard après connexion', async () => {
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/dashboard');
  });

  it('devrait afficher les éléments principaux du dashboard', async () => {
    // Attendre que le contenu soit chargé
    await driver.wait(until.elementLocated(By.css('app-dashboard, .dashboard-container')), 10000);
    
    // Vérifier la présence d'éléments communs du dashboard
    const dashboardElements = await driver.findElements(By.css('.dashboard-container, .stats-card, .dashboard-header'));
    expect(dashboardElements.length).toBeGreaterThan(0);
  });

  it('devrait avoir une navigation fonctionnelle', async () => {
    // Chercher les liens de navigation (sidebar ou navbar)
    const navLinks = await driver.findElements(By.css('nav a, .sidebar a, .navbar a'));
    
    if (navLinks.length > 0) {
      const firstLink = navLinks[0];
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});

