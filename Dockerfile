# Node 20 como base
FROM node:20-slim

# Librerías necesarias para Puppeteer / Venom
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 \
    libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    xdg-utils libgbm1 libpango1.0-0 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código del bot
COPY . .

# Crear carpeta de tokens
RUN mkdir -p /app/tokens/session-name

# Exponer puerto (solo si usas Express)
EXPOSE 3000

# Arranque directo del bot
CMD ["node", "index.js"]
