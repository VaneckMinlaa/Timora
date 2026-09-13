/**
 * Runner pour les tests E2E Selenium
 */
import * as fs from 'fs';
import * as path from 'path';
import { SeleniumSetup } from './setup';
import { defaultConfig } from './selenium.config';

// Importer tous les tests
import './tests/login.e2e';
import './tests/dashboard.e2e';
import './tests/user-management.e2e';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class E2ERunner {
  private results: TestResult[] = [];
  private isCI: boolean;

  constructor() {
    this.isCI = process.argv.includes('--ci') || process.env.CI === 'true';
  }

  async runTests(): Promise<void> {
    console.log('🚀 Démarrage des tests E2E avec Selenium...');
    console.log(`📍 URL de base: ${defaultConfig.baseUrl}`);
    console.log(`🌐 Navigateur: ${defaultConfig.browser}`);
    console.log(`👻 Mode headless: ${defaultConfig.headless}`);

    if (defaultConfig.seleniumGrid) {
      console.log(`🔗 Selenium Grid: ${defaultConfig.seleniumGrid.url}`);
    }

    try {
      // Vérifier que l'application est accessible
      await this.checkApplicationAvailability();

      // Exécuter les tests
      await this.executeTests();

      // Générer le rapport
      this.generateReport();

      // Afficher le résumé
      this.printSummary();
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution des tests:', error);
      process.exit(1);
    }
  }

  private async checkApplicationAvailability(): Promise<void> {
    const setup = new SeleniumSetup(defaultConfig);
    try {
      const driver = await setup.createDriver();
      await driver.get(defaultConfig.baseUrl);
      await driver.quit();
      console.log('✅ Application accessible');
    } catch (error) {
      console.error('❌ Application non accessible:', error);
      throw new Error('L\'application n\'est pas accessible. Assurez-vous qu\'elle est démarrée.');
    }
  }

  private async executeTests(): Promise<void> {
    // Cette méthode devrait être remplacée par un framework de test réel
    // Pour l'instant, c'est une structure de base
    console.log('📝 Exécution des tests...');
    
    // Les tests sont exécutés via Jest ou un autre framework
    // Cette méthode est appelée pour la configuration
  }

  private generateReport(): void {
    const reportDir = path.join(process.cwd(), 'e2e', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, `e2e-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📊 Rapport généré: ${reportPath}`);
  }

  private printSummary(): void {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    console.log('\n📊 Résumé des tests E2E:');
    console.log(`   Total: ${total}`);
    console.log(`   ✅ Réussis: ${passed}`);
    console.log(`   ❌ Échoués: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Tests échoués:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`   - ${r.name}: ${r.error}`);
        });
      process.exit(1);
    } else {
      console.log('\n✅ Tous les tests sont passés!');
      process.exit(0);
    }
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const runner = new E2ERunner();
  runner.runTests().catch(error => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
}

export { E2ERunner };

