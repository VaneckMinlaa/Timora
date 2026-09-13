# Dashboard Enseignant - Timora

## 📊 Vue d'ensemble

Le dashboard enseignant offre un aperçu complet et intuitif des activités de l'enseignant :
- Réservations de salles
- Cours planifiés
- Heures d'enseignement
- Conflits d'horaires

## 🎨 Architecture visuelle

### Layout principal
```
┌─ Sidebar ─────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─ Header ──────────────────────────────────────────────────┐ │
│  │ Tableau de Bord Enseignant               [User Avatar]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Main Content Area ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌─ Stats Grid (4 cartes) ───────────────────────────────┐ │ │
│  │  │ │Réservations│ │Cours│ │Heures│ │Conflits│           │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─ Charts Grid (3 graphiques) ──────────────────────────┐ │ │
│  │  │ ┌─ Bar Chart ──────┐ ┌─ Donut Chart ─┐               │ │ │
│  │  │ │ Réservations/j   │ │ Par salle      │               │ │ │
│  │  │ └──────────────────┘ └────────────────┘               │ │ │
│  │  │ ┌──── Area Chart (full width) ──────────────────────┐ │ │
│  │  │ │ Heures planifiées par jour                        │ │ │
│  │  │ └────────────────────────────────────────────────────┘ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─ Data Tables ──────────────────────────────────────────┐ │ │
│  │  │ ┌─ Réservations ──┐ ┌─ Cours ──┐                       │ │ │
│  │  │ │ Table avec      │ │ Table    │  ┌─ Conflits ──────┐ │ │
│  │  │ │ prochaines      │ │ avec     │  │ [Gestion des   │ │ │
│  │  │ │ réservations    │ │ cours    │  │  conflits]     │ │ │
│  │  │ └─────────────────┘ └──────────┘  └────────────────┘ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Élements principaux

### 1. **Stats Cards**
Quatre cartes affichant des KPIs clés :

| Carte | Valeur | Tendance | Icône |
|-------|--------|----------|-------|
| Réservations | Total | % vs. semaine | 📅 Bleu |
| Cours Planifiés | Total | % vs. semaine | 📋 Cyan |
| Heures Planifiées | Heures | % vs. semaine | ⏱️ Vert |
| Conflits | Total | % vs. semaine | ⚠️ Orange |

### 2. **Graphiques ApexCharts**

#### Bar Chart - Réservations par jour
- Affiche les réservations par jour de la semaine (Lun-Ven)
- Barres bleu primaire avec valeurs au-dessus
- Responsive et interactif au hover

#### Donut Chart - Distribution par type de salle
- Montre la répartition des réservations par type : Amphithéâtre, Classe, Labo, Salle réunion
- Légende personnalisée avec pourcentages
- Couleurs distinctes pour chaque type

#### Area Chart - Heures planifiées
- Courbe lissée montrant les heures/jour (Lun-Dim)
- Gradient rempli sous la courbe
- Format : Heures planifiées

### 3. **Tableaux de données**

#### Table 1: Prochaines réservations
```
┌────────────┬─────────────────┬────────┬─────────┐
│ Salle      │ Date & Heure    │ Durée  │ Statut  │
├────────────┼─────────────────┼────────┼─────────┤
│ Amphithéâtre│ Heute 14:00    │ 2h     │ ✓ Conf  │
│ Salle TP   │ Demain 09:30    │ 1.5h   │ ⏳ Pend  │
└────────────┴─────────────────┴────────┴─────────┘
```

#### Table 2: Prochains cours
```
┌──────────────────┬─────────────────┬────────────┬────────┐
│ Cours            │ Date & Heure    │ Salle      │ Effec. │
├──────────────────┼─────────────────┼────────────┼────────┤
│ Mathématiques 101│ Lun 10:00      │ C-101      │ 25     │
│ Physique 202     │ Mer 14:00      │ Labo A     │ 18     │
└──────────────────┴─────────────────┴────────────┴────────┘
```

#### Section 3: Conflits d'horaires
- Affiche le nombre de conflits détectés
- Bouton "Résoudre les conflits" pour gérer
- Empty state si aucun conflit

## 🔄 Flux de données

```
Component Init
    ↓
loadUserInfo()
    ↓ (AuthService.getCurrentUser$())
[Récupère user connecté]
    ↓
loadDashboardData()
    ↓
forkJoin({
  reservations: ReservationService.getReservations(),
  courses: CourseService.getAllCourses(),
  conflicts: ConflictService.getConflicts(),
  schedule: ScheduleService.getSchedules()
})
    ↓
Processing (processReservations, processCourses, etc.)
    ↓
generateCharts() [ApexCharts config]
    ↓
UI Update
```

## 🎯 Fonctionnalités

### Statistiques intelligentes
- **Tendances**: Comparaison avec la semaine précédente
- **Filtrage temporel**: Réservations/cours à venir uniquement
- **Calcul automatique**: Durée des réservations, heures totales

### Graphiques interactifs
- **Hover**: Affiche les valeurs exactes
- **Responsive**: S'adapte à tous les écrans
- **Zoom**: ApexCharts supporte le zoom
- **Export**: Possibilité d'exporter les graphiques en image

### Navigation
- **Quick links**: Accès direct aux pages connexes
- **Voir tout**: Liens vers pages complètes
- **Contexte**: Actions basées sur les données affichées

## 📊 Données affichées

### Sources de données
- **ReservationService**: Toutes les réservations de l'enseignant
- **CourseService**: Tous les cours planifiés
- **ConflictService**: Conflits horaires (filtrés par enseignant)
- **ScheduleService**: Emploi du temps complet

### Transformations
1. **Réservations**: Filtrage par date >= aujourd'hui, tri ascendant
2. **Cours**: Idem réservations + calcul des heures
3. **Conflits**: Filtre sur `affectedEntities[].type === 'TEACHER'`
4. **Graphiques**: Agrégation par jour de semaine / type

## 🎨 Thème et couleurs

```scss
// Stats Cards
$primary: #2563eb      // Réservations (bleu)
$info: #06b6d4         // Cours (cyan)
$success: #10b981      // Heures (vert)
$warning: #f59e0b      // Conflits (orange)

// Statuts
$pending: $warning
$confirmed: $success
$cancelled: #ef4444
```

## 📱 Responsivité

### Desktop (1024px+)
- Grid 4 colonnes pour stats
- Grid 3 colonnes pour charts
- Tableaux côte à côte

### Tablet (768px+)
- Grid 2 colonnes stats
- Grid 2 colonnes charts
- Tableaux empilés

### Mobile (<768px)
- Grid 1 colonne stats
- Grid 1 colonne charts
- Tableaux scrollables

## 🔧 Configuration ApexCharts

### Bar Chart
```typescript
barChartConfig = {
  chart: { type: 'bar', height: 280 },
  colors: ['#2563eb'],
  xaxis: { categories: ['Lun', 'Mar', ...] }
}
```

### Donut Chart
```typescript
donutChartConfig = {
  chart: { type: 'donut', height: 280 },
  colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444']
}
```

### Area Chart
```typescript
areaChartConfig = {
  chart: { type: 'area', height: 300 },
  fill: { type: 'gradient' }
}
```

## 💡 Bonnes pratiques

1. **Destructuring unsubscribe**: `takeUntil(this.destroy$)`
2. **Error handling**: `catchError(() => of([]))`
3. **Type safety**: Interfaces pour tous les modèles
4. **Performance**: `OnDestroy` pour nettoyer les subscriptions
5. **Template**: `*ngFor trackBy` où applicable

## 🚀 Améliorations futures

1. **Real-time updates**: WebSocket ou SignalR
2. **Filters**: Par date, type de salle, statut
3. **Export**: PDF/Excel des statistiques
4. **Caching**: Réduire les appels API
5. **Notifications**: Toast pour les changements importants
6. **Darkmode**: Support du thème sombre

## 🔗 Dépendances

- **Angular**: 14+
- **ApexCharts**: via `ng-apexcharts`
- **RxJS**: Observables et operators
- **Material Symbols**: Icônes

## 📝 Notes de développement

- Le composant utilise `inject()` au lieu de `constructor()`
- Standalone component (pas de NgModule)
- Tous les services sont injectés en tant que providers
- Les dates utilisent `new Date()` pour la compatibilité

---

**Auteur**: GitHub Copilot  
**Date**: Avril 16, 2026  
**Version**: 1.0  
**Status**: ✅ Production-ready
