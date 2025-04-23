# Tableau de Bord Client

## Description
Le tableau de bord est l'écran principal après la connexion. Il offre une vue d'ensemble des informations importantes pour le client et sert de point de navigation vers les autres sections de l'application.

## Éléments UI
- En-tête avec nom du client et photo de profil (optionnelle)
- Carte résumé du nombre de véhicules
- Carte résumé des services à venir (prédictions)
- Carte résumé des factures récentes
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
  - Taille de titre principal: 24px
  - Taille de sous-titre: 18px
  - Taille de texte standard: 16px
  - Taille de texte secondaire: 14px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre cartes: 16px
  - Padding interne des cartes: 16px

## Comportement
- Animation subtile lors du chargement des données
- Cartes cliquables redirigeant vers les sections correspondantes
- Pull-to-refresh pour actualiser les données
- Badges de notification sur les icônes de navigation

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  Bonjour, [Nom Client]    [👤]  │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Mes Véhicules           │    │
│  │                         │    │
│  │ 2 voitures              │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Services à prévoir    ! │    │
│  │                         │    │
│  │ 1 service recommandé    │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ Dernières Factures      │    │
│  │                         │    │
│  │ 3 factures récentes     │    │
│  │                    →    │    │
│  └─────────────────────────┘    │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
