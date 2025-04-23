# Liste des Voitures

## Description
Cet écran affiche la liste des véhicules appartenant au client. Il permet de visualiser rapidement l'ensemble des voitures et d'accéder aux détails de chacune.

## Éléments UI
- En-tête avec titre "Mes Véhicules" et bouton de retour
- Liste des voitures avec pour chaque véhicule:
  - Image/icône du modèle de voiture
  - Marque et modèle
  - Année et immatriculation
  - Indicateur de statut (normal, service à prévoir, etc.)
  - Flèche ou indicateur pour accéder aux détails
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Statut normal: #4CAF50 (vert)
  - Statut à surveiller: #FF9800 (orange)
  - Statut critique: #FF3A3A (rouge)
  - Texte: #333333 (gris foncé)
- **Typographie**:
  - Police principale: Roboto ou SF Pro (selon la plateforme)
  - Taille de titre: 20px
  - Taille de texte principal: 16px
  - Taille de texte secondaire: 14px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre éléments de liste: 12px
  - Padding interne des cartes: 16px

## Comportement
- Animation subtile lors du chargement de la liste
- Effet de pression sur les éléments de la liste
- Transition fluide vers l'écran de détails lors du tap
- Pull-to-refresh pour actualiser la liste
- Recherche ou filtrage optionnel en haut de la liste

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Mes Véhicules                │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [🚗]                    │    │
│  │ Renault Clio            │    │
│  │ 2022 - AB-123-CD     ● │    │
│  │                     →   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ [🚙]                    │    │
│  │ Peugeot 3008            │    │
│  │ 2020 - EF-456-GH     ● │    │
│  │                     →   │    │
│  └─────────────────────────┘    │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```

Note: Le point de couleur (●) indique le statut du véhicule (vert = normal, orange = service à prévoir, rouge = attention requise)
