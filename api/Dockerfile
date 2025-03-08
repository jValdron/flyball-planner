FROM golang:1.24 AS builder

WORKDIR /app
COPY . .

RUN go mod tidy && go build -o api

FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /
COPY --from=builder /app/api /

CMD ["/api"]
