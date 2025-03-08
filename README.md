# Flyball Practice Planner

## Overview
The Flyball Practice Planner is a tool designed to help teams organize and manage their flyball training sessions. It allows users to schedule practices, create ordered sets for training, and assign dogs to specific lanes or training locations.

### Current Features
- **Owner & Dog Management**: Create, update, and remove owners and their dogs.

### Future Features
- **Practice Management**: Schedule and organize training sessions.

## API
The backend API is built using **Golang**, **Chi**, and **GORM** with **PostgreSQL** for persistence. The API provides CRUD operations for:
- **Practices**: Organize training sessions.
- **Sets**: Define specific training segments within a practice.
- **Dogs**: Track dogs participating in training.
- **Owners**: Manage owners and their associated dogs.

## Frontend
The frontend is a simple **Alpine.js**-based web application that provides an interface for managing owners and their dogs. Users can:
- View a list of owners and their associated dogs.
- Add, edit, or remove owners.
- Add, edit, or remove dogs under each owner.

## Running Locally
There are two ways to run the application locally:

### 1. Using Docker Compose
Ensure **Docker** and **Docker Compose** are installed, then run:
```sh
docker-compose up
```

To rebuild components:
```sh
docker-compose up --build api --build frontend
```

### 2. Running Manually
#### Start the API
```sh
cd api
GO_ENV=development go run .
```

#### Start the Frontend
Use a simple web server to serve the `static/` directory, for example:
```sh
cd frontend
python3 -m http.server 8081  # Or use any static file server
```

Now, visit `http://localhost:8081/` to access the frontend.

## Deploying with Helm
To deploy the Flyball Practice Planner using Helm, follow these steps:

### 1. Install Helm
Ensure Helm is installed on your system. If not, install it from [helm.sh](https://helm.sh/docs/intro/install/).

### 2. Add the Bitnami Repository (for PostgreSQL)
```sh
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

### 3. Deploy the Helm Chart
```sh
helm install flyball-planner ./deploy/charts/flyball-practice-planner
```
This will deploy:
- The API
- The Frontend
- PostgreSQL (if enabled in `values.yaml`)

### 4. Uninstalling the Helm Chart
To remove the deployment:
```sh
helm uninstall flyball-planner
```
