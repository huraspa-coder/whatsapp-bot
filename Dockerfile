# Usa Node.js 20 como base
FROM node:20-slim

# Instala librerías necesarias para Chromium
RUN apt-get update && \
    apt-get install -y wget gnupg ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 \
    libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
    xdg-utils libgbm1 libpango1.0-0 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Crea carpeta de la app
WORKDIR /app

# Copia archivos
COPY package.json package-lock.json* ./
COPY index.js ./

# Instala dependencias
RUN npm install

# Expone el puerto
EXPOSE 3000

# Comando para iniciar el bot
CMD ["npm", "start"]
