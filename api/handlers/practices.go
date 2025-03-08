package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *Handler) CreatePractice(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Practice{})
}
func (h *Handler) GetAllPractices(w http.ResponseWriter, r *http.Request) {
	h.getAllEntities(w, r, &[]models.Practice{}, "", "")
}
func (h *Handler) GetPractice(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Practice{})
}
func (h *Handler) UpdatePractice(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Practice{})
}
func (h *Handler) DeletePractice(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Practice{})
}

func (h *Handler) CreateSet(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Set{})
}
func (h *Handler) GetAllSets(w http.ResponseWriter, r *http.Request) {
	practiceID := chi.URLParam(r, "practiceID")
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid UUID format", http.StatusBadRequest)
		return
	}
	h.getAllEntities(w, r, &[]models.Set{}, "practice_id", practiceID)
}
func (h *Handler) GetSet(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Set{})
}
func (h *Handler) UpdateSet(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Set{})
}
func (h *Handler) DeleteSet(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Set{})
}

// Reorder Sets in a Practice
func (h *Handler) ReorderSets(w http.ResponseWriter, r *http.Request) {
	practiceID := chi.URLParam(r, "practiceID")
	var setOrder []struct {
		ID    uuid.UUID `json:"id"`
		Order int       `json:"order"`
	}

	if err := json.NewDecoder(r.Body).Decode(&setOrder); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	for _, s := range setOrder {
		h.DB.Model(&models.Set{}).Where("id = ? AND practice_id = ?", s.ID, practiceID).Update("order", s.Order)
	}

	w.WriteHeader(http.StatusOK)
}

// Reorder SetDogs in a Set
func (h *Handler) ReorderSetDogs(w http.ResponseWriter, r *http.Request) {
	setID := chi.URLParam(r, "setID")
	var setDogOrder []struct {
		DogID uuid.UUID `json:"dogId"`
		Order int       `json:"order"`
	}

	if err := json.NewDecoder(r.Body).Decode(&setDogOrder); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	for _, sd := range setDogOrder {
		h.DB.Model(&models.SetDog{}).Where("set_id = ? AND dog_id = ?", setID, sd.DogID).Update("order", sd.Order)
	}

	w.WriteHeader(http.StatusOK)
}
