FROM node:23.11.1 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

FROM node:23.11.1-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/angular.json ./angular.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

EXPOSE 4200

CMD ["npm", "run", "start"]FROM node:23.11.1 AS builder

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