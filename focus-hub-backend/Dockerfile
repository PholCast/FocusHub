# Stage 1: Build the NestJS application
FROM node:23.11.1-alpine AS builder 

WORKDIR /usr/src/app

# Copia package.json y package-lock.json primero para aprovechar el caché de Docker
# Esto asegura que 'npm install' solo se reejecute si cambian las dependencias
COPY package*.json ./

# Instala todas las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Construye la aplicación NestJS
# Esto compilará tu código TypeScript a JavaScript en la carpeta 'dist'
RUN npm run build

# Stage 2: Run the NestJS application (imagen más ligera para el runtime)
FROM node:23.11.1-alpine AS runner 

WORKDIR /usr/src/app

# Copia solo lo necesario del stage de construcción: node_modules, dist, y package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json 

# Expone el puerto 3000
EXPOSE 3000

# Comando para iniciar la aplicación en modo desarrollo (con hot-reloading)
CMD ["npm", "run", "start:dev"]