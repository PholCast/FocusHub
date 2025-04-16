# Development Stage
FROM node:20.17.0 AS development

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies, not just production
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# CMD is optional here because docker-compose handles it
CMD ["npm", "run", "start:dev"]
