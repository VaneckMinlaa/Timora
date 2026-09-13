/**
 * Tests E2E pour la page de connexion
 */
import { WebDriver, By, until } from 'selenium-webdriver';
import { SeleniumSetup } from '../setup';
import { defaultConfig } from '../selenium.config';

// Extensions Jest pour les assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toContain(expected: string): R;
      toBeGreaterThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
    }
  }
}

describe('Login Page E2E Tests', () => {
  let setup: SeleniumSetup;
  let driver: WebDriver;

  beforeAll(async () => {
    setup = new SeleniumSetup(defaultConfig);
    driver = await setup.createDriver();
  });

  afterAll(async () => {
    await setup.quit();
  });

  beforeEach(async () => {
    await driver.get(`${defaultConfig.baseUrl}/login`);
    await driver.wait(until.elementLocated(By.css('form')), 10000);
  });

  it('devrait afficher le formulaire de connexion', async () => {
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    expect(await emailInput.isDisplayed()).toBe(true);
    expect(await passwordInput.isDisplayed()).toBe(true);
    expect(await submitButton.isDisplayed()).toBe(true);
  });

  it('devrait afficher une erreur pour un email invalide', async () => {
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys('email-invalide');
    await passwordInput.sendKeys('password123');
    await submitButton.click();

    // Attendre l'affichage du message d'erreur
    await driver.wait(until.elementLocated(By.css('.error-message, .alert-danger')), 5000);
    const errorMessage = await driver.findElement(By.css('.error-message, .alert-danger'));
    expect(await errorMessage.isDisplayed()).toBe(true);
  });

  it('devrait afficher une erreur pour des identifiants incorrects', async () => {
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    await emailInput.sendKeys('test@example.com');
    await passwordInput.sendKeys('wrongpassword');
    await submitButton.click();

    // Attendre l'affichage du message d'erreur
    await driver.wait(until.elementLocated(By.css('.error-message, .alert-danger')), 10000);
    const errorMessage = await driver.findElement(By.css('.error-message, .alert-danger'));
    expect(await errorMessage.isDisplayed()).toBe(true);
  });

  it('devrait rediriger vers le dashboard après une connexion réussie', async () => {
    const emailInput = await driver.findElement(By.css('input[type="email"]'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    const submitButton = await driver.findElement(By.css('button[type="submit"]'));

    // Utiliser des identifiants de test valides (à adapter selon votre configuration)
    await emailInput.sendKeys(process.env.E2E_TEST_EMAIL || 'admin@example.com');
    await passwordInput.sendKeys(process.env.E2E_TEST_PASSWORD || 'admin123');
    await submitButton.click();

    // Attendre la redirection vers le dashboard
    await driver.wait(until.urlContains('/dashboard'), 15000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/dashboard');
  });

  it('devrait avoir un lien vers la page "Mot de passe oublié"', async () => {
    const forgotPasswordLink = await driver.findElement(By.partialLinkText('Mot de passe oublié'));
    expect(await forgotPasswordLink.isDisplayed()).toBe(true);
    
    await forgotPasswordLink.click();
    await driver.wait(until.urlContains('/forgot-password'), 5000);
    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain('/forgot-password');
  });
});

