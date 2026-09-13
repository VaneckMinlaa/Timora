# Guide de test - Dashboard Enseignant

## 🧪 Tests fonctionnels

### Avant de commencer
1. ✅ L'application Angular est compilée
2. ✅ Tous les services backend sont disponibles
3. ✅ Vous êtes connecté en tant qu'enseignant (role: 'USER')

### Tests basiques

#### Test 1: Navigation vers le dashboard
```
1. Ouvrir l'app Timora: http://localhost:4200
2. Se connecter avec un compte enseignant
3. Aller à /teacher/dashboard ou cliquer sur le dashboard dans le menu
4. ✅ Vérifier que le dashboard charge correctement
```

#### Test 2: Chargement des statistiques
```
1. Observer les 4 cartes de stats
2. ✅ Vérifier que les nombres s'affichent
3. ✅ Vérifier que les tendances s'affichent (+/- vs. semaine)
4. ✅ Vérifier que les icônes s'affichent correctement
```

#### Test 3: Graphiques ApexCharts
```
1. Bar Chart (Réservations/jour):
   ✅ Affiche 5 barres (Lun-Ven)
   ✅ Valeurs au-dessus des barres
   ✅ Hover affiche le détail

2. Donut Chart (Distribution/salle):
   ✅ Affiche un diagramme circulaire
   ✅ Légende avec couleurs et %
   ✅ Zoom disponible

3. Area Chart (Heures/jour):
   ✅ Courbe lissée
   ✅ Gradient sous la courbe
   ✅ Axes X (jours) et Y (heures)
```

#### Test 4: Tableaux de données
```
1. Prochaines Réservations:
   ✅ Affiche max 5 réservations
   ✅ Colonnes: Salle | Date | Durée | Statut
   ✅ Lien "Voir tout" vers /reservations

2. Prochains Cours:
   ✅ Affiche max 5 cours
   ✅ Colonnes: Cours | Date | Salle | Effectif
   ✅ Lien "Voir tout" vers /teacher/schedules

3. Conflits:
   ✅ Affiche le nombre de conflits
   ✅ Si 0: message "Aucun conflit"
   ✅ Si >0: bouton "Résoudre les conflits"
```

### Tests responsivité

#### Desktop (1920x1080)
```
1. Stats: 4 colonnes
2. Charts: 3 colonnes (Bar | Donut | Area)
3. Tableaux: 2 colonnes (Réservations | Cours)
4. ✅ Tout visible sans scroll horizontal
```

#### Tablet (768x1024)
```
1. Stats: 2 colonnes (wrapping)
2. Charts: 2 colonnes wrapping
3. Tableaux: 1 colonne (empilés)
4. ✅ Aucun chevauchement d'éléments
```

#### Mobile (375x667)
```
1. Stats: 1 colonne
2. Charts: 1 colonne
3. Tableaux: scrollable horizontal
4. ✅ Utilise tout l'espace
5. ✅ Padding et margins adaptés
```

### Tests interactions

#### Hover effects
```
1. Stats Card:
   ✅ Ombre augmente
   ✅ Légère translation vers le haut

2. Chart Actions:
   ✅ Bouton "expand_more" change de couleur au hover

3. Liens "Voir tout":
   ✅ Couleur change
   ✅ Icon se déplace vers la droite
```

#### Tableau interactions
```
1. Row hover:
   ✅ Fond change en gris clair
   
2. Status badges:
   ✅ Pending: orange
   ✅ Confirmed: vert
   ✅ Cancelled: rouge
```

### Tests de données

#### Données manquantes
```
1. Si pas de réservations:
   ✅ Table affiche "Aucune réservation prévue"
   ✅ Bar chart vide avec message

2. Si pas de cours:
   ✅ Table affiche "Aucun cours prévu"
   ✅ Area chart vide

3. Si pas de conflits:
   ✅ Section affiche "Aucun conflit d'horaire"
```

#### Calculs
```
1. Durée réservation:
   ✅ Calcul correct (endTime - startTime)
   
2. Heures planifiées:
   ✅ Total correct de tous les cours
   
3. Tendances:
   ✅ % comparaison vs semaine précédente
```

## 🐛 Tests de détection d'erreurs

### Erreurs réseau
```
1. Accéder au dashboard avec réseau lent
   ✅ Affiche un loader (si implémenté) ou attend

2. Si ReservationService échoue:
   ✅ Stat conserver la valeur 0
   ✅ Pas de crash de l'appli

3. Si ConflictService échoue:
   ✅ Stats conflits = 0
   ✅ Section conflits vide
```

### Validation des dates
```
1. Réservation future:
   ✅ Affichée dans le tableau
   
2. Réservation passée:
   ✅ Cachée du tableau
   
3. Cours aujourd'hui:
   ✅ Affiché comme "En cours"
```

## 🎨 Tests visuels

### Polices et tailles
```
Stat Label:        16px, weight 500 ✅
Stat Value:        36px, weight 800 ✅
Chart Title:       16px, weight 600 ✅
Table Header:      12px, weight 600 ✅
Table Body:        14px, weight 400 ✅
```

### Couleurs   
```
Primary (Bleu):    #2563eb ✅
Success (Vert):    #10b981 ✅
Warning (Orange):  #f59e0b ✅
Info (Cyan):       #06b6d4 ✅
Error (Rouge):     #ef4444 ✅
```

### Espacement
```
Main padding:      24px ✅
Card padding:      24px ✅
Gap stats:         16px ✅
Gap charts:        24px ✅
```

## 🔄 Tests de performance

### Chargement initial
```
1. Ouvrir le dashboard
2. Mesurer le temps de chargement
   ✅ Devrait être < 2 secondes

3. Vérifier Network tab (DevTools)
   API calls attendus:
   - GET /reservations
   - GET /courses
   - GET /conflicts
   - GET /schedules
```

### Re-renders
```
1. Ouvrir DevTools > React Profiler (ou Angular DevTools)
2. Naviguer vers d'autres pages et revenir
3. ✅ Pas de memory leaks (destroy$ cleanup)
```

## 🔐 Tests de sécurité

### Authentification
```
1. Accéder à /teacher/dashboard sans token:
   ✅ Redirection vers /login

2. Token expiré:
   ✅ Redirection vers /login

3. Utilisateur ADMIN accédant à /teacher/dashboard:
   ✅ Redirection vers /admin/dashboard
```

### Données utilisateur
```
1. Dashboard affiche données de L'UTILISATEUR connecté:
   ✅ Ses réservations uniquement
   ✅ Ses cours uniquement
   ✅ Ses conflits uniquement

2. Pas de données d'autres utilisateurs visibles
```

## ✅ Checklist finale

- [ ] Tous les graphiques s'affichent correctement
- [ ] Les tableaux montrent les données attendues
- [ ] Les statistiques match les données réelles
- [ ] Responsivité OK sur desktop/tablet/mobile
- [ ] Pas d'erreurs console (F12 > Console)
- [ ] Pas de memory leaks
- [ ] Les liens "Voir tout" fonctionnent
- [ ] Les tendances s'affichent correctement
- [ ] Les couleurs match le design
- [ ] Pas de données d'autres utilisateurs
- [ ] Erreurs réseau gérées gracieusement

## 🚀 Lancer les tests

### Via script npm (si configuré)
```bash
# Tests unitaires
npm test

# Tests e2e (Cypress/Selenium)
npm run e2e

# Linter
npm run lint
```

### Manuellement
```bash
# Dev server
ng serve

# Ouvrir http://localhost:4200
# Se connecter en tant qu'enseignant
# Naviguer vers /teacher/dashboard
```

## 📸 Captures d'écran attendues

### Desktop
```
- 4 stats cards en haut (colorées)
- 3 graphiques en 3 colonnes
- 2 tableaux côte à côte
- 1 section conflits
```

### Mobile
```
- 1 stat card (scrolling vertical)
- 1 graphique full width
- 1 tableau (horizontal scroll si large)
```

---

**Durée estimée des tests**: 30-45 minutes  
**Outils nécessaires**: Browser, DevTools, Network inspector  
**Testeur requis**: Personne avec accès à un compte enseignant
