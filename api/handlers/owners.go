package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (h *Handler) CreateOwner(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Owner{})
}
func (h *Handler) GetAllOwners(w http.ResponseWriter, r *http.Request) {
	var owners []models.Owner
	if err := h.DB.Preload("Dogs", func(db *gorm.DB) *gorm.DB {
		return db.Order("name ASC")
	}).Order("given_name ASC, surname ASC").Find(&owners).Error; err != nil {
		http.Error(w, "Failed to retrieve owners", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(owners)
}
func (h *Handler) GetOwner(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Owner{})
}
func (h *Handler) UpdateOwner(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Owner{})
}
func (h *Handler) DeleteOwner(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Owner{})
}

func (h *Handler) CreateDog(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Dog{})
}
func (h *Handler) GetAllDogs(w http.ResponseWriter, r *http.Request) {
	ownerID := chi.URLParam(r, "ownerID")
	if _, err := uuid.Parse(ownerID); err != nil {
		http.Error(w, "Invalid UUID format", http.StatusBadRequest)
		return
	}
	h.getAllEntities(w, r, &[]models.Dog{}, "owner_id", ownerID)
}
func (h *Handler) GetDog(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Dog{})
}
func (h *Handler) UpdateDog(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Dog{})
}
func (h *Handler) DeleteDog(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Dog{})
}
