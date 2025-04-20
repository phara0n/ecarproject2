# Configuration du Proxy pour l'Application en Production

## Problèmes Résolus

### 1. URL du Backend

Dans la version build (production) de l'application, les requêtes API étaient dirigées vers `127.0.0.1:8000` alors que le backend était disponible sur `localhost:8000`. Cette différence peut causer des problèmes de connexion en fonction de la configuration réseau et des restrictions CORS.

### 2. Endpoints d'Authentification

Les endpoints d'authentification utilisés dans le code (`/api/v1/auth/login/` et `/api/v1/auth/refresh/`) ne correspondaient pas aux véritables endpoints du backend Django (`/api/v1/token/` et `/api/v1/token/refresh/`).

## Solutions Implémentées

### 1. Pour l'URL du Backend

Nous avons modifié la configuration pour garantir que les requêtes API sont correctement acheminées vers le backend :
- Ajout d'une variable `VITE_API_BASE_URL` dans `vite.config.ts`
- Valeur par défaut : `http://localhost:8000`
- Utilisation explicite de cette variable dans toutes les requêtes API

### 2. Pour les Endpoints d'Authentification

Nous avons corrigé les chemins d'API utilisés dans l'`AuthProvider` :
- Login : `/api/v1/auth/login/` → `/api/v1/token/`
- Refresh Token : `/api/v1/auth/refresh/` → `/api/v1/token/refresh/`

## Fichiers Modifiés

### 1. `vite.config.ts`

```typescript
export default defineConfig({
  // ... configuration existante ...
  define: {
    // Définir une variable d'environnement pour l'URL de l'API
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8000'),
  },
})
```

### 2. `src/context/AuthProvider.tsx`

```typescript
// Utiliser la variable d'environnement pour les URLs
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
console.log("AuthProvider: Using API base URL:", baseURL);

// Login avec le bon endpoint
const response = await fetch(`${baseURL}/api/v1/token/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
  credentials: 'include'
});

// Refresh token avec le bon endpoint
const response = await ky.post(`${baseURL}/api/v1/token/refresh/`, {
  json: {
    refresh: currentRefreshToken
  },
  credentials: 'include'
}).json();
```

## Comment Personnaliser le Backend

Pour pointer vers un autre backend (par exemple en déploiement) :

1. **Créer un fichier `.env.production`** avec le contenu :
   ```
   VITE_API_BASE_URL=https://mon-api-backend.com
   ```

2. **Ou modifier directement `vite.config.ts`** :
   ```typescript
   define: {
     'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://mon-api-backend.com'),
   },
   ```

## Pour Développeurs

### Vérifier l'URL Utilisée

Vous pouvez vérifier quelle URL est utilisée en ouvrant la console du navigateur et recherchant les logs :
```
AuthProvider: Using API base URL: http://localhost:8000
```

### Tests de Connexion

Pour vérifier que la connexion au backend fonctionne correctement :
1. Lancez l'application en mode production : `npm run build && npm run preview`
2. Tentez de vous connecter avec des identifiants valides
3. Vérifiez dans la console du navigateur si des erreurs CORS ou de connexion apparaissent 