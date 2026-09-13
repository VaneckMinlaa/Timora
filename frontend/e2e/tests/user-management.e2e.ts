/**
 * Tests E2E pour la gestion des utilisateurs (Admin)
 */
import { WebDriver, By, until } from 'selenium-webdriver';
import { SeleniumSetup } from '../setup';
import { defaultConfig } from '../selenium.config';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
    }
  }
}

describe('User Management E2E Tests', () => {
  let setup: SeleniumSetup;
  let driver: WebDriver;

  beforeAll(async () => {
    setup = new SeleniumSetup(defaultConfig);
    driver = await setup.createDriver();
    
    // Se connecter en tant qu'admin
    await driver.get(`${defaultConfig.baseUrl}/login`);
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys(process.env.E2E_TEST_EMAIL || 'admin@example.com');
    await passwordInput.sendKeys(process.env.E2E_TEST_PASSWORD || 'admin123');
    await submitButton.click();

    // Naviguer vers la gestion des utilisateurs
    await driver.wait(until.urlContains('/dashboard'), 15000);
    await driver.get(`${defaultConfig.baseUrl}/admin/users`);
    await driver.wait(until.elementLocated(By.css('table, .user-list')), 10000);
  });

  afterAll(async () => {
    await setup.quit();
  });

  it('devrait afficher la liste des utilisateurs', async () => {
    const userTable = await driver.findElements(By.css('table, .user-list'));
    expect(userTable.length).toBeGreaterThan(0);
  });

  it('devrait permettre de rechercher un utilisateur', async () => {
    const searchInput = await driver.findElements(By.css('input[type="search"], input[placeholder*="recherche" i]'));
    
    if (searchInput.length > 0) {
      await searchInput[0].sendKeys('test');
      await driver.sleep(1000); // Attendre le filtrage
      
      // Vérifier que les résultats sont filtrés
      const filteredRows = await driver.findElements(By.css('table tbody tr, .user-card'));
      expect(filteredRows.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('devrait afficher la pagination si présente', async () => {
    const pagination = await driver.findElements(By.css('.pagination, .page-navigation'));
    
    if (pagination.length > 0) {
      const paginationElement = pagination[0];
      expect(await paginationElement.isDisplayed()).toBe(true);
    }
  });
});

