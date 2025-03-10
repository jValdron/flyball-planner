FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

ARG API_BASE_URL=/api

COPY static/ ./

RUN sed -i "s|http://localhost:8080/api/|${API_BASE_URL}|g" ./config.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
