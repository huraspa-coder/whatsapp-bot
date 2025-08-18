# Imagen base Node.js 20
FROM node:20-slim

# Librerías necesarias para Chromium
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates fonts-liberation \
    libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
    libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxrandr2 xdg-utils libgbm1 libpango1.0-0 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Crear carpeta de tokens para la sesión
RUN mkdir -p /app/tokens/session-name

# Exponer puerto (si usas Express)
EXPOSE 3000

# Comando para arrancar el bot
CMD ["node", "index.js"]
