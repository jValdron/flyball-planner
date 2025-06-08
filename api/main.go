package main

import (
	"flyball-practice-planner/api/models"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "flyball-practice-planner/api/docs" // This will be generated

	httpSwagger "github.com/swaggo/http-swagger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// @title Flyball Practice Planner API
// @version 1.0
// @description API for managing flyball practice sessions
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
		&models.Room{},
		&models.PracticeAttendance{},
	)

	SeedData(db)

	r := RegisterRoutes(db)

	// Swagger documentation endpoint
	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"), // The url pointing to API definition
	))

	log.Println("Starting server on :8080...")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal("Server failed: ", err)
	}
}
