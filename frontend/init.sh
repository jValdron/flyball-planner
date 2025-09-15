#!/bin/sh

CONFIG_FILE="/srv/assets/index-*.js"
GRAPHQL_URL="${GRAPHQL_BASE_URL:-/graphql}"

find /srv -name "index-*.js" -type f -exec sed -i "s|\(http\|ws\)://localhost:4000|${GRAPHQL_URL}|g" {} \;

exec caddy run --config /etc/caddy/Caddyfile
