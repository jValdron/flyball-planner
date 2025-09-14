FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM caddy:2-alpine
# Copy the built static files to Caddy's serving directory
COPY --from=builder /app/dist /srv
# Copy the Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
