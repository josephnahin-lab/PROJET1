FROM php:8.3-cli

ARG DOCKER_UID=1000
ARG DOCKER_GID=1000

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libzip-dev \
    && docker-php-ext-install -j"$(nproc)" bcmath intl mbstring pdo_pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ ./

RUN mkdir -p storage bootstrap/cache \
    && composer install --no-interaction --prefer-dist --no-progress \
    && chown -R "${DOCKER_UID}:${DOCKER_GID}" /var/www/html

USER ${DOCKER_UID}:${DOCKER_GID}

EXPOSE 8000

# Développement local uniquement; voir docker/README.md pour l'hypothèse serveur.
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
