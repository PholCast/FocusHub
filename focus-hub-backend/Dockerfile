# Development Stage
FROM node:20.17.0 AS development

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Production Stage
FROM node:20.17.0 AS production

WORKDIR /app

COPY --from=development /app .

ENV NODE_ENV=production

CMD ["node", "dist/main"]
