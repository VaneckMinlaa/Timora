/**
 * Configuration et setup Selenium WebDriver
 */
import { Builder, WebDriver, Capabilities, Browser } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
import * as edge from 'selenium-webdriver/edge';
import { defaultConfig, SeleniumConfig } from './selenium.config';

export class SeleniumSetup {
  private driver: WebDriver | null = null;
  private config: SeleniumConfig;

  constructor(config: SeleniumConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Crée une instance de WebDriver selon la configuration
   */
  async createDriver(): Promise<WebDriver> {
    if (this.config.seleniumGrid) {
      return this.createGridDriver();
    } else {
      return this.createLocalDriver();
    }
  }

  /**
   * Crée un driver local (Chrome, Firefox, Edge)
   */
  private async createLocalDriver(): Promise<WebDriver> {
    const builder = new Builder();

    switch (this.config.browser) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        if (this.config.headless) {
          chromeOptions.addArguments('--headless');
        }
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments(`--window-size=${this.config.windowSize.width},${this.config.windowSize.height}`);
        builder.forBrowser(Browser.CHROME).setChromeOptions(chromeOptions);
        break;

      case 'firefox':
        const firefoxOptions = new firefox.Options();
        if (this.config.headless) {
          firefoxOptions.addArguments('--headless');
        }
        builder.forBrowser(Browser.FIREFOX).setFirefoxOptions(firefoxOptions);
        break;

      case 'edge':
        const edgeOptions = new edge.Options();
        if (this.config.headless) {
          edgeOptions.addArguments('--headless');
        }
        builder.forBrowser(Browser.EDGE).setEdgeOptions(edgeOptions);
        break;
    }

    this.driver = await builder.build();
    await this.driver.manage().window().setRect({
      width: this.config.windowSize.width,
      height: this.config.windowSize.height
    });
    await this.driver.manage().setTimeouts({
      implicit: this.config.implicitWait,
      pageLoad: this.config.timeout,
      script: this.config.timeout
    });

    return this.driver;
  }

  /**
   * Crée un driver pour Selenium Grid
   */
  private async createGridDriver(): Promise<WebDriver> {
    if (!this.config.seleniumGrid) {
      throw new Error('Selenium Grid configuration is missing');
    }

    const capabilities = new Capabilities();
    capabilities.setBrowserName(this.config.browser);
    
    if (this.config.seleniumGrid.platform) {
      capabilities.setPlatform(this.config.seleniumGrid.platform);
    }
    
    if (this.config.seleniumGrid.browserVersion) {
      capabilities.setBrowserVersion(this.config.seleniumGrid.browserVersion);
    }

    const chromeOptions = new chrome.Options();
    if (this.config.headless) {
      chromeOptions.addArguments('--headless');
    }
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    capabilities.merge(chromeOptions);

    this.driver = await new Builder()
      .usingServer(this.config.seleniumGrid.url)
      .withCapabilities(capabilities)
      .build();

    await this.driver.manage().window().setRect({
      width: this.config.windowSize.width,
      height: this.config.windowSize.height
    });

    return this.driver;
  }

  /**
   * Ferme le driver
   */
  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  /**
   * Obtient le driver actuel
   */
  getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call createDriver() first.');
    }
    return this.driver;
  }
}

