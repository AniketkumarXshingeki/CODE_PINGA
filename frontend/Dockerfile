# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy build output to Nginx (check your angular.json for the exact dist path)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/fontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]