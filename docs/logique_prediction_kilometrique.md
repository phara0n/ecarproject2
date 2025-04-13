# Logique de Prédiction Kilométrique - ECAR

## Vue d'ensemble

Le système de prédiction kilométrique est conçu pour anticiper quand un véhicule aura besoin de différents types de services (vidange, révision, etc.) en se basant sur deux critères principaux :
1. Le temps écoulé depuis le dernier service
2. Le kilométrage actuel et projeté du véhicule

## Architecture du système

Le système fonctionne avec quatre composants principaux :

1. **ServiceEvent** : Enregistre les événements de service (vidanges, révisions...)
2. **MileageRecord** : Enregistre les relevés kilométriques des véhicules
3. **ServiceType** : Définit les différents types de service disponibles
4. **PredictionRule** : Règles de maintenance pour chaque type de service
5. **ServicePrediction** : Prédictions générées pour les services futurs

## Flux de travail

### 1. Déclencheurs du système

Le système utilise des "signals" (déclencheurs) Django pour mettre à jour automatiquement les prédictions :

```
--- ServiceEvent SIGNAL HANDLER FIRED ---
```
Déclenché à chaque fois qu'un nouvel événement de service est créé ou mis à jour.

```
--- MileageRecord SIGNAL HANDLER FIRED ---
```
Déclenché à chaque fois qu'un nouveau relevé kilométrique est enregistré.

### 2. Calcul de la moyenne quotidienne de kilométrage

Pour chaque véhicule, le système calcule une moyenne quotidienne de kilométrage :

```
Avg daily KM = (Latest Mileage - Earliest Mileage) / Number of Days
```

Si le véhicule est nouveau ou manque de données historiques :
```
DEBUG: Avg daily KM for vehicle 7 remains 0.00. No update needed.
```

### 3. Processus de prédiction

Pour chaque type de service (vidange, révision, etc.), le système calcule deux dates possibles :

#### a. RuleDate
Date basée sur des règles fixes, comme "1 an après le dernier service" ou "tous les 15 000 km".
```
DEBUG: V:7 S:1 - RuleDate:2026-04-13
```
Dans cet exemple, la RuleDate est exactement 1 an après le dernier service (13/04/2025 → 13/04/2026).

#### b. EstDate
Date estimée en fonction du kilométrage moyen quotidien du véhicule. 
```
DEBUG: V:7 S:1 - EstDate:None
```
Dans cet exemple, comme la moyenne quotidienne est 0 km/jour (véhicule neuf ou peu utilisé), l'EstDate ne peut pas être calculée.

#### c. FinalDate
Le système choisit la date la plus proche entre RuleDate et EstDate (si les deux existent).
```
DEBUG: V:7 S:1 - FinalDate:2026-04-13
```

#### d. Prédiction finale
```
DEBUG: Prediction for 'Vidange' V:7 created. Due Mileage: 11020, Due Date: 2026-04-13
```
Le système génère une prédiction complète avec :
- Type de service : 'Vidange'
- Véhicule ID : 7
- Kilométrage prévu : 11020 km
- Date prévue : 13/04/2026

### 4. Création automatique de MileageRecord

Si c'est le premier ServiceEvent pour un véhicule sans MileageRecord existant, le système en crée un automatiquement :
```
DEBUG: First ServiceEvent for Vehicle 7 and no existing MileageRecords. Creating one.
```

## Cas d'utilisation

### Cas 1 : Véhicule neuf ou peu utilisé
Pour un véhicule avec peu d'historique et une moyenne quotidienne de 0 km/jour, les prédictions sont basées uniquement sur les règles temporelles (ex: vidange annuelle).

### Cas 2 : Véhicule avec historique substantiel
Pour un véhicule avec suffisamment de données historiques, le système utilise à la fois les règles temporelles et les projections kilométriques, choisissant la méthode qui prévoit le service le plus tôt.

### Cas 3 : Mise à jour après nouveau kilométrage
Chaque fois qu'un nouveau kilométrage est enregistré, le système recalcule automatiquement toutes les prédictions pour tenir compte des nouvelles habitudes d'utilisation.

## Tables impliquées

1. **Vehicle** : Informations de base sur les véhicules
2. **ServiceType** : Types de services (vidange, révision, etc.)
3. **ServiceEvent** : Historique des services effectués
4. **MileageRecord** : Historique des relevés kilométriques
5. **PredictionRule** : Règles de prédiction (ex: vidange tous les 10 000 km ou 1 an)
6. **ServicePrediction** : Prédictions générées par le système

## Interface dans l'application

L'interface utilisateur affiche ces prédictions sous forme de décomptes :
- *"Vidange dans 1 200 km (~14 jours)"*
- *"Révision dans 320 jours"*

## Limites actuelles

1. Pour les nouveaux véhicules sans historique, les prédictions sont moins précises
2. Le système ne prend pas en compte les variations saisonnières d'utilisation
3. Les prédictions sont plus précises avec davantage de points de données kilométriques 