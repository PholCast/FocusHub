FROM node:23.11.1-alpine AS builder 

WORKDIR /usr/src/app


COPY package*.json ./
COPY package*-lock.json ./
RUN npm install 
RUN npm install class-validator
RUN npm install class-transformer
RUN npm install winston
RUN npm install winston-transport


COPY tsconfig.json ./
COPY . ./

RUN npm run build

FROM node:23.11.1-alpine AS runner 

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json 

EXPOSE 3000

CMD ["node", "dist/main.js"]