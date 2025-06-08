FROM golang:1.24 AS builder

RUN go install github.com/swaggo/swag/cmd/swag@latest

WORKDIR /app
COPY . .

RUN swag init
RUN go mod tidy && go build -o api

FROM gcr.io/distroless/base-debian12:nonroot

WORKDIR /
COPY --from=builder /app/api /
COPY --from=builder /app/docs /docs

CMD ["/api"]
