#!/bin/bash
set -e

# Environment variables that will be set by the Helm template
# NAMESPACE="{{ .Release.Namespace }}"
# HOOK_TYPE="{{ .Release.Hook }}"
# JWT_SECRET_NAME="{{ include "flyball-planner.fullname" . }}-jwt-secret"
# POSTGRES_SECRET_NAME="{{ include "flyball-planner.fullname" . }}-postgresql-secret"

echo "Secret Management Job - Hook Type: $HOOK_TYPE"
echo "Namespace: $NAMESPACE"

if [ "$HOOK_TYPE" = "post-delete" ]; then
  echo "Post-delete hook: Cleaning up secrets..."

  if [ -n "$JWT_SECRET_NAME" ]; then
    if kubectl get secret "$JWT_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
      echo "JWT secret '$JWT_SECRET_NAME' exists, deleting..."
      kubectl delete secret "$JWT_SECRET_NAME" -n "$NAMESPACE"
      echo "JWT secret '$JWT_SECRET_NAME' deleted successfully."
    else
      echo "JWT secret '$JWT_SECRET_NAME' does not exist, nothing to delete."
    fi
  fi

  if [ -n "$POSTGRES_SECRET_NAME" ]; then
    if kubectl get secret "$POSTGRES_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
      echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' exists, deleting..."
      kubectl delete secret "$POSTGRES_SECRET_NAME" -n "$NAMESPACE"
      echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' deleted successfully."
    else
      echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' does not exist, nothing to delete."
    fi
  fi

  echo "Secret cleanup completed successfully."
  exit 0
fi

# JWT Secret generation
if [ -n "$JWT_SECRET_NAME" ]; then
  echo "Checking if JWT secret '$JWT_SECRET_NAME' already exists..."

  if kubectl get secret "$JWT_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
    echo "JWT secret '$JWT_SECRET_NAME' already exists, skipping generation."
  else
    echo "JWT secret '$JWT_SECRET_NAME' does not exist, generating new secret..."

    JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)

    kubectl create secret generic "$JWT_SECRET_NAME" \
      --from-literal=jwt-secret="$JWT_SECRET" \
      -n "$NAMESPACE" \
      --dry-run=client -o yaml | kubectl apply -f -

    echo "JWT secret '$JWT_SECRET_NAME' created successfully."
  fi
fi

# PostgreSQL Secret generation
if [ -n "$POSTGRES_SECRET_NAME" ]; then
  echo "Checking if PostgreSQL secret '$POSTGRES_SECRET_NAME' already exists..."

  if kubectl get secret "$POSTGRES_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
    echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' already exists, skipping generation."
  else
    echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' does not exist, generating new secret..."

    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

    kubectl create secret generic "$POSTGRES_SECRET_NAME" \
      --from-literal=password="$POSTGRES_PASSWORD" \
      -n "$NAMESPACE" \
      --dry-run=client -o yaml | kubectl apply -f -

    echo "PostgreSQL secret '$POSTGRES_SECRET_NAME' created successfully."
  fi
fi

echo "Secret generation completed successfully."
