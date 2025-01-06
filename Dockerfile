# Build aşaması
FROM node:18 as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN CI=false npm run build

# Çalıştırma aşaması
FROM node:18-slim

WORKDIR /app

# Önce package.json'ı kopyala ve bağımlılıkları yükle
COPY package.json package-lock.json ./
RUN npm install --production

# Build çıktısını ve gerekli dosyaları kopyala
COPY --from=builder /app/build ./build
COPY db.json .
COPY server.js .

# Port'u aç
EXPOSE 3001

# Uygulamayı başlat
CMD ["node", "server.js"] 