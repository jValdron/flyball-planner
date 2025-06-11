package main

import (
	"flyball-practice-planner/api/graph"
	"flyball-practice-planner/api/models"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title Flyball Practice Planner API
// @version 1.0
// @description This is the API for the Flyball Practice Planner application.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api
var db *gorm.DB

func main() {
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	log.Println("Connecting to database...")
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}
	db.AutoMigrate(
		&models.Practice{},
		&models.Set{},
		&models.SetDog{},
		&models.Owner{},
		&models.Dog{},
		&models.Club{},
		&models.Location{},
		&models.PracticeAttendance{},
	)

	SeedData(db)

	r := chi.NewRouter()

	// Setup GraphQL server
	graph.SetupGraphQLServer(r, db)

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
