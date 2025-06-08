package main

import (
	"flyball-practice-planner/api/handlers"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"gorm.io/gorm"
)

func RegisterRoutes(db *gorm.DB) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	h := handlers.NewHandler(db)

	r.Route("/api", func(r chi.Router) {
		r.Use(cors.Handler(cors.Options{
			AllowedOrigins:   []string{"*"}, // Allow all origins (to be changed)
			AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: false,
			MaxAge:           300,
		}))

		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		})

		r.Route("/practices", func(r chi.Router) {
			r.Post("/", h.CreatePractice)
			r.Get("/", h.GetAllPractices)
			r.Get("/{id}", h.GetPractice)
			r.Put("/{id}", h.UpdatePractice)
			r.Delete("/{id}", h.DeletePractice)

			r.Route("/{practiceID}/sets", func(r chi.Router) {
				r.Post("/", h.CreateSet)
				r.Get("/", h.GetAllSets)
				r.Get("/{id}", h.GetSet)
				r.Put("/{id}", h.UpdateSet)
				r.Delete("/{id}", h.DeleteSet)
			})
		})

		r.Route("/owners", func(r chi.Router) {
			r.Post("/", h.CreateOwner)
			r.Get("/", h.GetAllOwners)
			r.Get("/{id}", h.GetOwner)
			r.Put("/{id}", h.UpdateOwner)
			r.Delete("/{id}", h.DeleteOwner)

			r.Route("/{ownerID}/dogs", func(r chi.Router) {
				r.Post("/", h.CreateDog)
				r.Get("/", h.GetAllDogs)
				r.Get("/{id}", h.GetDog)
				r.Put("/{id}", h.UpdateDog)
				r.Delete("/{id}", h.DeleteDog)
			})
		})

		r.Route("/clubs", func(r chi.Router) {
			r.Get("/", h.GetAllClubs)
			r.Get("/{id}", h.GetClub)
			r.Put("/{id}", h.UpdateClub)
			r.Get("/{id}/dogs", h.GetAllClubDogs)
			r.Get("/{id}/dogs/{dogId}", h.GetClubDog)
		})

		r.Put("/practices/{practiceID}/sets/reorder", h.ReorderSets)
		r.Put("/practices/{practiceID}/sets/{setID}/setdogs/reorder", h.ReorderSetDogs)
	})

	return r
}
