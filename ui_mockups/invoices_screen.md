# Écran des Factures

## Description
Cet écran présente l'historique des factures payées par le client. Il permet de consulter et télécharger les factures liées aux services effectués sur les véhicules.

## Éléments UI
- En-tête avec titre "Mes Factures" et bouton de retour
- Filtres optionnels (par date, par véhicule, par montant)
- Liste des factures avec pour chaque facture:
  - Date de la facture
  - Numéro de facture
  - Véhicule concerné
  - Montant total
  - Type de service
  - Statut (payée)
  - Bouton pour télécharger/visualiser la facture
- Barre de navigation en bas de l'écran

## Spécifications de design
- **Palette de couleurs**: 
  - Couleur principale: #3E64FF (bleu)
  - Couleur secondaire: #F5F7FA (gris clair)
  - Accent: #4CAF50 (vert pour les factures payées)
  - Texte: #333333 (gris foncé)
  - Texte secondaire: #757575 (gris moyen)
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
- Défilement fluide pour les listes longues
- Pull-to-refresh pour actualiser la liste
- Ouverture de la facture en PDF dans une visionneuse intégrée
- Possibilité de partager la facture (email, message, etc.)

## Accessibilité
- Contraste élevé entre le texte et l'arrière-plan
- Taille de texte ajustable
- Support pour lecteurs d'écran
- Étiquettes descriptives pour tous les éléments interactifs

## Maquette descriptive
```
┌─────────────────────────────────┐
│                                 │
│  ← Mes Factures                 │
│                                 │
│  [Tous ▼] [Filtrer ▼]           │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 15 Mars 2025            │    │
│  │ Facture #F2025-103      │    │
│  │ Renault Clio            │    │
│  │ Révision complète       │    │
│  │ 250 € ✓ Payée           │    │
│  │                         │    │
│  │ [📄 Voir facture]       │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 10 Décembre 2024        │    │
│  │ Facture #F2024-089      │    │
│  │ Renault Clio            │    │
│  │ Changement pneus hiver  │    │
│  │ 400 € ✓ Payée           │    │
│  │                         │    │
│  │ [📄 Voir facture]       │    │
│  └─────────────────────────┘    │
│                                 │
│  [🏠]    [🚗]    [🔧]    [📄]   │
└─────────────────────────────────┘
```
