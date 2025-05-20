FROM node:23.11.1-alpine AS builder 

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:23.11.1-alpine AS runner 

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json 

EXPOSE 3000

CMD ["npm", "run", "start:dev"]