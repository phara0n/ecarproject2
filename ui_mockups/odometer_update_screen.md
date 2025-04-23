# Écran de Mise à Jour du Kilométrage

## Description
Cet écran permet au client de mettre à jour le compteur kilométrique de son véhicule. Cette fonctionnalité est essentielle pour que le système puisse prédire avec précision les services à venir.

## Éléments UI
- En-tête avec titre "Mise à jour kilométrage" et bouton de retour
- Information sur le véhicule concerné (marque, modèle)
- Affichage du kilométrage actuel enregistré
- Champ de saisie numérique pour le nouveau kilométrage
- Option pour ajouter une photo du compteur (preuve)
- Bouton de validation
- Note explicative sur l'importance de la mise à jour
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Accent: #4CAF50 (vert pour validation)
  - Texte: #333333 (gris foncé)
- **Typographie**:
  - Police principale: Roboto ou SF Pro (selon la plateforme)
  - Taille de titre: 20px
  - Taille de texte principal: 16px
  - Taille de texte secondaire: 14px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre éléments: 20px
  - Padding interne des cartes: 16px

## Comportement
- Validation du champ numérique (doit être supérieur au kilométrage actuel)
- Clavier numérique automatiquement affiché
- Animation de confirmation après validation réussie
- Retour automatique à l'écran précédent après validation

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Mise à jour kilométrage      │
│                                 │
│  Renault Clio - AB-123-CD       │
│                                 │
│  Kilométrage actuel:            │
│  25,430 km                      │
│                                 │
│  Nouveau kilométrage:           │
│  ┌─────────────────────────┐    │
│  │ 26,540                  │    │
│  └─────────────────────────┘    │
│                                 │
│  [📷 Ajouter une photo]         │
│                                 │
│  ┌─────────────────────────┐    │
│  │      VALIDER            │    │
│  └─────────────────────────┘    │
│                                 │
│  Note: La mise à jour régulière │
│  du kilométrage permet de       │
│  prédire les services à venir.  │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
