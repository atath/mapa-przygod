# Mapa Przygód: the built game (dist/) served by nginx.
FROM nginx:1.27-alpine
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY dist/ /usr/share/nginx/html/
