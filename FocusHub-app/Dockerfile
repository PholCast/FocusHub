FROM node:23.11.1 AS builder

WORKDIR /app

COPY package*.json ./
COPY package*-lock.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

FROM node:23.11.1-alpine AS runner

WORKDIR /app

COPY --from=builder /app .

EXPOSE 4200


CMD ["npm", "run", "start", "--", "--host=0.0.0.0", "--port=4200"]