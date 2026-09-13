# Page de Gestion des Conflits d'Horaires

## Description
Cette page permet aux administrateurs d'identifier, analyser et résoudre les conflits d'horaires dans le système Timora.

## Fonctionnalités

### 1. Liste des Conflits
- Affichage de tous les conflits détectés
- Recherche par enseignant, cours, ou salle
- Filtrage par type de conflit et date
- Compteur de conflits en temps réel

### 2. Types de Conflits
- **Conflit de Salle** : Deux cours planifiés dans la même salle au même moment
- **Conflit Enseignant** : Un enseignant planifié pour deux cours simultanément
- **Conflit Thermodynamique** : Conflit spécifique aux salles de thermodynamique

### 3. Détails du Conflit
- Visualisation de l'emploi du temps avec les cours en conflit
- Informations détaillées sur chaque cours affecté
- Horaires et salles concernées

### 4. Solutions Suggérées
Le système propose automatiquement des solutions :
- **Changement de salle** : Proposer une salle disponible
- **Changement d'horaire** : Décaler le cours à un autre créneau
- **Replanification** : Déplacer le cours à un autre jour

### 5. Résolution Manuelle
Si les solutions automatiques ne conviennent pas, l'administrateur peut :
- Modifier manuellement le jour
- Changer l'horaire
- Assigner une nouvelle salle

## Design et UX

### Thème
- Design moderne en thème blanc
- Palette de couleurs cohérente avec l'application
- Ombres et bordures subtiles

### Micro-interactions
- **Hover effects** : Élévation des cartes au survol
- **Animations** : Transitions fluides entre les états
- **Pulse animation** : Sur les badges de notification
- **Fade-in** : Apparition progressive des éléments
- **Loading states** : Spinner pendant le chargement

### Responsive
- Layout adaptatif pour desktop, tablette et mobile
- Grille qui s'adapte à la taille de l'écran
- Navigation optimisée pour tous les appareils

## Structure des Fichiers

```
conflicts/
├── conflicts.component.ts      # Logique du composant
├── conflicts.component.html    # Template HTML
├── conflicts.component.scss    # Styles SCSS
└── README.md                   # Documentation
```

## Modèles de Données

### Conflict
```typescript
interface Conflict {
  id: string;
  type: ConflictType;
  title: string;
  description: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  status: ConflictStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  // ... autres propriétés
}
```

### Solution
```typescript
interface Solution {
  id: string;
  type: 'CHANGE_ROOM' | 'CHANGE_TIME' | 'RESCHEDULE';
  description: string;
  priority: number;
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
  // ... autres propriétés
}
```

## API Endpoints

### GET /api/schedules/conflicts
Récupère tous les conflits avec filtres optionnels

### GET /api/schedules/conflicts/:id
Récupère les détails d'un conflit spécifique

### POST /api/schedules/conflicts/:id/resolve
Résout un conflit avec une solution suggérée ou manuelle

### POST /api/schedules/conflicts/:id/ignore
Ignore un conflit

### POST /api/schedules/conflicts/detect
Détecte les conflits pour une période donnée

## Utilisation

1. Accéder à la page via le menu admin : `/admin/conflicts`
2. Parcourir la liste des conflits détectés
3. Cliquer sur un conflit pour voir les détails
4. Choisir une solution suggérée ou créer une résolution manuelle
5. Valider la résolution

## Notes de Développement

- Les données de mock sont utilisées temporairement
- Remplacer `getMockConflicts()` par `getAllConflicts()` quand le backend sera prêt
- Remplacer `getMockConflictDetails()` par `getConflictById()` quand le backend sera prêt
- Les animations sont optimisées pour les performances
- Le code est entièrement typé avec TypeScript

## Améliorations Futures

- [ ] Notifications en temps réel des nouveaux conflits
- [ ] Export PDF des conflits
- [ ] Historique des résolutions
- [ ] Statistiques sur les types de conflits
- [ ] Prévention automatique des conflits lors de la planification
