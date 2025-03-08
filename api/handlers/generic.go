package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type Handler struct {
	DB *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{DB: db}
}

func (h *Handler) createEntity(w http.ResponseWriter, r *http.Request, entity interface{}) {
	if err := json.NewDecoder(r.Body).Decode(entity); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	h.DB.Create(entity)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(entity)
}

func (h *Handler) getAllEntities(w http.ResponseWriter, r *http.Request, entities interface{}, filterColumn string, filterValue string) {
	query := h.DB.Model(entities)
	if filterColumn != "" && filterValue != "" {
		query = query.Where(fmt.Sprintf("%s = ?", filterColumn), filterValue)
	}
	if err := query.Find(entities).Error; err != nil {
		http.Error(w, "Failed to retrieve records", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(entities)
}

func (h *Handler) getEntity(w http.ResponseWriter, r *http.Request, entity interface{}) {
	id := chi.URLParam(r, "id")
	if err := h.DB.First(entity, "id = ?", id).Error; err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(entity)
}

func (h *Handler) updateEntity(w http.ResponseWriter, r *http.Request, entity interface{}) {
	id := chi.URLParam(r, "id")
	if err := h.DB.First(entity, "id = ?", id).Error; err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if err := json.NewDecoder(r.Body).Decode(entity); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	h.DB.Save(entity)
	json.NewEncoder(w).Encode(entity)
}

func (h *Handler) deleteEntity(w http.ResponseWriter, r *http.Request, entity interface{}) {
	id := chi.URLParam(r, "id")
	h.DB.Delete(entity, "id = ?", id)
	w.WriteHeader(http.StatusNoContent)
}
