# 1. Base image Node 20
FROM node:20-slim

# 2. Instalar dependencias necesarias para Chromium y Venom
RUN apt-get update && apt-get install -y \
    chromium \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 3. Establecer directorio de trabajo
WORKDIR /app

# 4. Copiar package.json y package-lock.json / install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 5. Copiar todo el proyecto
COPY . .

# 6. Variables de entorno recomendadas
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SESSION_PATH=/app/.venom-sessions
ENV NODE_ENV=production

# 7. Crear carpeta de sesiones con permisos
RUN mkdir -p $SESSION_PATH && chmod -R 777 $SESSION_PATH

# 8. Exponer puerto
EXPOSE 3000

# 9. Iniciar el server
CMD ["node", "server.js"]