# Imagen base liviana
FROM node:20-slim

# Instalar Chromium y dependencias mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Variable para que Puppeteer use Chromium instalado
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero
COPY package*.json ./

# Instalar dependencias (evita conflictos peer deps de Venom)
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copiar el resto del código
COPY . .

# Crear carpeta de tokens para la sesión (persistencia opcional)
RUN mkdir -p /app/tokens/session-name

# Exponer puerto
EXPOSE 3000

# Arrancar el bot
CMD ["npm", "start"]
