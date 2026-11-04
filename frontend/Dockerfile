# Front de TRAMA para el perfil "demo" de Docker Compose.

# Etapa 1: compilar con la misma versión de Node que la CI
FROM node:22-slim AS build

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# El front llama a /api en su mismo dominio y nginx lo reenvía al back.
ENV VITE_API_URL=/api
RUN npm run build

# Etapa 2: servir los archivos compilados con nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80
