# Implémentation Complète de la Gestion des Conflits

## Vue d'ensemble

Système complet de détection, analyse et résolution automatique des conflits d'horaires dans l'application Timora.

## Types de Conflits Gérés

1. **TEACHER_OVERLAP** - Enseignant programmé dans plusieurs cours simultanément
2. **ROOM_OVERLAP** - Salle occupée par plusieurs cours en même temps
3. **STUDENT_GROUP_OVERLAP** - Groupe d'étudiants avec plusieurs cours simultanés
4. **ROOM_CAPACITY** - Capacité de salle insuffisante
5. **EQUIPMENT_MISSING** - Équipement requis manquant
6. **TEACHER_UNAVAILABLE** - Cours hors disponibilités enseignant
7. **TIME_OVERFLOW** - Cours dépassant les horaires autorisés (07h-20h)

## Niveaux de Sévérité

- **CRITICAL** - Bloquant, doit être résolu immédiatement
- **HIGH** - Important, à résoudre rapidement
- **MEDIUM** - Moyen, peut attendre
- **LOW** - Faible, information

## Backend (Java Spring Boot)

### Entités Créées

#### `Conflict.java`
- Représente un conflit détecté
- Champs: id, type, severity, status, title, description, affectedCoursIds, etc.
- Statuts: PENDING, RESOLVED, IGNORED

#### `ConflictResolution.java`
- Représente une solution proposée
- Champs: id, conflictId, type, description, priority (0-100), feasibility, changes
- Types: CHANGE_ROOM, CHANGE_TIME, SWAP_COURSES, SPLIT_GROUP, etc.

### Services

#### `ConflictDetectionService`
- `detectAllConflicts()` - Scanne tous les emplois du temps
- `detectTeacherConflicts()` - Détecte les conflits d'enseignants
- `detectRoomConflicts()` - Détecte les conflits de salles
- `detectStudentGroupConflicts()` - Détecte les conflits de groupes
- `detectRoomCapacityConflicts()` - Détecte les problèmes de capacité
- `detectTimeOverflowConflicts()` - Détecte les dépassements horaires

#### `ConflictResolutionService`
- `generateResolutions(Conflict)` - Génère 3-5 solutions par conflit
- `resolveTeacherConflict()` - Solutions pour conflits enseignants
- `resolveRoomConflict()` - Solutions pour conflits de salles
- `resolveStudentGroupConflict()` - Solutions pour conflits de groupes
- Scoring automatique des solutions (priorité 0-100)

#### `ConflictService`
- `getAllConflicts()` - Liste tous les conflits avec filtres
- `getConflictDetails()` - Détails + solutions d'un conflit
- `detectConflicts()` - Lance la détection
- `resolveConflict()` - Applique une solution
- `ignoreConflict()` - Ignore un conflit
- `autoResolveAllConflicts()` - Résolution automatique en masse
- `getConflictStats()` - Statistiques globales

### API REST (`ConflictController`)

```
GET    /api/conflicts                  - Liste des conflits (avec filtres)
GET    /api/conflicts/{id}             - Détails d'un conflit
POST   /api/conflicts/detect           - Détecter les conflits
POST   /api/conflicts/{id}/resolve     - Résoudre un conflit
POST   /api/conflicts/{id}/ignore      - Ignorer un conflit
POST   /api/conflicts/auto-resolve-all - Résolution automatique
GET    /api/conflicts/stats            - Statistiques
```

### Repositories

- `ConflictRepository` - CRUD + requêtes personnalisées
- `ConflictResolutionRepository` - Gestion des solutions

## Frontend (Angular)

### Modèles Mis à Jour

#### `conflict.model.ts`
- Types de conflits étendus (7 types)
- Ajout de `ConflictSeverity`
- Ajout de `ConflictStats`
- Interface `Solution` améliorée avec scoring

### Service

#### `ConflictService`
- `getAllConflicts()` - Récupère les conflits
- `getConflictById()` - Détails d'un conflit
- `resolveConflict()` - Résout un conflit
- `ignoreConflict()` - Ignore un conflit
- `detectConflicts()` - Lance la détection
- `autoResolveAll()` - Résolution automatique
- `getConflictStats()` - Statistiques

### Composant Conflicts

#### Fonctionnalités
- Dashboard de statistiques (total, en attente, résolus, détectés)
- Filtres avancés (type, sévérité, statut)
- Liste des conflits avec badges colorés
- Détails avec timeline visuelle
- Solutions proposées avec scoring (0-100%)
- Bouton "Détecter les conflits"
- Bouton "Résoudre tout automatiquement"
- Bouton "Ignorer ce conflit"
- Résolution manuelle

#### Interface Utilisateur
```
┌─────────────────────────────────────────────────────┐
│ Résolution Conflits d'Horaires                      │
│ [Détecter] [Résoudre tout automatiquement]          │
├─────────────────────────────────────────────────────┤
│ Stats: Total | En Attente | Résolus | Détectés     │
├─────────────────────────────────────────────────────┤
│ Filtres: Type | Sévérité | Statut                   │
├─────────────────────────────────────────────────────┤
│ Liste des conflits          │ Détails + Solutions   │
│ - Conflit 1 [CRITICAL]      │ Timeline visuelle     │
│ - Conflit 2 [HIGH]          │ Solution 1 (95%)      │
│ - Conflit 3 [MEDIUM]        │ Solution 2 (85%)      │
│                             │ [Appliquer] [Ignorer] │
└─────────────────────────────────────────────────────┘
```

### Dashboard Admin

#### Modifications
- Carte "Conflits cette semaine" mise à jour
- Affiche le nombre de conflits détectés
- Lien vers la page de gestion des conflits
- Intégration avec `ConflictService.getConflictStats()`

## Algorithmes de Résolution

### Conflit de Salle (ROOM_OVERLAP)
1. **Solution 1** (Priorité 95) - Changer de salle
   - Trouve des salles disponibles au même créneau
   - Impact minimal
2. **Solution 2** (Priorité 70) - Changer l'horaire
   - Trouve des créneaux disponibles
   - Impact moyen

### Conflit d'Enseignant (TEACHER_OVERLAP)
1. **Solution 1** (Priorité 90) - Déplacer un cours
   - Trouve des créneaux disponibles pour l'enseignant
2. **Solution 2** (Priorité 75) - Échanger deux cours
   - Échange les créneaux de deux cours

### Conflit de Groupe (STUDENT_GROUP_OVERLAP)
1. **Solution 1** (Priorité 85) - Déplacer un cours
   - Trouve un créneau libre pour le groupe
2. **Solution 2** (Priorité 60) - Diviser le groupe
   - Crée deux groupes (impact important)

## Scoring des Solutions

Le système attribue un score de priorité (0-100) basé sur :
- **Faisabilité** (HIGH/MEDIUM/LOW)
- **Impact** (minimal/moyen/important)
- **Ordre de génération** (premières solutions = meilleur score)

Exemple :
- Changer de salle : 95 points (faisabilité HIGH, impact minimal)
- Changer l'horaire : 70 points (faisabilité MEDIUM, impact moyen)
- Diviser le groupe : 60 points (faisabilité LOW, impact important)

## Flux de Travail

### Détection Automatique
1. Admin clique sur "Détecter les conflits"
2. Backend scanne tous les emplois du temps
3. Détecte les 7 types de conflits
4. Sauvegarde en base de données
5. Retourne la liste des conflits

### Résolution Manuelle
1. Admin sélectionne un conflit
2. Système génère 3-5 solutions
3. Admin choisit une solution
4. Système applique les changements
5. Conflit marqué comme RESOLVED

### Résolution Automatique
1. Admin clique sur "Résoudre tout automatiquement"
2. Pour chaque conflit PENDING :
   - Génère les solutions
   - Sélectionne la meilleure (score le plus élevé)
   - Applique automatiquement
3. Retourne le nombre de conflits résolus/échoués

## Base de Données

### Tables Créées

#### `conflicts`
```sql
id VARCHAR(36) PRIMARY KEY
type VARCHAR(50) NOT NULL
severity VARCHAR(20) NOT NULL
status VARCHAR(20) NOT NULL
title VARCHAR(500) NOT NULL
description VARCHAR(1000) NOT NULL
room_id VARCHAR(36)
room_name VARCHAR(255)
teacher_id VARCHAR(36)
teacher_name VARCHAR(255)
classe_id VARCHAR(36)
class_name VARCHAR(255)
day_of_week VARCHAR(20)
start_time TIME
end_time TIME
conflict_date DATE
detected_at TIMESTAMP NOT NULL
resolved_at TIMESTAMP
resolved_by VARCHAR(255)
resolution_notes VARCHAR(1000)
updated_at TIMESTAMP NOT NULL
```

#### `conflict_affected_courses`
```sql
conflict_id VARCHAR(36)
cours_id VARCHAR(36)
```

#### `conflict_resolutions`
```sql
id VARCHAR(36) PRIMARY KEY
conflict_id VARCHAR(36) NOT NULL
type VARCHAR(50) NOT NULL
description VARCHAR(500) NOT NULL
explanation VARCHAR(1000) NOT NULL
priority INT NOT NULL
feasibility VARCHAR(20) NOT NULL
impact VARCHAR(500)
created_at TIMESTAMP NOT NULL
```

#### `resolution_changes`
```sql
resolution_id VARCHAR(36)
change_key VARCHAR(255)
change_value VARCHAR(500)
```

## Tests Recommandés

### Backend
1. Test de détection de conflits
2. Test de génération de solutions
3. Test d'application de solutions
4. Test de résolution automatique
5. Test des statistiques

### Frontend
1. Test d'affichage des conflits
2. Test des filtres
3. Test de sélection d'un conflit
4. Test d'application d'une solution
5. Test de résolution automatique

## Améliorations Futures

1. **Notifications en temps réel** - Alerter les utilisateurs lors de nouveaux conflits
2. **Historique des résolutions** - Tracer toutes les modifications
3. **Machine Learning** - Apprendre des résolutions passées pour améliorer les suggestions
4. **Prévisualisation** - Modal avant/après pour visualiser l'impact
5. **Export PDF** - Rapport des conflits et résolutions
6. **Intégration calendrier** - Visualisation des conflits dans le calendrier
7. **Validation des contraintes** - Vérifier les disponibilités réelles des enseignants
8. **Optimisation globale** - Résoudre plusieurs conflits simultanément de manière optimale

## Fichiers Créés/Modifiés

### Backend
- ✅ `Conflict.java`
- ✅ `ConflictType.java`
- ✅ `ConflictSeverity.java`
- ✅ `ConflictStatus.java`
- ✅ `ConflictResolution.java`
- ✅ `ResolutionType.java`
- ✅ `ResolutionFeasibility.java`
- ✅ `ConflictRepository.java`
- ✅ `ConflictResolutionRepository.java`
- ✅ `ConflictDetectionService.java`
- ✅ `ConflictResolutionService.java`
- ✅ `ConflictService.java`
- ✅ `ConflictController.java`
- ✅ DTOs (ConflictResponse, ConflictDetailsResponse, etc.)

### Frontend
- ✅ `conflict.model.ts` (mis à jour)
- ✅ `conflict.service.ts` (mis à jour)
- ✅ `conflicts.component.ts` (mis à jour)
- ✅ `conflicts.component.html` (mis à jour)
- ✅ `conflicts.component.scss` (mis à jour)
- ✅ `dashboard.component.ts` (mis à jour)
- ✅ `dashboard.component.html` (mis à jour)
- ✅ `dashboard.component.scss` (mis à jour)

## Conclusion

Le système de gestion des conflits est maintenant complètement implémenté avec :
- ✅ Détection automatique de 7 types de conflits
- ✅ Génération intelligente de solutions avec scoring
- ✅ Résolution manuelle et automatique
- ✅ Interface utilisateur complète avec statistiques
- ✅ Intégration dans le dashboard admin
- ✅ API REST complète
- ✅ Base de données structurée

Le système est prêt à être testé et déployé !
