# Détails d'une Voiture

## Description
Cet écran présente les informations détaillées d'un véhicule spécifique. Il permet au client de consulter toutes les caractéristiques de sa voiture ainsi que d'accéder aux services associés.

## Éléments UI
- En-tête avec marque et modèle du véhicule et bouton de retour
- Image/illustration du véhicule
- Section d'informations générales (année, immatriculation, kilométrage)
- Bouton pour mettre à jour le compteur kilométrique
- Section technique (motorisation, puissance, transmission)
- Onglets ou sections pour accéder à:
  - Historique des services
  - Services à prévoir
  - Documents (carte grise, assurance, etc.)
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Accent: #4CAF50 (vert pour les statuts positifs)
  - Alerte: #FF9800 (orange pour les notifications)
  - Texte: #333333 (gris foncé)
- **Typographie**:
  - Police principale: Roboto ou SF Pro (selon la plateforme)
  - Taille de titre: 20px
  - Taille de sous-titre: 18px
  - Taille de texte principal: 16px
  - Taille de texte secondaire: 14px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre sections: 24px
  - Padding interne des cartes: 16px

## Comportement
- Animation subtile lors du chargement des données
- Défilement fluide pour les informations dépassant l'écran
- Onglets ou boutons pour basculer entre les différentes sections
- Possibilité de zoomer sur l'image du véhicule

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Renault Clio                 │
│                                 │
│        [IMAGE VOITURE]          │
│                                 │
│  Informations générales         │
│  ──────────────────────────     │
│  Année: 2022                    │
│  Immatriculation: AB-123-CD     │
│  Kilométrage: 25,430 km         │
│  [Mettre à jour kilométrage]    │
│                                 │
│  Caractéristiques techniques    │
│  ──────────────────────────     │
│  Motorisation: Essence          │
│  Puissance: 100 ch              │
│  Transmission: Manuelle         │
│                                 │
│  [Historique] [À prévoir] [Docs]│
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
