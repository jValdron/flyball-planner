FROM alpine:latest AS kubectl-downloader
RUN apk add --no-cache curl ca-certificates

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl

FROM alpine:latest

RUN apk add --no-cache \
    bash \
    openssl \
    ca-certificates

COPY --from=kubectl-downloader /kubectl /usr/local/bin/kubectl

COPY generate-secrets.sh /usr/local/bin/generate-secrets.sh
RUN chmod +x /usr/local/bin/generate-secrets.sh

ENTRYPOINT ["/usr/local/bin/generate-secrets.sh"]
