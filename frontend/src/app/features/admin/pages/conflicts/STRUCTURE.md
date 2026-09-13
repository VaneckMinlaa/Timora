# Structure de la Page Gestion des Conflits

## Layout Général

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
│  Résolution Conflits d'Horaires                                 │
│  Identifiez, analysez et résolvez les conflits.                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────┐
│   PANNEAU GAUCHE     │        PANNEAU DROIT                     │
│   (420px)            │        (Flexible)                        │
│                      │                                          │
│  ┌────────────────┐  │  ┌────────────────────────────────────┐ │
│  │ Recherche      │  │  │ Détails et Résolution du Conflit   │ │
│  └────────────────┘  │  └────────────────────────────────────┘ │
│                      │                                          │
│  ┌────────────────┐  │  ┌────────────────────────────────────┐ │
│  │ Filtres        │  │  │ Visualisation de l'Emploi du Temps │ │
│  └────────────────┘  │  │                                    │ │
│                      │  │  ┌──────────────────────────────┐  │ │
│  Conflits (3)        │  │  │ Cours 1 - BDD Avancées       │  │ │
│                      │  │  │ 10:00 - 12:00                │  │ │
│  ┌────────────────┐  │  │  └──────────────────────────────┘  │ │
│  │ Conflit 1      │  │  │  ┌──────────────────────────────┐  │ │
│  │ [SALLE]        │  │  │  │ Cours 2 - Réseaux Info II    │  │ │
│  │ Base de Données│  │  │  │ 10:00 - 12:00                │  │ │
│  │ Lundi 10:00    │  │  │  └──────────────────────────────┘  │ │
│  └────────────────┘  │  └────────────────────────────────────┘ │
│                      │                                          │
│  ┌────────────────┐  │  ┌────────────────────────────────────┐ │
│  │ Conflit 2      │  │  │ Solutions Suggérées                │ │
│  │ [ENSEIGNANT]   │  │  │                                    │ │
│  │ M. Jean Dupont │  │  │  ┌──────────────────────────────┐  │ │
│  │ Mardi 08:00    │  │  │  │ ✓ Salle S201 disponible      │  │ │
│  └────────────────┘  │  │  │   [Appliquer]                │  │ │
│                      │  │  └──────────────────────────────┘  │ │
│  ┌────────────────┐  │  │  ┌──────────────────────────────┐  │ │
│  │ Conflit 3      │  │  │  │ ✓ Salle S105 disponible      │  │ │
│  │ [THERMO]       │  │  │  │   [Appliquer]                │  │ │
│  │ Thermodynamique│  │  │  └──────────────────────────────┘  │ │
│  │ Jeudi 14:00    │  │  │  ┌──────────────────────────────┐  │ │
│  └────────────────┘  │  │  │ ⚠ Décaler à 14h              │  │ │
│                      │  │  │   [Appliquer]                │  │ │
│                      │  │  └──────────────────────────────┘  │ │
│                      │  │                                    │ │
│                      │  │  [✏️ Résolution Manuelle]          │ │
│                      │  └────────────────────────────────────┘ │
└──────────────────────┴──────────────────────────────────────────┘
```

## Composants Détaillés

### 1. Header
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Résolution Conflits d'Horaires                       │
│ Identifiez, analysez et résolvez les conflits.         │
└─────────────────────────────────────────────────────────┘
```

### 2. Panneau Gauche - Liste des Conflits

#### Recherche
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Rechercher un enseignant, un cours...               │
└─────────────────────────────────────────────────────────┘
```

#### Filtres
```
┌──────────────────────┬──────────────────────────────────┐
│ Type de conflit ▼    │ Par date ▼                       │
└──────────────────────┴──────────────────────────────────┘
```

#### Carte de Conflit
```
┌─────────────────────────────────────────────────────────┐
│ 🏢 [CONFLIT DE SALLE]                                   │
│                                                         │
│ Conflit de salle pour "Base de Données Avancées"       │
│ 📅 Lundi 2024-10-23 - 10:00-12:00                      │
│ Salle S102: J. Doe (BDD) & A. Smith (Réseaux)          │
└─────────────────────────────────────────────────────────┘
```

### 3. Panneau Droit - Détails du Conflit

#### Header des Détails
```
┌─────────────────────────────────────────────────────────┐
│ Détails et Résolution du Conflit                    ✕  │
│ [CONFLIT DE SALLE] pour "Base de Données..." - Lundi   │
└─────────────────────────────────────────────────────────┘
```

#### Visualisation
```
┌─────────────────────────────────────────────────────────┐
│ Visualisation de l'Emploi du Temps (Salle S102)        │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚠️ Base de Données Avancées                         │ │
│ │    Enseignant: J. Doe                               │ │
│ │    Filière: Master Info                             │ │
│ │    10:00 - 12:00                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⚠️ Réseaux Informatiques II                         │ │
│ │    Enseignant: A. Smith                             │ │
│ │    Filière: Licence Info                            │ │
│ │    10:00 - 12:00                                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### Solutions Suggérées
```
┌─────────────────────────────────────────────────────────┐
│ Solutions Suggérées                                     │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔄 Salle S201 disponible                            │ │
│ │    Déplacer "Base de Données Avancées" en salle     │ │
│ │    S201 au même horaire.                            │ │
│ │    [✓ Appliquer]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔄 Salle S105 disponible                            │ │
│ │    Déplacer "Réseaux Info" en salle S105 au même    │ │
│ │    horaire.                                         │ │
│ │    [✓ Appliquer]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⏰ Décaler à 14h                                     │ │
│ │    Déplacer "Base de Données" à Lundi à 14:00.      │ │
│ │    Salle S102 libre.                                │ │
│ │    [✓ Appliquer]                                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│ [✏️ Résolution Manuelle]                                │
└─────────────────────────────────────────────────────────┘
```

#### Résolution Manuelle
```
┌─────────────────────────────────────────────────────────┐
│ Résolution Manuelle                                     │
│ Modifier manuellement les affectations pour le cours   │
│ de "Base de Données Avancées".                          │
│                                                         │
│ Jour                                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Lundi ▼                                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Horaire                                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 10:00 - 12:00 ▼                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Salle                                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ S102 ▼                                              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [Ignorer]  [✓ Valider Changement]                      │
└─────────────────────────────────────────────────────────┘
```

## États de l'Interface

### État Vide (Aucun conflit sélectionné)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      ℹ️                                  │
│                                                         │
│              Sélectionnez un conflit                    │
│                                                         │
│    Choisissez un conflit dans la liste pour voir       │
│    les détails et les solutions suggérées.             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### État de Chargement
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      ⏳                                  │
│                                                         │
│            Chargement des conflits...                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### État Aucun Conflit
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      ✓                                  │
│                                                         │
│              Aucun conflit détecté                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Palette de Couleurs

```
Conflit de Salle       : 🔴 #dc2626 (Rouge)
Conflit Enseignant     : 🟠 #f59e0b (Orange)
Conflit Thermodynamique: 🔵 #3b82f6 (Bleu)
Succès                 : 🟢 #10b981 (Vert)
Primaire               : 🔵 #2563eb (Bleu)
Texte Principal        : ⚫ #0f172a (Noir)
Texte Secondaire       : ⚪ #64748b (Gris)
Fond                   : ⚪ #ffffff (Blanc)
Fond Clair             : ⚪ #f1f5f9 (Gris clair)
Bordure                : ⚪ #e2e8f0 (Gris)
```

## Responsive Breakpoints

```
Desktop  : > 1200px  → Layout 2 colonnes (420px | flexible)
Tablet   : 768-1200px → Layout 1 colonne
Mobile   : < 768px   → Layout 1 colonne + padding réduit
```
