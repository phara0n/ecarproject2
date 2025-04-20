FROM node:18-alpine as build

WORKDIR /app

# Transférer les fichiers de dépendances
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copier le code source
COPY . .

# Construire l'application
ARG VITE_API_URL
ENV VITE_API_URL=\${VITE_API_URL}
RUN npm run build

# Étape 2: Utiliser Nginx pour servir le frontend
FROM nginx:alpine

# Copier le build depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx s'exécutera sur le port 80
EXPOSE 80

# Nginx démarre automatiquement dans l'image, pas besoin de CMD 