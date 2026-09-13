# 🚀 FrontEnd_Timora - Quick Start Guide

**Durée:** 10 minutes pour avoir une app fonctionnelle  
**Prérequis:** Node.js 20+, npm 10+, Angular CLI 20+

---

## ⚡ 5 Étapes pour Démarrer

### Étape 1: Vérifier les Prérequis (1 min)

```bash
# Vérifier Node.js
node --version
# Doit être 20.x ou plus (actuellement: v20.11.0+)

# Vérifier npm
npm --version
# Doit être 10.x ou plus

# Vérifier Angular CLI
ng version
# Doit être 20.x
```

Si manquant:
```bash
# Installer Angular CLI (globalement)
npm install -g @angular/cli@latest
```

### Étape 2: Naviguer au Projet (1 min)

```bash
cd "d:\Cours\Projet Transversal ISI\Code Source\Timora\Timora\FrontEnd_Timora"
```

### Étape 3: Installer les Dépendances (3-4 min)

```bash
# Installer toutes les dépendances
npm install

# Ajouter Angular Material (optionnel pour Phase 2)
npm install @angular/material @angular/cdk
```

### Étape 4: Démarrer le Serveur (1 min)

```bash
# Avec proxy vers API Gateway
ng serve --proxy-config proxy.conf.json --open

# OU sans proxy (pour tester sans backend)
ng serve --open

# OU raccourci npm
npm start
```

**Résultat:** 
- ✅ Angular app ouvre automatiquement à `http://localhost:4200`
- ✅ Proxy configuré vers API Gateway `http://localhost:8080`
- ✅ Hot reload activé (rechargement auto lors de modifications)

### Étape 5: Vérifier la Connexion (2 min)

**Dans le navigateur:**

1. Ouvrez Console (F12)
2. Testez la connexion API Gateway:
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

**Résultat attendu:**
- ✅ Réponse du backend (token ou erreur 401)
- ✅ Proxy fonctionne
- ✅ API Gateway accessible

---

## 🎯 Commandes Essentielles

### Développement

```bash
# Démarrer avec proxy
ng serve --proxy-config proxy.conf.json --open

# Démarrer sur port personnalisé
ng serve --port 4300 --proxy-config proxy.conf.json --open

# Démarrer en production simulation
ng serve --configuration production
```

### Build

```bash
# Build pour production
ng build --configuration production

# Résultat dans dist/FrontEnd_Timora/
# À déployer avec Docker/Nginx
```

### Tests

```bash
# Tests unitaires
ng test

# Tests avec coverage
ng test --code-coverage

# Tests end-to-end
ng e2e
```

### Linting

```bash
# Vérifier code
ng lint

# Fixer automatiquement
ng lint --fix
```

### Génération

```bash
# Générer component
ng generate component features/auth/pages/login

# Générer service
ng generate service features/auth/services/auth

# Raccourcis
ng g c features/auth/pages/login
ng g s features/auth/services/auth
```

---

## 📁 Structure Créée

Fichiers et dossiers déjà prêts:

```
✅ src/app/core/
   ├── models/             (6 fichiers - Auth, Room, Reservation, Schedule, User, Notification)
   ├── services/           (6 fichiers - Auth, Room, Reservation, User, Schedule, Notification)
   ├── interceptors/       (1 fichier - ApiInterceptor avec JWT)
   └── guards/             (1 fichier - AuthGuard)

✅ app.config.ts          (Configuration avec HttpClient + Interceptor)
✅ app.routes.ts          (Routes complètes avec lazy loading)
✅ proxy.conf.json        (Proxy vers API Gateway)

📄 FRONTEND-ARCHITECTURE.md (Guide architecture 300+ lignes)
```

À créer:
```
❌ features/
   ├── auth/              (LoginComponent, RegisterComponent)
   ├── dashboard/         (DashboardComponent)
   ├── rooms/             (RoomList, RoomDetail)
   ├── reservations/      (ResList, CreateRes, ResDetail)
   ├── profile/           (ProfileComponent)
   └── admin/             (User, Room, Schedule management)

❌ shared/
   ├── components/        (Navbar, Sidebar, Footer, Layout)
   ├── directives/
   └── pipes/

❌ styles/                (Global styles, themes)
```

---

## 🔗 Intégration Backend

### Ports Microservices

```
├── API Gateway        : 8080
│   ├── Auth Service   : 8081
│   ├── User Service   : 8082
│   ├── Room Service   : 8083
│   ├── Reservation    : 8084
│   ├── Schedule       : 8085
│   ├── Notification   : 8086
│   ├── Reporting      : 8087
│   └── Integration    : 8088
├── Config Server      : 8888
└── Eureka            : 8761
```

### Démarrer le Backend

```bash
# Terminal 1: Naviguer au backend
cd "d:\Cours\Projet Transversal ISI\Code Source\Timora\Timora"

# Démarrer infrastructure (PostgreSQL, RabbitMQ)
docker-compose up -d

# Attendre 30 secondes, puis démarrer services
mvn clean install -DskipTests
mvn -pl timora-config-server spring-boot:run &
sleep 10
mvn -pl timora-eureka-server spring-boot:run &
sleep 10
mvn -pl timora-gateway spring-boot:run &
```

### Vérifier Backend

```bash
# Terminal 2: Tester accès
# Config Server
curl http://localhost:8888/timora-config-server/prod

# Eureka
open http://localhost:8761

# API Gateway
curl http://localhost:8080/actuator/health
```

---

## 🐛 Dépannage

### Port 4200 déjà utilisé

```bash
# Utiliser autre port
ng serve --port 4300 --open

# Ou tuer le processus
# Sur Windows:
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

### API Gateway non accessible

```bash
# Vérifier que le backend est lancé
curl http://localhost:8080/actuator/health

# Vérifier le proxy.conf.json
cat proxy.conf.json

# Redémarrer ng serve
# Fermer terminal et relancer
```

### Erreur "Cannot find module"

```bash
# Réinstaller dépendances
rm -r node_modules
npm install

# Clear Angular cache
ng cache clean
```

### Erreur TypeScript compilation

```bash
# Vérifier TypeScript
ng version

# Récompiler
ng build --watch

# Check errors
ng lint
```

---

## ✅ Checklist Démarrage

- [ ] Node.js 20+ installé
- [ ] npm 10+ installé
- [ ] Angular CLI 20+ installé
- [ ] Projet `FrontEnd_Timora` cloné/créé
- [ ] `npm install` terminé
- [ ] Backend en cours d'exécution (optionnel pour tester UI)
- [ ] `ng serve --proxy-config proxy.conf.json` lancé
- [ ] Navigateur ouvre `http://localhost:4200`
- [ ] Console du navigateur pas d'erreurs critiques
- [ ] Hot reload fonctionne (modifier un fichier = refresh automatique)

---

## 🎨 Première Composante à Créer

Vous êtes prêt pour créer la première composante: **LoginComponent**

```bash
# Générer le composant
ng g c features/auth/pages/login

# Fichiers générés:
# - login.component.ts
# - login.component.html
# - login.component.scss
# - login.component.spec.ts
```

### Structure basique LoginComponent:

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }
}
```

```html
<!-- login.component.html -->
<div class="login-container">
  <h1>Timora - Login</h1>
  <form (ngSubmit)="onLogin()">
    <input type="email" [(ngModel)]="email" name="email" placeholder="Email" required>
    <input type="password" [(ngModel)]="password" name="password" placeholder="Password" required>
    <button type="submit" [disabled]="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
  </form>
  <div *ngIf="error" class="error">{{ error }}</div>
</div>
```

---

## 📚 Prochaines Pages

1. **FRONTEND-ARCHITECTURE.md** - Architecture complète (déjà créée)
2. **Commencer Auth module** - LoginComponent + RegisterComponent
3. **Créer DashboardComponent** - Page d'accueil
4. **Implémenter RoomModule** - Liste et détail salles

---

## 💡 Tips & Tricks

### Hot Module Replacement (HMR)
```bash
# Démarrer avec HMR pour rechargement ultra-rapide
ng serve --hmr
```

### Debug Mode
```bash
# Garder source maps en production
ng serve --source-map
```

### Chrome DevTools
```bash
# Angular Devtools extension
# Install from Chrome Web Store: "Angular DevTools"
```

### Prettier Formatting
```bash
# Format code automatiquement
npx prettier --write "src/**/*.ts" "src/**/*.html"
```

---

## 🎯 Objectifs Semaine 1

- [ ] Login Component fonctionnel
- [ ] Register Component fonctionnel
- [ ] Dashboard Component basique
- [ ] Connexion API testée
- [ ] JWT token stocké/utilisé
- [ ] Guard de routes fonctionne
- [ ] Tests unitaires pour AuthService

---

## ❓ Questions Fréquentes

**Q: Où trouver les types TypeScript?**
A: Dans `src/app/core/models/index.ts` - tous les types importables

**Q: Comment appeler les services?**
A: Injecter dans constructor, ex: `constructor(private authService: AuthService)`

**Q: Comment tester les API?**
A: Avec Postman ou REST Client VS Code extension

**Q: Comment déboguer?**
A: Chrome DevTools (F12) → Sources tab → breakpoints

---

**Status:** ✅ Infrastructure prête | 🚀 Prêt à démarrer Phase 1

Voulez-vous que je crée les composants LoginComponent et RegisterComponent? 🎯

