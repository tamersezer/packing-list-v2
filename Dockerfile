# Build aşaması
FROM node:18 as builder

# Çalışma dizinini ayarla
WORKDIR /app

# Package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Build işlemini gerçekleştir
RUN CI=false npm run build

# Çalıştırma aşaması
FROM node:18-slim

# Çalışma dizinini ayarla
WORKDIR /app

# json-server'ı yükle
RUN npm install -g json-server

# Build çıktısını ve gerekli dosyaları kopyala
COPY --from=builder /app/build ./build
COPY db.json .
COPY server.js .

# Port'u aç
EXPOSE 3001

# Uygulamayı başlat
CMD ["node", "server.js"] 