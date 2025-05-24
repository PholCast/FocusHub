# 🧠 FocusHub

FocusHub es una aplicación compuesta por un frontend en Angular y un backend en NestJS. Este repositorio está preparado para ejecutarse fácilmente usando Docker y Docker Compose.

Este proyecto utiliza:
- Angular CLI: **19.2.6**
- Node.js: **20.17.0**
- NestJS: **11.0.1**

---

## 🚀 ¿Cómo ejecutar el proyecto desde cero?

### 📦 Requisitos previos

Asegurarse de tener instalado Docker Desktop y luego abrirlo.

Antes de comenzar, asegúrese de tener instalado lo siguiente:

- Node.js y npm (recomendado: Node 20.17.0)
- Angular CLI

Puedes instalar Angular CLI con el siguiente comando:

```bash
npm install -g @angular/cli@19.2.6
```
---

### 🔁 Pasos para clonar y levantar la app

1. **Clona el repositorio:**

```bash
git clone https://github.com/PholCast/FocusHub.git
cd FocusHub
```

2. **Instalar las dependencias del backend (NestJS)**
```bash
cd focus-hub-backend
npm install
cd ..
```

3. **Levantar la aplicación con Docker Compose**
```bash
docker-compose up
```

El archivo docker-compose.yml ya usa las imágenes de Docker Hub subidas (https://hub.docker.com/repository/docker/pholcast25/focus-hub-angular/general y https://hub.docker.com/repository/docker/pholcast25/focus-hub-nest-js/general) y no requiere que se instale nada más.

Esto levanta los dos servicios de Frontend y Backend:
📱 Frontend Angular en http://localhost:4200

🧠 Backend NestJS en http://localhost:3000

Además, puedes acceder a la documentación de la API (Swagger) en:
http://localhost:3000/api

