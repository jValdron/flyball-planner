FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY init.sh /init.sh
RUN chmod +x /init.sh
EXPOSE 80
CMD ["/init.sh"]
