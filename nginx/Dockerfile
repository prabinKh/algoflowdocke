# nginx/Dockerfile
# Lightweight nginx image, just adds our config on top of the official image.
FROM nginx:1.27-alpine

# Remove the default "welcome" config so it can't conflict
RUN rm -f /etc/nginx/conf.d/default.conf

# Our actual site config and shared proxy headers snippet
COPY algoflow.conf /etc/nginx/conf.d/algoflow.conf
COPY proxy_params.conf /etc/nginx/proxy_params.conf

EXPOSE 80 443
