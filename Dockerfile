FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# the main nginx wala part to serve this site
FROM nginx:alpine
# also dist is vite ka build karne ke baad wala folder just in case 
# anyone new to vite/docker is confused why i used /app/dist ^^^
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
