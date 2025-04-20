FROM python:3.10-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings

WORKDIR /app

# Installer les dépendances de base
COPY requirements.txt .
RUN pip install -r requirements.txt

# Installer les dépendances manquantes explicitement
RUN pip install django-cors-headers gunicorn

# Copier le code source
COPY . .

# Ne pas exécuter collectstatic pendant le build
# Nous l'exécuterons manuellement après le démarrage du conteneur

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"] 