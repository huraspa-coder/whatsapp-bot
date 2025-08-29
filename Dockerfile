FROM node:20-bookworm-slim

# Instalar dependencias mínimas para Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libgtk-3-0 \
    libasound2 \
    libnss3 \
    libxshmfence1 \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Definir Puppeteer para que use Chromium del sistema
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar dependencias primero (cache docker)
COPY package*.json ./

# Instalar dependencias node
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copiar proyecto
COPY . .

# Exponer puerto
EXPOSE 3000

# Ejecutar servidor
CMD ["node", "server.js"]
