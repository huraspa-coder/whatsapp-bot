# Dockerfile para Venom Bot en Railway con Node 20

# 1. Imagen base oficial Node 20 LTS
FROM node:20-bullseye-slim

# 2. Variables de entorno necesarias para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SESSION_PATH=/app/.venom-sessions
ENV PORT=3000

# 3. Instalar dependencias del sistema necesarias para Chromium y Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

# 4. Crear directorio de trabajo
WORKDIR /app

# 5. Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# 6. Instalar dependencias Node
RUN npm install --legacy-peer-deps

# 7. Copiar todo el proyecto
COPY . .

# 8. Crear carpeta de sesiones
RUN mkdir -p $SESSION_PATH

# 9. Exponer el puerto
EXPOSE 3000

# 10. Comando por defecto para correr tu server.js
CMD ["node", "server.js"]