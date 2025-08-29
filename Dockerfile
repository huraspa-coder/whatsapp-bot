# Base Node
FROM node:20-slim

# Instalar dependencias de Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    libnss3 \
    libatk1.0-0 \
    libxss1 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libxshmfence1 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Node
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar proyecto
COPY . .

# Variables de entorno para Venom
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SESSION_PATH=/app/.venom-sessions

EXPOSE 3000
CMD ["node", "server.js"]
