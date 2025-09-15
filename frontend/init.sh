#!/bin/sh

CONFIG_FILE="/srv/assets/index-*.js"
GRAPHQL_URL="${GRAPHQL_BASE_URL:-/graphql}"

find /srv -name "index-*.js" -type f -exec sed -i -e "s|http://localhost:4000|${GRAPHQL_URL}|g" -e "s|ws://localhost:4000|${GRAPHQL_URL}|g" {} \;

exec caddy run --config /etc/caddy/Caddyfile
