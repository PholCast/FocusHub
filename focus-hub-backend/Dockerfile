# Development Stage
FROM node:20.17.0 AS development

WORKDIR /usr/src/app

# Copia solo los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala todas las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Exponer el puerto para desarrollo
EXPOSE 3000

# Usa el comando de desarrollo
CMD ["npm", "run", "start:dev"]
