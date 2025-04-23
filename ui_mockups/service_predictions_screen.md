# Prédictions de Services

## Description
Cet écran présente les services à venir recommandés pour un véhicule spécifique. Il permet au client d'anticiper les entretiens nécessaires et de planifier ses dépenses.

## Éléments UI
- En-tête avec titre "Services à Prévoir" et bouton de retour
- Liste des services prédits avec pour chaque service:
  - Type de service
  - Date ou kilométrage estimé
  - Priorité (urgent, recommandé, optionnel)
  - Coût estimé
  - Description courte
  - Bouton ou lien pour plus d'informations
- Indicateurs visuels de priorité (code couleur, icônes)
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Urgent: #FF3A3A (rouge)
  - Recommandé: #FF9800 (orange)
  - Optionnel: #4CAF50 (vert)
  - Texte: #333333 (gris foncé)
- **Typographie**:
  - Police principale: Roboto ou SF Pro (selon la plateforme)
  - Taille de titre: 20px
  - Taille de texte principal: 16px
  - Taille de texte secondaire: 14px
- **Espacement**:
  - Marge extérieure: 16px
  - Espacement entre éléments de liste: 16px
  - Padding interne des cartes: 16px

## Comportement
- Animation subtile lors du chargement de la liste
- Expansion/réduction des détails au tap
- Défilement fluide pour les listes longues
- Possibilité de marquer comme "vu" ou "à ignorer"

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Services à Prévoir           │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ⚠️ URGENT               │    │
│  │ Remplacement plaquettes │    │
│  │ de frein                │    │
│  │ D'ici: 500 km ou 2 sem. │    │
│  │ Coût estimé: 180 €      │    │
│  │                         │    │
│  │ [Plus d'infos]          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ⚠️ RECOMMANDÉ           │    │
│  │ Vidange et filtre       │    │
│  │ D'ici: 2,000 km         │    │
│  │ Coût estimé: 120 €      │    │
│  │                         │    │
│  │ [Plus d'infos]          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ ✓ OPTIONNEL             │    │
│  │ Contrôle climatisation  │    │
│  │ Recommandé avant l'été  │    │
│  │ Coût estimé: 60 €       │    │
│  │                         │    │
│  │ [Plus d'infos]          │    │
│  └─────────────────────────┘    │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
