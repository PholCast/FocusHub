# build
FROM node:20.17.0 AS development

#WORKDIR /FocusHub-app/src/app
WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g @angular/cli@19.2.6

COPY . .

RUN npm run build

EXPOSE 4200