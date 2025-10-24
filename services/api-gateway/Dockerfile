# Dockerfile for api-gateway (Laravel)
# Install PHP, required extensions and composer, then run artisan serve for demo purposes
FROM php:8.2-cli

RUN apt-get update \
    && apt-get install -y git unzip zip libzip-dev libpng-dev libonig-dev libxml2-dev libicu-dev default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd intl zip \
    && rm -rf /var/lib/apt/lists/*

# copy composer binary from official composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# copy composer files first to install dependencies (cache layer)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader || true

# copy app source
COPY . .

# permissions for storage and cache
RUN chown -R www-data:www-data /var/www/html || true
RUN mkdir -p storage bootstrap/cache || true
RUN chmod -R 755 storage bootstrap/cache || true

ENV PORT=8000
EXPOSE 8000

# simple entry: ensure key exists and run migrations if possible, then start built-in server
CMD ["sh", "-c", "php artisan key:generate --force || true && php artisan migrate --force || true && php artisan serve --host=0.0.0.0 --port=${PORT}"]

