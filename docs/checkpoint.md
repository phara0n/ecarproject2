# E-Car Admin Portal - Development Checkpoint
**Last Updated: 18 Avril 2025**

## Project Status
- **Status**: Stable (local production)
- **Frontend**: Build Vite OK, corrections récentes sur FacturesPage, Zod, date-fns, imports, etc.
- **Backend**: Django 5.2, Whitenoise OK, DEBUG=False, admin UI fonctionnelle

## Component Status
| Component | Status | Notes |
|-----------|--------|-------|
| Login Screen | ✅ Working | Authentification OK |
| Vehicle Details Modal | ✅ Working | Mode édition/affichage, corrections contrastes |
| Vehicles List | ✅ Working | Pagination, filtre, accès édition |
| Customers Management | ✅ Working | Création, édition, suppression clients OK |
| Service Events | ✅ Working | Ajout/édition OK, Zod v4, date-fns corrigés |
| Service History | 🚧 En cours | Vue calendrier en développement |
| Invoices | ✅ Working | Affichage, téléchargement, gestion dynamique des champs |
| Notifications | 🚧 Non commencé | À planifier |

## API Integration Status
| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/v1/token/` | ✅ Working | Authentification OK |
| `/api/v1/token/refresh/` | ✅ Working | Refresh token OK |
| `/api/v1/vehicles/` | ✅ Working | Données véhicules OK |
| `/api/v1/services/` | ✅ Working | Événements service OK |
| `/api/v1/users/customers/` | ✅ Working | Liste clients OK |
| `/api/v1/register/` | ✅ Working | Création client OK |
| `/api/v1/users/{id}/` | ✅ Working | Édition/suppression client OK |
| `/api/v1/invoices/` | ✅ Working | Factures OK |
| `/api/v1/users/{id}/reset-password/` | 🔄 À tester | Frontend prêt, backend à valider |

## Recent Fixes
- Nettoyage imports inutiles (React, ReactNode, etc.)
- Correction Zod v4 (erreurs, schémas, validations)
- Correction imports date-fns (format, parse)
- FacturesPage : gestion dynamique des champs, robustesse
- Correction modale véhicules (édition, accessibilité)
- Correction gestion erreurs API (redirection login, feedback utilisateur)
- Migration avancée Axios → Ky (reste à supprimer axios du projet)

## Dependencies (Frontend)
- React 19, Ky 1.8, Shadcn UI, Radix UI, Tailwind 4, Zod 4, react-hook-form, react-router-dom 7

## Dependencies (Backend)
- Django 5.2, DRF 3.16, simplejwt, drf-yasg, psycopg2-binary

## Next Steps
- [Frontend] Finaliser migration Axios → Ky (suppression axios)
- [Frontend] UI/UX tests, robustesse gestion erreurs, suppression dépendances inutiles
- [Frontend] Finaliser vue calendrier services, tests FacturesPage (suppression, edge cases)
- [Backend] Tester endpoint reset-password, logs Gunicorn, sécurité production
- [Backend] Préparer déploiement préprod (Nginx, domaine, sécurité)
- [Docs] Mettre à jour guides techniques et d'installation

## Known Issues
- Quelques incohérences endpoints API (naming)
- Certains formulaires : validation à renforcer
- Peer deps à surveiller (legacy)
- Couleurs/contraste UI à tester en profondeur

---
*Voir for_mehd.md pour un résumé détaillé et les prochaines actions prioritaires.*

## Nouveauté : Rafraîchissement automatique de la liste clients
- Après édition ou suppression d'un client, la liste se met à jour automatiquement sans rechargement manuel.
- Implémentation via un callback `refreshClients` passé par le contexte et déclenché dans les modales.
- `ClientTable` écoute un `refreshKey` pour relancer la récupération des données.

## Migration Axios → Ky
- La migration du client HTTP Ky est en cours (Axios encore présent dans le package.json, à supprimer totalement prochainement).
- Tous les nouveaux composants doivent utiliser Ky exclusivement.

## Dépendances principales (18 août 2024)
- Frontend : React 19, Ky 1.8, Shadcn UI, Radix UI, Tailwind 4, Zod 4, react-hook-form, react-router-dom 7, etc.
- Backend : Django 5.2, DRF 3.16, simplejwt, drf-yasg, psycopg2-binary, etc.

## Prochaines étapes
- Finaliser la migration Axios → Ky (suppression d'Axios)
- Ajouter des tests d'intégration pour la gestion client
- Continuer la granularisation des composants client
- Mettre à jour la documentation technique

## Technical Updates (14 Avril 2025)

### HTTP Client Migration: From Axios to Ky

We're transitioning from Axios to Ky as our HTTP client for several key reasons:

1. **Improved Performance**: 
   - Ky is significantly smaller (~7KB vs Axios's larger footprint)
   - Built on modern Fetch API instead of XMLHttpRequest
   - Reduced bundle size improves initial load times

2. **Better TypeScript Support**:
   - First-class TypeScript integrations
   - More accurate type definitions
   - Improved developer experience with better IDE assistance

3. **Modern Promise Handling**:
   - Simpler API for response handling with `.json()`, `.text()`, etc.
   - Cleaner error handling patterns
   - Built-in retry functionality

4. **Authentication Improvements**:
   - More reliable token refresh mechanism
   - Less prone to race conditions during concurrent requests
   - More straightforward request interception

The migration follows a phased approach:
- Created HTTP client standards documentation
- Updated authentication provider to use Ky
- Component updates in progress
- Testing in development environment

Refer to the new [`http_client_standards.md`](./http_client_standards.md) document for implementation details and migration guidelines.

## Immediate Tasks

1. **Backend API Development**:
   - Implement the password reset endpoint at `/api/v1/users/{id}/reset-password/`
   - Add appropriate validation and security checks

2. **Service History**:
   - Implement service history view in vehicle details
   - Create filtering and sorting capabilities

3. **Mileage Management**:
   - Implement the ability to update current mileage for vehicles
   - Add mileage history tracking and visualization

## Known Issues

1. **API Endpoint Pattern Inconsistencies**:
   - Some endpoints follow `/api/v1/entity/` while others use `/api/v1/entity-name/`
   - We need to standardize this pattern across the application

2. **Password Management**:
   - Need to verify that the password reset endpoint exists on backend
   - May need to adjust the implementation based on actual backend behavior

3. **Data Validation**:
   - Phone number validation needs to be more consistent
   - Date formatting needs standardization across all components

## Dependencies
- React 18.2.0
- Material UI 5.14.0
- Ky 1.2.0
- React Hook Form 7.45.1
- Django 4.2.2
- Django REST Framework 3.14.0

## Testing Status
- Unit tests: Partial coverage
- Integration tests: Limited
- End-to-end tests: Not implemented yet

## Next Planned Update
- Implement backend API endpoints for user management
- Complete service history in vehicle details
- Add comprehensive form validation

## État Actuel du Développement (17 Août 2024)

### Vue d'ensemble
- **Frontend (Admin Web)**: ~75% terminé - Focus sur les améliorations UI, migration HTTP client et corrections de bugs
- **Backend (Django)**: ~85% terminé - API fonctionnelle pour les clients, véhicules et services
- **Documentation**: ~70% terminée - Documentation technique et guides en cours de mise à jour

### Fonctionnalités Récemment Finalisées
- Correction du formulaire d'ajout d'événement de service
- Correction de l'erreur de pagination dans CustomersPage
- Amélioration de la gestion des profils utilisateurs
- Ajout de logs détaillés pour faciliter le débogage
- Correction de la gestion de session : redirection automatique vers /login si token absent/invalide (conformité sécurité/règles projet)
- Correction dans AddServiceEventForm : redirection automatique vers /login en cas d'erreur d'authentification API

### En Cours de Développement
- Migration complète d'Axios vers Ky comme client HTTP
- Implémentation de la vue calendrier pour les services
- Amélioration des validations avec Zod v4

### Problèmes Connus
- Quelques problèmes de contraste UI en mode sombre
- Inconsistances dans les endpoints API
- Certaines dépendances nécessitent le flag `--legacy-peer-deps`
- À surveiller : retours utilisateurs sur la déconnexion automatique et tests sur toutes les routes protégées

### Prochaines Étapes
1. Finaliser la migration Axios vers Ky
2. Compléter l'implémentation de la vue calendrier
3. Améliorer la validation des formulaires avec Zod v4
4. Standardiser le formatage dans tous les composants
5. Tests d'intégration pour les fonctionnalités critiques

### Dépendances
- React 18.2.0
- Material UI 5.14.0
- Ky 1.2.0 (en cours de migration depuis Axios)
- React Hook Form 7.45.1
- Django 4.2.2
- Django REST Framework 3.14.0

## Corrections récentes (14 Avril 2024)

### 1. Standardisation des formats de données

- **Dates**: Implémentation d'une fonction `formatDate` standardisée utilisant le format français JJ/MM/AAAA
- **Nombres**: Formatage cohérent avec espaces comme séparateurs de milliers via `formatNumber`
- **Devise**: Support du format tunisien XXX,XX DT via `formatCurrency`
- **Téléphone**: Fonction `formatPhone` assurant le format +216 XX XXX XXX
- **Plaques d'immatriculation**: Validation et formatage des plaques tunisiennes via `formatLicensePlate`

### 2. Amélioration de l'accessibilité et localisation

- Correction des textes anglais restants dans les composants d'interface
- Remplacement des mentions "Close" par "Fermer" dans les modales
- Amélioration du contraste des modales en mode sombre
- Support complet ARIA pour les dialogues

### 3. Dépendances et composants UI

- Installation de `@radix-ui/react-tooltip` avec `--legacy-peer-deps` pour résoudre les conflits de dépendances
- Mise à jour du composant Dialog pour respecter les patterns de contraste
- Amélioration de la validation des plaques d'immatriculation avec Zod

Ces corrections permettent au projet de mieux respecter les exigences définies dans la documentation, notamment en termes de localisation française, formats spécifiques au marché tunisien, et accessibilité.

## Conformité aux exigences (14 Avril 2024)

### Points initialement non conformes corrigés

1. **Accessibilité WCAG AA**:
   - Amélioration des boutons avec focus visible et contraste adéquat
   - Implémentation de `ring-offset-2` et `focus-visible:ring-2` pour tous les éléments interactifs
   - Optimisation des couleurs pour respecter le ratio de contraste 4.5:1

2. **Pagination côté serveur**:
   - Implémentation de la pagination côté serveur pour les listes de clients
   - Support des paramètres `page` et `page_size` pour les appels API
   - Interface utilisateur avec navigation entre les pages et indication du nombre total d'éléments

3. **Calendrier des services avec drag-and-drop**:
   - Création d'une vue calendrier complète pour les services (jour, semaine, mois)
   - Intégration de la bibliothèque react-big-calendar avec support fr-FR
   - Fonctionnalité glisser-déposer pour réorganiser les services
   - Codes couleur selon le type de service et le statut

4. **Interface entièrement française**:
   - Remplacement systématique des textes anglais restants 
   - Localisation complète du calendrier et des composants de date
   - Format de date et heure adapté au standard français (JJ/MM/AAAA)

### Bénéfices apportés

- **Accessibilité**: Meilleure expérience pour les utilisateurs de technologies d'assistance
- **Expérience utilisateur**: Navigation plus intuitive et efficace dans les grandes listes
- **Planification visuelle**: Représentation visuelle claire des interventions sur un calendrier
- **Cohérence linguistique**: Interface homogène adaptée au marché tunisien francophone

### Dépendances ajoutées
- `react-big-calendar`: Implémentation du calendrier avec drag-and-drop
- `moment`: Support de localisation fr-FR et formatage de dates

## Lancement du Système (15 Août 2024)

### Serveurs Actifs
- **Backend Django**: Démarré sur http://0.0.0.0:8000
  - Environnement virtuel activé
  - API REST accessible
  - Serveur de développement en mode debug
- **Frontend React**: Démarré via npm run dev
  - Serveur de développement Vite
  - Interface accessible sur http://localhost:5173 (ou port similaire)

## HTTP Client Integration Fixes (20 Août 2024)

### Correction des problèmes d'appels API avec Ky

Suite à la migration d'Axios vers Ky, nous avons résolu plusieurs problèmes critiques dans les appels API qui causaient des erreurs 404 et des comportements inattendus :

1. **Format des chemins API** :
   - **Problème** : Les chemins d'API avec des barres obliques initiales (`/api/v1/...`) causaient des échecs de requête avec Ky
   - **Cause** : Contrairement à Axios, Ky avec l'option `prefixUrl` exige que les chemins n'aient pas de barre oblique initiale
   - **Solution** : Suppression systématique des barres obliques initiales dans tous les appels API

   ```javascript
   // ❌ INCORRECT avec Ky
   await authAxios.get('/api/v1/vehicles/');
   
   // ✅ CORRECT avec Ky
   await authAxios.get('api/v1/vehicles/');
   ```

2. **Fichiers corrigés** :
   - `CustomersPage.tsx` : Multiples appels API (GET, POST, PUT, DELETE)
   - `AddServiceEventForm.tsx` : Appels pour récupérer les types de service et créer des événements
   - `VehicleDetailsModal.tsx` : Mise à jour des informations des véhicules

3. **Documentation améliorée** :
   - Mise à jour de `http_client_standards.md` avec des directives claires et des exemples
   - Révision de `axios_to_ky_migration.md` avec un avertissement bien visible concernant ce problème
   - Exemples complets de gestion des erreurs et des réponses au format JSON

### Autres améliorations

1. **Gestion des erreurs standardisée** :
   - Support des différentes structures d'erreur API dans tous les composants
   - Extraction de messages d'erreur plus informatifs pour l'utilisateur

2. **Tests et vérifications** :
   - Mise en place de tests pour valider le bon fonctionnement des appels API
   - Vérification que toutes les fonctionnalités CRUD fonctionnent correctement avec Ky

### Impact

Ces corrections assurent une compatibilité complète avec le client HTTP Ky, garantissant que toutes les fonctionnalités de l'application fonctionnent comme prévu. Cette transition nous permet de bénéficier pleinement des avantages de Ky en termes de performance, de taille de bundle et de gestion des promesses, tout en maintenant la compatibilité avec notre API backend.

### Notes pour les développeurs

Pour tous les nouveaux composants ou modifications de composants existants, veillez à :
1. Utiliser `authAxios` du hook `useAuth()` pour tous les appels API
2. Ne jamais ajouter de barre oblique initiale dans les chemins d'API
3. Suivre les exemples dans `http_client_standards.md` pour la gestion des réponses JSON

## Prochaines étapes

1. **Tests d'interface utilisateur** :
   - Vérifier que toutes les fonctionnalités principales fonctionnent comme prévu
   - Tester les scénarios d'erreur pour s'assurer que la gestion des erreurs est robuste

2. **Documentation complète** :
   - Finaliser la documentation de migration pour les développeurs
   - Mettre à jour le guide des standards de code avec les nouvelles pratiques

3. **Optimisations de performance** :
   - Profiter des capacités de Ky pour implémenter des stratégies de mise en cache
   - Ajouter des fonctionnalités de retry pour les requêtes importantes

# Project Checkpoint - Infinite Loop and Import Issues

## Current State (Last Update: [Current Date])

### Authentication System Issues

1. **Infinite Loop Problem** - FIXED
   - Issue: `AuthProvider.tsx` was causing infinite loops due to improper dependency arrays in `useEffect` and `useCallback` hooks
   - Solution: 
     - Modified `refreshToken` function to remove unnecessary dependencies (`isAuthenticated` and `authAttempts`)
     - Wrapped `safeAuthAxios` in a `useMemo` hook with `authAxios` dependency
     - Ensured Axios interceptors are only set up once without unnecessary re-renders
     - Fixed proper token refreshing and state management logic

2. **Import Path Issues** - FIXED
   - Issue: Multiple components were importing the `useAuth` hook from the wrong file (`AuthProvider.tsx` instead of `AuthContext.tsx`)
   - Solution:
     - Fixed imports in all affected files to use `@/context/AuthContext` instead
     - Files fixed: `Header.tsx`, `LoginPage.tsx`, `AddVehicleModal.tsx`, `VehiclesPage.tsx`, `ServicesPage.tsx`, `CustomersPage.tsx`, `FacturesPage.tsx`
     - Confirmed that `useAuth` is properly exported from `AuthContext.tsx`

### Loading State Management
   - The `isLoading` state in `AuthProvider.tsx` is properly managed
   - `App.tsx` shows a loading indicator when authentication status is being checked
   - Routing is suspended until the initial authentication check is complete

## Next Steps

1. **Testing**
   - Test authentication flow thoroughly:
     - Fresh login
     - Session persistence through page refresh
     - Automatic token refreshing when expired
     - Proper redirection to login when unauthorized
     - Verify loading states work as expected

2. **Performance Optimization**
   - Consider further improvements to dependency arrays and state management to avoid unnecessary re-renders
   - Add debounce for rapidly changing states if needed
   - Evaluate overall authentication flow for efficiency improvements

3. **Error Handling**
   - Improve error handling and recovery for authentication failures
   - Add user-friendly error messages for common scenarios
   - Consider implementing a global error boundary or toast system

## Technical Implementation Details

### Key Files
- `AuthContext.tsx` - Defines context and exports `useAuth` hook
- `AuthProvider.tsx` - Implements the authentication logic
- `App.tsx` - Uses loading state to show appropriate UI

### Areas of Focus
- Proper dependency management for callbacks
- Careful token refreshing without loops
- Axios interceptor setup to handle token expiration properly

## Notes for the Team
- Remember to wait until `isLoading` is false before making auth-dependent API calls
- Always import `useAuth` from `@/context/AuthContext`, not from `AuthProvider.tsx`

# React Router Context Fix

## Current State (Last Update: [Current Date])

### Router Configuration Issue - FIXED

1. **React Router Context Error** - FIXED
   - **Issue**: Application crashed on startup with error: `useNavigate() may be used only in the context of a <Router> component`
   - **Root Cause**: Improper component hierarchy where `AuthProvider` (which uses `useNavigate()`) was not wrapped in a `Router` component
   - **Solution**:
     - Moved `BrowserRouter` from App.tsx to main.tsx to wrap the entire application
     - Removed duplicate Router in App.tsx to prevent nested router contexts
     - Maintained all routing configuration and protected routes

2. **Component Hierarchy Changes**
   - **Before**:
     ```jsx
     // main.tsx
     <StrictMode>
       <AuthProvider> // Error: useNavigate() used outside Router context
         <App /> // Contains Router inside
       </AuthProvider>
     </StrictMode>
     ```
   - **After**:
     ```jsx
     // main.tsx
     <StrictMode>
       <BrowserRouter>
         <AuthProvider> // Now within Router context
           <App /> // No longer contains Router
         </AuthProvider>
       </BrowserRouter>
     </StrictMode>
     ```

### Benefits
- Fixed application crash on startup
- Maintained proper React Router context throughout the application
- Preserved protected route functionality and navigation guards

## Next Steps

1. **Testing**
   - Verify navigation between pages works correctly
   - Confirm protected routes are still functioning properly
   - Test login/logout flow with redirection
   - Check that history navigation (back/forward) works as expected

2. **Future Refactoring**
   - Consider moving more router-related logic to a dedicated component
   - Evaluate if any components are unnecessarily re-rendering due to router changes

## Documentation de Déploiement (17 Août 2024)

Pour faciliter le déploiement et l'installation du projet, deux guides détaillés ont été créés:

1. **Guide de Déploiement en Production**:  
   Fichier: `docs/deployment_guide.md`
   - Instructions complètes pour déployer sur un serveur de production
   - Configuration de Nginx, PostgreSQL, Supervisord et Gunicorn
   - Sécurisation avec HTTPS via Certbot
   - Procédures de sauvegarde et maintenance

2. **Guide d'Installation pour Développement**:  
   Fichier: `docs/dev_setup.md`
   - Configuration de l'environnement de développement local
   - Instructions détaillées pour le backend et frontend
   - Création de données fictives pour le développement
   - Workflow Git recommandé et outils de debugging

Ces guides suivent les meilleures pratiques et assurent une installation cohérente et sécurisée du projet dans différents environnements.

### Statut Actuel du Déploiement

Nous avons actuellement:
- Un environnement de développement fonctionnel (documentation complète)
- Un processus de déploiement en production documenté (prêt à être implémenté)

Prochaines étapes:
- Automatiser davantage le processus de déploiement (scripts shell ou Ansible)
- Ajouter des tests automatisés pour le déploiement
- Configurer un pipeline CI/CD

## Deployment Infrastructure

### Docker Configuration (Màj: 18 Août 2024)

### Statut
- **Priorité**: Haute
- **Avancement global**: 80%

### Composants
| Composant | Statut | Notes |
|-----------|--------|-------|
| Backend Dockerfile | 90% | Manque configuration des variables d'environnement |
| Frontend Dockerfile | 75% | Optimisation du build en cours |
| Docker Compose | 80% | Configuration des réseaux et volumes en cours |
| Tests d'intégration | 60% | Tests initiaux effectués avec succès |
| Documentation | 40% | En cours de rédaction |

### Prochaines actions
- Finaliser les variables d'environnement pour le backend
- Optimiser le build du frontend (réduire taille image)
- Compléter la documentation des procédures de déploiement
- Réaliser des tests de charge avec Docker Compose

## VPS Pré-Production Setup (Màj: 18 Août 2024)

### Statut
- **Fournisseur**: DigitalOcean
- **Spécifications**: 4GB RAM, 2 vCPUs, 80GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Priorité**: Haute
- **Avancement**: 30%

### Logiciels requis
- Docker & Docker Compose
- Nginx (reverse proxy)
- Certbot (Let's Encrypt)
- Fail2ban
- UFW (Firewall)
- Outils de monitoring (à déterminer)

### Gestion des accès
- Accès SSH par clé (pas de mot de passe)
- Utilisateurs sudo limités
- Accès Git configuré pour CI/CD

### Tâches de déploiement
- [x] Sélection du fournisseur VPS
- [x] Définition des spécifications techniques
- [x] Création du plan de déploiement
- [ ] Installation et configuration initiale du serveur *(en cours)*
- [ ] Configuration de la sécurité du serveur
- [ ] Installation de Docker et dépendances
- [ ] Configuration des volumes persistants
- [ ] Mise en place des certificats SSL
- [ ] Configuration du reverse proxy
- [ ] Déploiement initial de l'application
- [ ] Configuration du monitoring
- [ ] Tests de charge
- [ ] Documentation des procédures

### Différences entre environnements

| Aspect | Développement | Pré-Production | Production |
|--------|---------------|----------------|------------|
| Données | Fictives / limitées | Anonymisées réelles | Réelles |
| Accès | Développeurs | Équipe + Client | Utilisateurs finaux |
| Mises à jour | Continues | Hebdomadaires | Planifiées |
| Monitoring | Minimal | Basique | Complet |
| Sécurité | Standard | Renforcée | Maximum |
| Domaine | localhost | preprod.ecar-project.com | ecar-project.com |
| Ressources | Variables | Limitées | Scalables |

### Timeline de déploiement
- **21 Août**: Finalisation des configurations Docker
- **23 Août**: Configuration initiale du VPS terminée
- **25 Août**: Premier déploiement sur pré-production
- **28 Août**: Tests complets et corrections des problèmes
- **31 Août**: Accès client pour revue

## Sécurité & conformité

- Ce comportement de redirection automatique est obligatoire pour la sécurité et l'expérience utilisateur (voir .cursor/rules/project_rules.mdc)

## 17 Août 2024 - Nouvelle Refonte Granulaire de la Page Client

### Découpage et organisation
- Création d'un dossier `src/pages/client/` pour la nouvelle page Client (remplaçant CustomersPage.tsx)
- Création d'un dossier `src/components/client/` pour tous les sous-composants (table, formulaire, modales, filtres, etc.)
- Objectif : meilleure maintenabilité, évolutivité, et respect des conventions du projet

### Plan de découpage
| Sous-composant         | Statut      | Notes |
|-----------------------|-------------|-------|
| Tableau principal     | 🚧 À créer  | Pagination, filtres, actions |
| Formulaire client     | 🚧 À créer  | Création/édition, validation Zod |
| Modales (ajout, edit, suppression, reset password) | 🚧 À créer | Utilisation des composants UI existants |
| Filtres avancés       | 🚧 À créer  | Recherche, statut, etc. |
| Helpers/formatteurs   | ✅ Existent | À réutiliser depuis utils/formatters.ts |

### Prochaines étapes
- Définir les interfaces TypeScript pour les clients et les formulaires
- Commencer par le tableau principal (affichage + pagination)
- Ajouter progressivement les autres sous-composants
- Mettre à jour la documentation à chaque étape

### 17 Août 2024 - Initialisation de la structure granulaire Client
- Fichiers créés :
  - `ClientPage.tsx` (point d'entrée)
  - `ClientTable.tsx`, `ClientFilters.tsx`, `ClientModals.tsx`, `ClientForm.tsx` (sous-composants)
  - `types.ts` (types Client/User, pagination)
- Prochaine étape : implémenter le tableau principal (affichage + pagination, récupération via Ky)

## Lancement Backend/Frontend - 18 avril 2025

### Backend (Django)
- Présence d'un venv Python dans `backend/.venv`.
- Problème rencontré : la commande `pip` globale n'est pas installée, mais le venv contient son propre pip.
- Solution :
  - Toujours activer le venv (`source .venv/bin/activate`) avant toute commande Python/pip.
  - Installer les dépendances dans le venv.
  - Lancer les migrations (`python manage.py migrate`) puis le serveur (`python manage.py runserver 0.0.0.0:8000`).

### Frontend (admin-web)
- Stack : React 19, Vite, Shadcn UI, Radix UI, Tailwind.
- Problème rencontré :
  - `npm install` échoue à cause d'un conflit de peer dependencies entre `react@19` et `react-day-picker@8.10.1` (qui ne supporte que jusqu'à React 18).
  - Malgré l'échec, `npm run dev` fonctionne et le serveur Vite démarre.
- Solution temporaire :
  - Utiliser `npm install --legacy-peer-deps` pour forcer l'installation.
  - Surveiller les bugs potentiels liés à ce conflit.
  - Prévoir une migration/downgrade de React ou attendre la compatibilité de `react-day-picker`.

### Prochaines étapes
- Documenter toute manipulation manuelle dans ce fichier et dans `for_mehd.md`.
- Ne pas ignorer les warnings npm, même si le dev server fonctionne.
- Toujours utiliser le venv Python pour le backend.

---

## [2024-08-18] Préparation Docker pour la production

### Décision
- Création d'un dossier `deploy/` à la racine pour isoler toute la configuration Docker de production.
- Aucun impact sur l'environnement de développement (pas de modification des .env, scripts ou configs locales).

### Fichiers prévus dans `deploy/`
- `Dockerfile.backend` : Backend Django (prod, Gunicorn, collectstatic)
- `Dockerfile.frontend` : Frontend React (build puis Nginx statique)
- `docker-compose.prod.yml` : Orchestration backend, frontend, PostgreSQL
- `.env.backend.prod.example` et `.env.frontend.prod.example` : Exemples d'env prod

### Étapes à réaliser
1. Générer les Dockerfile (backend, frontend) dans `deploy/`
2. Générer le `docker-compose.prod.yml` dans `deploy/`
3. Documenter la procédure complète dans `docs/dev_setup.md` et ici
4. Tester le build et le lancement en local (hors dev)
5. Adapter la doc de déploiement pour inclure la version Docker

### Points de vigilance
- Volumes pour les médias backend (factures, etc.)
- Configuration CORS et Nginx
- Sécurité des secrets (jamais versionner les .env réels)
- Aucun impact sur le dev local

---

# Checkpoint : Test Backend Django en Mode Production Local

## 1. Préparation de l'environnement
- Passer `DEBUG = False` dans `backend/core/settings.py`.
- Mettre `ALLOWED_HOSTS = ['localhost', '127.0.0.1']`.
- Vérifier la connexion PostgreSQL (base : `ecardb`, user : `ecaruser`).

## 2. Installation Gunicorn
```bash
cd backend
source .venv/bin/activate
pip install gunicorn
```

## 3. Collecte des fichiers statiques
```bash
python manage.py collectstatic --settings=core.settings
```

## 4. Lancement du serveur en mode production
```bash
gunicorn core.wsgi:application --bind 127.0.0.1:8000 --env DJANGO_SETTINGS_MODULE=core.settings
```

## 5. Vérifications à faire
- Accès API : http://127.0.0.1:8000/api/
- Pas d'erreur 500/404 inattendue
- Permissions JWT OK
- Pas de stacktrace Django (page d'erreur propre)
- Fichiers statiques servis (si reverse proxy ou whitenoise)

## 6. Conseils sécurité
- Ne jamais laisser `DEBUG = True` en prod
- Utiliser un vrai secret key en prod
- Restreindre les `ALLOWED_HOSTS`
- Utiliser un reverse proxy (Nginx) pour servir les fichiers statiques/media en prod réelle

---
**Pour repasser en mode dev :**
- Remettre `DEBUG = True` dans `settings.py`

---
**Dernière vérification :**
- Tester tous les endpoints critiques (auth, CRUD, upload, etc.)
- Vérifier les logs Gunicorn

# Checkpoint de Développement

## 1. Progrès récents
- Nettoyage des imports inutiles dans plusieurs fichiers (ClientModalContext.tsx, Header.tsx, AuthContext.tsx, AuthProvider.tsx, etc.).
- Correction des erreurs de typage et d'import (Zod, date-fns, etc.).
- Correction de la gestion dynamique des champs dans FacturesPage.tsx (fonction getInvoiceField).
- Correction de la gestion des objets retournés par getInvoiceField (affichage registration_number, make/model, ou JSON.stringify).
- Build TypeScript et Vite validé sans erreurs.
- Backend Django prêt pour la production locale (Whitenoise, DEBUG=False, static files OK).

## 2. État actuel de FacturesPage.tsx
- La fonction getInvoiceField gère correctement les cas où le champ retourné est un objet (ex : vehicle_info).
- Les champs affichés dans le tableau sont robustes face à la variabilité de l'API (noms FR/EN, objets imbriqués).
- Les actions de téléchargement, ajout, et affichage des factures sont fonctionnelles.

## 3. Prochaines étapes
- Tester l'UI/UX de la page Factures (ajout, téléchargement, affichage, erreurs).
- Ajouter la suppression de facture (bouton "Supprimer" à implémenter).
- Vérifier la robustesse de la gestion des erreurs API côté frontend.
- Continuer le nettoyage des autres pages (VehiclesPage.tsx, etc.).
- Mettre à jour la documentation technique et utilisateur.

---

Dernière mise à jour : [à compléter après chaque modification]

# Checkpoint – Lancement Backend (18 avril 2025)

## Incident
- Erreur lors du lancement du backend : `ModuleNotFoundError: No module named 'django'`.
- Cause : le serveur a été lancé sans activer l'environnement virtuel Python.

## Solution
- Activation du venv avec `source .venv/bin/activate` avant toute commande Python.
- Relance du serveur Django avec succès.

## Procédure correcte
```bash
cd ecar-project/backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

## À faire systématiquement
- Toujours activer le venv avant d'utiliser pip ou Django.
- Documenter tout incident ou workaround dans ce fichier.

# Checkpoint – Réinitialisation Git (18 avril 2025)

## Incident
- Corruption critique du dépôt Git local (objet manquant, HEAD et refs invalides).
- Impossible d'utiliser git status, commit, ou pull.

## Procédure de récupération
1. **Backup complet** du dossier `ecar-project` (hors .git) sous `ecar-project-backup-YYYYMMDD-HHMMSS`.
2. **Suppression du dossier .git corrompu**.
3. **Réinitialisation du dépôt** :
   - `git init`
   - `git add .`
   - `git commit -m "Réinitialisation : version locale la plus récente après corruption"`
4. **Ajout du remote** :
   - `git remote add origin https://github.com/phara0n/ecarproject2.git`
   - `git branch -M main`
   - `git push -u origin main --force`
5. **Bascule de la branche par défaut sur main** sur GitHub (Settings > Branches).

## Résultat
- Projet à jour sur la branche `main` du remote GitHub.
- Ancienne branche `master` obsolète (à supprimer si besoin).
- Historique Git perdu, mais tout l'état de travail est conservé.
- Backup local disponible en cas de besoin.

## À faire systématiquement
- Documenter toute opération de récupération ou de réinitialisation majeure.
- Toujours créer un backup avant manipulation destructive.

---