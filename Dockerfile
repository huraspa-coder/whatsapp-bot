# Imagen base Node.js 20 slim (ligera y suficiente para Puppeteer)
FROM node:20-slim

# Instalar librerías necesarias para Chromium/Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf-2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango1.0-0 \
    libglib2.0-0 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero para aprovechar cache
COPY package*.json ./

# Instalar dependencias (legacy-peer-deps por subdependencias de Venom)
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copiar el resto del código
COPY . .

# Crear carpeta de tokens para la sesión (persistencia opcional)
RUN mkdir -p /app/tokens/session-name

# Exponer puerto
EXPOSE 3000

# Comando para arrancar el bot
CMD ["npm", "start"]
