# 📖 Guide d'Utilisation - Gestion des Conflits

## 🎯 Objectif

La page de Gestion des Conflits permet aux administrateurs de détecter, analyser et résoudre les conflits d'horaires dans le système Timora de manière intuitive et efficace.

## 🚀 Accès à la Page

### Via le Menu de Navigation
1. Connectez-vous en tant qu'administrateur
2. Dans le menu latéral gauche, cliquez sur **"Conflits"** (icône ⚠️)
3. Vous serez redirigé vers `/admin/conflicts`

### Via l'URL Directe
Accédez directement à : `http://localhost:4200/admin/conflicts`

## 📋 Interface Utilisateur

### Vue d'Ensemble

L'interface est divisée en deux panneaux principaux :

```
┌──────────────────────┬──────────────────────────────────┐
│   LISTE DES          │   DÉTAILS DU CONFLIT             │
│   CONFLITS           │   SÉLECTIONNÉ                    │
│   (Gauche)           │   (Droite)                       │
└──────────────────────┴──────────────────────────────────┘
```

## 🔍 Recherche et Filtrage

### Barre de Recherche
- Tapez le nom d'un enseignant, d'un cours ou d'une salle
- La recherche est instantanée (pas besoin d'appuyer sur Entrée)
- Les résultats se mettent à jour en temps réel

### Filtres Disponibles

#### 1. Type de Conflit
- **Tous** : Affiche tous les types de conflits
- **Conflit de Salle** : Deux cours dans la même salle
- **Conflit Enseignant** : Un enseignant sur deux cours simultanés
- **Conflit Thermodynamique** : Conflit spécifique aux salles de thermo

#### 2. Par Date
- Filtrez les conflits par date spécifique
- Sélectionnez une date dans la liste déroulante

## 📊 Liste des Conflits

### Carte de Conflit

Chaque conflit est affiché sous forme de carte contenant :

```
┌─────────────────────────────────────────────────┐
│ 🏢 [TYPE DE CONFLIT]                            │
│                                                 │
│ Titre du conflit                                │
│ 📅 Jour Date - Horaire                          │
│ Description détaillée                           │
└─────────────────────────────────────────────────┘
```

### Codes Couleur

- 🔴 **Rouge** : Conflit de Salle (priorité haute)
- 🟠 **Orange** : Conflit Enseignant (priorité moyenne)
- 🔵 **Bleu** : Conflit Thermodynamique (priorité basse)

### Sélection d'un Conflit

1. Cliquez sur une carte de conflit
2. La carte devient active (bordure bleue)
3. Les détails s'affichent dans le panneau de droite

## 📝 Détails du Conflit

### Visualisation de l'Emploi du Temps

Affiche les cours en conflit avec :
- Nom du cours
- Enseignant assigné
- Filière/Classe concernée
- Horaire exact

### Exemple
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Base de Données Avancées                     │
│    Enseignant: J. Doe                           │
│    Filière: Master Info                         │
│    10:00 - 12:00                                │
└─────────────────────────────────────────────────┘
```

## ✅ Résolution des Conflits

### Option 1 : Solutions Suggérées

Le système propose automatiquement des solutions optimales :

#### Types de Solutions

1. **Changement de Salle** 🔄
   - Propose une salle disponible au même horaire
   - Faisabilité : HAUTE
   - Impact minimal sur l'emploi du temps

2. **Changement d'Horaire** ⏰
   - Décale le cours à un autre créneau
   - Faisabilité : MOYENNE
   - Vérifie la disponibilité de la salle

3. **Replanification** 📅
   - Déplace le cours à un autre jour
   - Faisabilité : VARIABLE
   - Impact plus important

#### Appliquer une Solution

1. Lisez la description de la solution
2. Vérifiez l'impact mentionné
3. Cliquez sur le bouton **"Appliquer"**
4. Confirmez l'action
5. Le conflit est résolu automatiquement

### Option 2 : Résolution Manuelle

Si les solutions automatiques ne conviennent pas :

#### Étapes

1. Cliquez sur **"✏️ Résolution Manuelle"**
2. Un formulaire s'affiche avec trois champs :

   **Jour**
   ```
   ┌─────────────────────────────────────┐
   │ Lundi ▼                             │
   └─────────────────────────────────────┘
   ```

   **Horaire**
   ```
   ┌─────────────────────────────────────┐
   │ 10:00 - 12:00 ▼                     │
   └─────────────────────────────────────┘
   ```

   **Salle**
   ```
   ┌─────────────────────────────────────┐
   │ S102 ▼                              │
   └─────────────────────────────────────┘
   ```

3. Modifiez les valeurs selon vos besoins
4. Cliquez sur **"✓ Valider Changement"**
5. Le conflit est résolu avec vos paramètres

#### Annulation

- Cliquez sur **"Ignorer"** pour annuler la résolution manuelle
- Vous revenez à la vue des solutions suggérées

## 🎨 Interactions et Animations

### Effets Visuels

- **Hover** : Les cartes s'élèvent légèrement au survol
- **Active** : La carte sélectionnée a une bordure bleue
- **Transitions** : Toutes les animations sont fluides (0.25s)
- **Loading** : Un spinner s'affiche pendant le chargement

### Micro-interactions

- ✨ Apparition progressive des éléments (fade-in)
- 🎯 Pulse sur les badges d'erreur
- 🔄 Rotation du bouton de fermeture au survol
- 📊 Élévation des boutons au survol

## 📱 Responsive Design

### Desktop (> 1200px)
- Layout en 2 colonnes
- Liste des conflits : 420px
- Détails : Flexible

### Tablet (768px - 1200px)
- Layout en 1 colonne
- Liste des conflits en haut
- Détails en bas

### Mobile (< 768px)
- Layout optimisé
- Padding réduit
- Boutons adaptés

## ⚠️ États de l'Interface

### Aucun Conflit Sélectionné
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ℹ️                            │
│                                                 │
│          Sélectionnez un conflit                │
│                                                 │
│  Choisissez un conflit dans la liste pour       │
│  voir les détails et les solutions suggérées.   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Chargement en Cours
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ⏳                            │
│                                                 │
│        Chargement des conflits...               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Aucun Conflit Détecté
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ✓                            │
│                                                 │
│          Aucun conflit détecté                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 💡 Conseils d'Utilisation

### Bonnes Pratiques

1. **Résolvez les conflits par priorité**
   - Rouge (Salle) : Priorité HAUTE
   - Orange (Enseignant) : Priorité MOYENNE
   - Bleu (Thermo) : Priorité BASSE

2. **Privilégiez les solutions suggérées**
   - Elles sont optimisées par l'algorithme
   - Elles minimisent l'impact sur l'emploi du temps

3. **Vérifiez l'impact avant d'appliquer**
   - Lisez la description de la solution
   - Assurez-vous qu'elle convient à votre contexte

4. **Utilisez la résolution manuelle en dernier recours**
   - Seulement si les solutions automatiques ne conviennent pas
   - Vérifiez manuellement les disponibilités

### Raccourcis

- **Recherche rapide** : Tapez directement dans la barre de recherche
- **Filtrage rapide** : Utilisez les filtres pour affiner les résultats
- **Navigation** : Cliquez sur les cartes pour naviguer entre les conflits

## 🔧 Dépannage

### Problème : Les conflits ne s'affichent pas

**Solution** :
1. Vérifiez votre connexion internet
2. Actualisez la page (F5)
3. Vérifiez que vous êtes connecté en tant qu'administrateur

### Problème : La résolution ne fonctionne pas

**Solution** :
1. Vérifiez que vous avez sélectionné une solution
2. Assurez-vous que les données sont valides
3. Contactez le support technique si le problème persiste

### Problème : L'interface est lente

**Solution** :
1. Fermez les onglets inutiles
2. Videz le cache du navigateur
3. Utilisez un navigateur moderne (Chrome, Firefox, Edge)

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@timora.com
- 📱 Téléphone : +XXX XXX XXX XXX
- 💬 Chat : Disponible dans l'application

## 🎓 Formation

Des sessions de formation sont disponibles pour :
- Découvrir toutes les fonctionnalités
- Apprendre les meilleures pratiques
- Optimiser votre utilisation

Contactez votre administrateur système pour plus d'informations.

---

**Version** : 1.0.0
**Dernière mise à jour** : 26 Mars 2026
