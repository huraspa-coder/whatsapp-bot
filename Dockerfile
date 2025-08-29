# Imagen base Node con Debian
FROM node:20-bullseye-slim

# Instalar dependencias de Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  chromium-driver \
  fonts-liberation \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango1.0-0 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatspi2.0-0 \
  libxshmfence1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar todo el proyecto
COPY . .

# Crear carpeta para sesiones de Venom
RUN mkdir -p /app/.venom-sessions && chmod 777 /app/.venom-sessions

# Puerto que usará Railway
EXPOSE 3000

# Comando para arrancar la app
CMD ["node", "server.js"]
