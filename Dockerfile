# Build aşaması
FROM node:18 as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN CI=false npm run build

# Çalıştırma aşaması
FROM node:18-slim

WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Production bağımlılıklarını yükle
RUN npm ci --omit=dev

# Build çıktısını ve gerekli dosyaları kopyala
COPY --from=builder /app/build ./build
COPY db.json .
COPY server.js .

# Port'u aç
EXPOSE 3001

# Uygulamayı başlat
CMD ["npm", "run", "serve"] 