# Imagen base Node.js 20 (bullseye incluye más dependencias que slim)
FROM node:20-bullseye

# Instalar librerías necesarias para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
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
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copiar el resto del código
COPY . .

# Crear carpeta de tokens para la sesión
RUN mkdir -p /app/tokens/session-name

# Exponer puerto
EXPOSE 3000

# Comando para arrancar el bot
CMD ["npm", "start"]
