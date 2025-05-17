# Etapa de desarrollo
FROM node:20.17.0 AS development

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos package.json y package-lock.json primero
# Esto aprovecha la caché de Docker para evitar reinstalar las dependencias innecesariamente
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Instalar la versión global de Angular CLI que necesitas
RUN npm install -g @angular/cli@19.2.6

# Copiar el resto de los archivos de la aplicación
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto 4200 para acceder a la aplicación
EXPOSE 4200

# Comando por defecto para ejecutar la aplicación
CMD ["npm", "run", "start"]
