# 📱 FrontEnd_Timora - Architecture & Implémentation

**Version:** 1.0.0  
**Date:** 13 Novembre 2025  
**Framework:** Angular 20 LTS  
**TypeScript:** 5.9+  
**Status:** Infrastructure créée ✅ | Composants en cours...

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Modèles de données](#modèles-de-données)
4. [Services](#services)
5. [Guards & Interceptors](#guards--interceptors)
6. [Routes](#routes)
7. [Composants à implémenter](#composants-à-implémenter)
8. [Commandes](#commandes)
9. [Checklist d'implémentation](#checklist-dimplémentation)

---

## 🎯 Vue d'ensemble

### Infrastructure Créée

✅ **Modèles de données** (6 fichiers)
- `core/models/auth.model.ts` - Authentification JWT
- `core/models/room.model.ts` - Gestion des salles
- `core/models/reservation.model.ts` - Réservations
- `core/models/schedule.model.ts` - Horaires
- `core/models/user.model.ts` - Utilisateurs
- `core/models/notification.model.ts` - Notifications

✅ **Services** (6 fichiers + index)
- `core/services/auth.service.ts` - JWT auth, token refresh
- `core/services/room.service.ts` - CRUD rooms
- `core/services/reservation.service.ts` - Gestion réservations
- `core/services/user.service.ts` - Gestion utilisateurs
- `core/services/schedule.service.ts` - Gestion horaires
- `core/services/notification.service.ts` - Notifications

✅ **Interceptors & Guards** (2 fichiers)
- `core/interceptors/api.interceptor.ts` - Ajoute Bearer token, gère refresh 401
- `core/guards/auth.guard.ts` - Protège routes, vérifie rôles

✅ **Configuration**
- `app.config.ts` - Intègre HttpClient + Interceptor
- `app.routes.ts` - Routes avec lazy loading complet

### Architecture

```
FrontEnd_Timora/
├── src/
│   ├── app/
│   │   ├── core/                          # CRÉÉ ✅
│   │   │   ├── models/
│   │   │   │   ├── auth.model.ts
│   │   │   │   ├── room.model.ts
│   │   │   │   ├── reservation.model.ts
│   │   │   │   ├── schedule.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── notification.model.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── room.service.ts
│   │   │   │   ├── reservation.service.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── schedule.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── index.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── api.interceptor.ts
│   │   │   │   └── index.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── features/                      # À CRÉER
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── login.component.ts
│   │   │   │   │   │   ├── login.component.html
│   │   │   │   │   │   └── login.component.scss
│   │   │   │   │   └── register/
│   │   │   │   │       ├── register.component.ts
│   │   │   │   │       ├── register.component.html
│   │   │   │   │       └── register.component.scss
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts (*)
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   │   └── dashboard/
│   │   │   │   │       ├── dashboard.component.ts
│   │   │   │   │       ├── dashboard.component.html
│   │   │   │   │       └── dashboard.component.scss
│   │   │   │   └── components/
│   │   │   │       ├── stats-card/
│   │   │   │       └── recent-reservations/
│   │   │   ├── rooms/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── room-list/
│   │   │   │   │   │   ├── room-list.component.ts
│   │   │   │   │   │   ├── room-list.component.html
│   │   │   │   │   │   └── room-list.component.scss
│   │   │   │   │   └── room-detail/
│   │   │   │   │       ├── room-detail.component.ts
│   │   │   │   │       ├── room-detail.component.html
│   │   │   │   │       └── room-detail.component.scss
│   │   │   │   ├── components/
│   │   │   │   │   └── room-card/
│   │   │   │   └── services/
│   │   │   │       └── room.service.ts (*)
│   │   │   ├── reservations/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── reservation-list/
│   │   │   │   │   ├── create-reservation/
│   │   │   │   │   └── reservation-detail/
│   │   │   │   ├── components/
│   │   │   │   │   └── reservation-form/
│   │   │   │   └── services/
│   │   │   │       └── reservation.service.ts (*)
│   │   │   ├── profile/
│   │   │   │   ├── pages/
│   │   │   │   │   └── profile/
│   │   │   │   └── components/
│   │   │   │       └── profile-form/
│   │   │   └── admin/
│   │   │       ├── pages/
│   │   │       │   ├── user-management/
│   │   │       │   ├── room-management/
│   │   │       │   ├── schedule-management/
│   │   │       │   └── reports/
│   │   │       └── components/
│   │   │           └── data-tables/
│   │   ├── shared/                        # À CRÉER
│   │   │   ├── components/
│   │   │   │   ├── navbar/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── footer/
│   │   │   │   └── layout/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   ├── app.routes.ts
│   │   ├── app.config.ts
│   │   └── app.ts
│   └── styles.scss
├── package.json
├── tsconfig.json
└── angular.json

(*) = Services importés depuis core/services
```

---

## 🏗️ Architecture

### Flux d'authentification

```
┌─────────────────────────────────────────┐
│         Angular App (4200)              │
├─────────────────────────────────────────┤
│                                         │
│  LoginComponent                         │
│       ↓                                 │
│  AuthService.login(credentials)         │
│       ↓                                 │
│  HTTP POST /api/auth/login              │
│  (via ApiInterceptor - add token)       │
│       ↓                                 │
└──────────┬──────────────────────────────┘
           │
           ↓ (API Gateway Port 8080)
┌──────────────────────────────────────────┐
│    API Gateway (Spring Cloud)            │
│    (Route vers Auth Service :8081)       │
├──────────────────────────────────────────┤
│                                          │
│  Auth Service (:8081)                    │
│  POST /login                             │
│  → Génère JWT token                      │
│  → Retourne token + refreshToken         │
│                                          │
└──────────────────────────────────────────┘
```

### JWT Token Refresh Flow

```
Request avec Token expiré
        ↓
ApiInterceptor (capture 401)
        ↓
AuthService.refreshToken()
POST /api/auth/refresh {refreshToken}
        ↓
Backend valide refresh token
        ↓
Retourne nouveau token
        ↓
Stock nouveau token
        ↓
Replay requête originale avec nouveau token
        ↓
Succès ✅
```

### Protection des Routes

```
Route 'dashboard' → @CanActivate [authGuard]
        ↓
AuthGuard.canActivate(route, state)
        ↓
authService.isAuthenticated() ? 
        ├─ YES → Vérifier rôle (optionnel)
        │          user.role === route.data.role ?
        │               ├─ YES → Autoriser ✅
        │               └─ NO → Rediriger '/' ❌
        └─ NO → Rediriger '/login' ❌
```

---

## 📦 Modèles de Données

### AuthUser
```typescript
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}
```

### Room
```typescript
interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  location: string;
  amenities: string[];
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Reservation
```typescript
interface Reservation {
  id: string;
  roomId: string;
  userId: string;
  startDateTime: string;
  endDateTime: string;
  purpose: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  numberOfParticipants: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Autres modèles
- `Schedule`, `User`, `UserProfile`, `Notification` (voir fichiers .model.ts)

---

## 🔧 Services

Tous les services sont prêts dans `src/app/core/services/`

### AuthService (Port 8081)
- `login(credentials)` → Observable<LoginResponse>
- `register(data)` → Observable<RegisterResponse>
- `refreshToken()` → Observable<LoginResponse>
- `logout()` → void
- `isAuthenticated()` → boolean
- `getCurrentUser()` → AuthUser | null

### RoomService (Port 8083)
- `getAllRooms(filter?)` → Observable<Room[]>
- `getRoomById(id)` → Observable<Room>
- `createRoom(data)` → Observable<Room>
- `updateRoom(id, data)` → Observable<Room>
- `deleteRoom(id)` → Observable<void>
- `getAvailableRooms(startDate, endDate)` → Observable<Room[]>

### ReservationService (Port 8084)
- `getAllReservations(filter?)` → Observable<Reservation[]>
- `getReservationById(id)` → Observable<ReservationWithRoom>
- `createReservation(data)` → Observable<Reservation>
- `updateReservation(id, data)` → Observable<Reservation>
- `cancelReservation(id)` → Observable<Reservation>
- `confirmReservation(id)` → Observable<Reservation>

### Autres Services
- `UserService` (Port 8082) - Gestion utilisateurs
- `ScheduleService` (Port 8085) - Gestion horaires
- `NotificationService` (Port 8086) - Notifications

---

## 🛡️ Guards & Interceptors

### ApiInterceptor
- ✅ Ajoute Bearer token à chaque requête
- ✅ Capture 401 Unauthorized
- ✅ Appelle refreshToken() automatiquement
- ✅ Rejoue la requête avec nouveau token
- ✅ Logout si refresh échoue

### AuthGuard
- ✅ Vérifie `isAuthenticated()`
- ✅ Redirige vers `/login` si pas authentifié
- ✅ Vérifie rôle requais (optional)
- ✅ Redirige vers `/` si rôle insuffisant

---

## 🗺️ Routes

```
/login                    → LoginComponent
/register                 → RegisterComponent
/dashboard                → DashboardComponent (AUTH)
/rooms                    → RoomListComponent (AUTH)
  /rooms/:id              → RoomDetailComponent (AUTH)
/reservations             → ReservationListComponent (AUTH)
  /reservations/create    → CreateReservationComponent (AUTH)
  /reservations/:id       → ReservationDetailComponent (AUTH)
/profile                  → ProfileComponent (AUTH)
/admin/users              → UserManagementComponent (ADMIN)
/admin/rooms              → RoomManagementComponent (ADMIN)
/admin/schedules          → ScheduleManagementComponent (ADMIN)
/admin/reports            → ReportsComponent (ADMIN)
/                         → Dashboard (redirect)
/**                       → Dashboard (catch-all)
```

---

## 🎨 Composants à Implémenter

### Phase 1 - Auth (Priorité 1)

**LoginComponent** (`features/auth/pages/login/`)
```typescript
// Champs du formulaire
email: string;
password: string;

// Méthodes
onLogin(): void {
  this.authService.login({email, password}).subscribe(
    (response) => this.router.navigate(['/dashboard']),
    (error) => this.showError(error)
  );
}
```

**RegisterComponent** (`features/auth/pages/register/`)
```typescript
// Formulaire avec validation
firstName: string;
lastName: string;
email: string;
password: string;
confirmPassword: string;

onRegister(): void {
  if (this.password !== this.confirmPassword) return;
  this.authService.register({...}).subscribe(
    () => this.router.navigate(['/login']),
    (error) => this.showError(error)
  );
}
```

### Phase 2 - Dashboard

**DashboardComponent** (`features/dashboard/pages/dashboard/`)
- Affiche statistiques (réservations, salles, utilisateurs)
- Graphiques (chart.js ou ng2-charts)
- Réservations récentes
- Actions rapides

### Phase 3 - Rooms

**RoomListComponent** (`features/rooms/pages/room-list/`)
- Table/Grille de salles
- Filtres (localisation, capacité, équipements)
- Recherche
- Pagination

**RoomDetailComponent** (`features/rooms/pages/room-detail/`)
- Détails salle complet
- Horaires
- Bouton réserver
- Avis/Commentaires

**RoomCardComponent** (composant réutilisable)
- Affichage compact d'une salle
- Image, nom, capacité
- Boutons action

### Phase 4 - Reservations

**ReservationListComponent**
- Liste réservations utilisateur
- Filtres par statut, date
- Actions (annuler, modifier)

**CreateReservationComponent**
- Sélection salle
- Calendrier interactif
- Sélection horaires disponibles
- Validation

**ReservationDetailComponent**
- Détails complète réservation
- Infos salle + utilisateur
- Actions (annuler, modifier)

### Phase 5 - Admin

**UserManagementComponent**
- DataTable utilisateurs
- CRUD utilisateurs
- Filtres par rôle/statut

**RoomManagementComponent**
- DataTable salles
- CRUD salles
- Gestion équipements

**ScheduleManagementComponent**
- Gestion horaires par salle
- Calendrier
- Édition horaires

**ReportsComponent**
- Graphiques statistiques
- Exports données
- Analyses utilisation

### Composants Partagés (shared/)

**Navbar** - Header principal
**Sidebar** - Menu latéral
**Footer** - Pied de page
**Layout** - Container principal
**DataTable** - Tableau réutilisable
**ConfirmDialog** - Dialog confirmation

---

## 💻 Commandes

### Installation & Démarrage

```bash
# Se positionner dans le dossier du projet
cd "d:\Cours\Projet Transversal ISI\Code Source\Timora\Timora\FrontEnd_Timora"

# Installer dépendances
npm install

# Démarrer le serveur de développement
npm start
# ou
ng serve --open

# Avec proxy API Gateway
ng serve --proxy-config proxy.conf.json --open
```

### Build

```bash
# Build production
npm run build
# ou
ng build --configuration production

# Build avec stats
ng build --stats-json
```

### Tests

```bash
# Tests unitaires
npm test
# ou
ng test

# Tests avec coverage
ng test --code-coverage
```

### Linting

```bash
# Lint TypeScript
ng lint

# Fix automatique
ng lint --fix
```

### Génération de Composants

```bash
# Générer composant
ng generate component features/auth/pages/login
ng g c features/auth/pages/login  # Raccourci

# Générer service
ng generate service features/auth/services/auth
ng g s features/auth/services/auth

# Générer guard
ng g guard core/guards/my-guard

# Générer interceptor
ng g i core/interceptors/my-interceptor
```

---

## ✅ Checklist d'Implémentation

### Infrastructure (COMPLET ✅)
- [x] Modèles de données (6 fichiers)
- [x] Services (6 fichiers + index)
- [x] ApiInterceptor
- [x] AuthGuard
- [x] app.config.ts configuré
- [x] Routes définies

### Phase 1 - Auth (À FAIRE)
- [ ] LoginComponent
  - [ ] Template avec formulaire
  - [ ] Styles SCSS
  - [ ] Logique login
  - [ ] Gestion erreurs
  - [ ] Redirection
- [ ] RegisterComponent
  - [ ] Template
  - [ ] Validation
  - [ ] Logique register
  - [ ] Redirection success/error

### Phase 2 - Dashboard (À FAIRE)
- [ ] DashboardComponent
- [ ] StatsCardComponent
- [ ] RecentReservationsComponent
- [ ] ChartModule (Chart.js intégration)

### Phase 3 - Rooms (À FAIRE)
- [ ] RoomListComponent
- [ ] RoomDetailComponent
- [ ] RoomCardComponent
- [ ] Filtres/Recherche
- [ ] Pagination

### Phase 4 - Reservations (À FAIRE)
- [ ] ReservationListComponent
- [ ] CreateReservationComponent
  - [ ] Room selector
  - [ ] Calendar widget
  - [ ] Time picker
- [ ] ReservationDetailComponent
- [ ] ReservationFormComponent

### Phase 5 - Profile (À FAIRE)
- [ ] ProfileComponent
- [ ] ProfileFormComponent
- [ ] ChangePasswordComponent

### Phase 6 - Admin (À FAIRE)
- [ ] UserManagementComponent
- [ ] RoomManagementComponent
- [ ] ScheduleManagementComponent
- [ ] ReportsComponent

### Shared Components (À FAIRE)
- [ ] Navbar
- [ ] Sidebar
- [ ] Footer
- [ ] Layout
- [ ] DataTable
- [ ] ConfirmDialog
- [ ] LoadingSpinner
- [ ] Toast Notifications

### Styling (À FAIRE)
- [ ] Tailwind CSS setup
- [ ] Thème couleurs
- [ ] Responsive design
- [ ] Global styles

### Tests (À FAIRE)
- [ ] Unit tests services
- [ ] Unit tests guards
- [ ] Unit tests interceptors
- [ ] Component tests
- [ ] E2E tests

### Documentation (À FAIRE)
- [ ] Component documentation
- [ ] Service documentation
- [ ] API integration guide
- [ ] Troubleshooting guide

---

## 📊 État du Projet

```
Infrastructure: ████████████████████ 100% ✅
Auth (Login/Register): ░░░░░░░░░░░░░░░░░░░░ 0%
Dashboard: ░░░░░░░░░░░░░░░░░░░░ 0%
Rooms: ░░░░░░░░░░░░░░░░░░░░ 0%
Reservations: ░░░░░░░░░░░░░░░░░░░░ 0%
Admin: ░░░░░░░░░░░░░░░░░░░░ 0%
Shared Components: ░░░░░░░░░░░░░░░░░░░░ 0%
─────────────────────────────────
Total: ████░░░░░░░░░░░░░░░░░░░░░░░░ 14%
```

---

## 🚀 Prochaines Étapes

### Immediate (Today)
1. ✅ **Infra créée** - Modèles, services, interceptors
2. Commencer **LoginComponent**
3. Commencer **RegisterComponent**
4. Tester connexion API Gateway

### This Week
- Auth module complet
- DashboardComponent
- RoomListComponent

### Next Week
- Reservations module
- ProfileComponent
- Shared components

### Phase 2 (Jan-Feb 2026)
- Admin module
- Reports
- Notifications en temps réel
- Amélioration UI/UX

---

## 📞 Support & Ressources

### Backend API
- **API Gateway:** `http://localhost:8080`
- **Auth Service:** Port 8081
- **User Service:** Port 8082
- **Room Service:** Port 8083
- **Reservation Service:** Port 8084
- **Schedule Service:** Port 8085
- **Notification Service:** Port 8086
- **Config Server:** Port 8888
- **Eureka:** `http://localhost:8761`

### Documentation Backend
- Voir `../Timora/` pour structure backend
- Configuration dans `application.yml` de chaque service

### Angular Docs
- [Angular 20 Docs](https://angular.io)
- [TypeScript 5.9](https://www.typescriptlang.org)
- [RxJS](https://rxjs.dev)

---

**Status:** Infrastructure complète ✅ | Prêt pour Phase 1 🚀

Voulez-vous que je commence à créer les composants Auth en premier? 🎯

