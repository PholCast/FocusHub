# Stage 1: Install dependencies and copy source (for dev server)
FROM node:23.11.1 AS builder

WORKDIR /app

# Copia package.json y package-lock.json primero para aprovechar el caché de Docker
COPY package*.json ./

# Instala todas las dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# *** NOTA: No se ejecuta 'npm run build' aquí para desarrollo, ya que 'ng serve' lo hace en caliente. ***
# *** NOTA: No se instala @angular/cli globalmente, 'npm run start' usará la versión local. ***

# Stage 2: Run the Angular development server
FROM node:23.11.1-alpine AS runner

WORKDIR /app

# Copia los archivos necesarios del stage de construcción para que `ng serve` funcione
# Esto incluye `node_modules` y todo el código fuente.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/angular.json ./angular.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Expone el puerto 4200
EXPOSE 4200

# Comando por defecto para ejecutar el servidor de desarrollo de Angular
# Asegúrate de que tu script 'start' en package.json incluya:
# "ng serve --host 0.0.0.0 --port 4200 --disable-host-check"
CMD ["npm", "run", "start"]