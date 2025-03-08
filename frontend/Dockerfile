FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

ARG API_BASE_URL=/api

COPY static/ ./

RUN sed -i "s|API_BASE_URL|${API_BASE_URL}|g" ./config.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
