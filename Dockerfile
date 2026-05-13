# Stage 1: Build JS assets
FROM node:20-alpine AS node-builder

WORKDIR /app

RUN apk add --no-cache \
    php83 php83-phar php83-mbstring php83-openssl php83-xml \
    php83-tokenizer php83-dom php83-xmlwriter php83-curl \
    php83-fileinfo php83-session php83-iconv php83-sodium \
    curl \
    && ln -s /usr/bin/php83 /usr/local/bin/php \
    && curl -sS https://getcomposer.org/installer \
       | php -- --install-dir=/usr/local/bin --filename=composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: PHP only, no nginx
FROM php:8.2-fpm-alpine

RUN apk add --no-cache curl zip unzip git libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY . .
COPY --from=node-builder /app/public/build ./public/build

RUN composer run-script post-autoload-dump

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
