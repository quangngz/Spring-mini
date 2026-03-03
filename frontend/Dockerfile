# ===== BUILD STAGE =====
FROM node:20-alpine AS build
WORKDIR /app

# API calls go to /api/* (same origin, proxied by nginx)
ENV VITE_API_URL=/api

COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# ===== RUNTIME STAGE =====
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
