# Historique des Services

## Description
Cet écran présente l'historique des services et interventions effectués sur un véhicule spécifique. Il permet au client de consulter chronologiquement tous les services passés.

## Éléments UI
- En-tête avec titre "Historique des Services" et bouton de retour
- Filtres optionnels (par date, type de service)
- Liste chronologique des services avec pour chaque service:
  - Date du service
  - Type de service (entretien régulier, réparation, etc.)
  - Description courte
  - Kilométrage au moment du service
  - Coût du service
  - Indicateur d'expansion pour voir plus de détails
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Accent: #4CAF50 (vert pour les services complétés)
  - Texte: #333333 (gris foncé)
  - Texte secondaire: #757575 (gris moyen)
- **Typographie**:
  - Police principale: Roboto ou SF Pro (selon la plateforme)
  - Taille de titre: 20px
  - Taille de texte principal: 16px
  - Taille de texte secondaire: 14px
  - Taille de texte tertiaire: 12px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre éléments de liste: 16px
  - Padding interne des cartes: 16px

## Comportement
- Animation subtile lors du chargement de la liste
- Expansion/réduction des détails de service au tap
- Défilement fluide pour les listes longues
- Pull-to-refresh pour actualiser la liste
- Possibilité de filtrer ou rechercher des services spécifiques

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Historique des Services      │
│                                 │
│  [Tous ▼]  [Filtrer par date ▼] │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 15 Mars 2025            │    │
│  │ Révision complète       │    │
│  │ 20,000 km               │    │
│  │ 250 €                ▼  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10 Décembre 2024        │    │
│  │ Changement pneus hiver  │    │
│  │ 15,500 km               │    │
│  │ 400 €                ▼  │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 5 Août 2024             │    │
│  │ Vidange huile moteur    │    │
│  │ 10,000 km               │    │
│  │ 120 €                ▼  │    │
│  └─────────────────────────┘    │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
