package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Create a new practice
// @Description Create a new practice session
// @Tags practices
// @Accept json
// @Produce json
// @Param practice body models.Practice true "Practice object"
// @Success 201 {object} models.Practice
// @Router /practices [post]
func (h *Handler) CreatePractice(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Practice{})
}

// @Summary Get all practices
// @Description Get a list of all practice sessions
// @Tags practices
// @Produce json
// @Success 200 {array} models.Practice
// @Router /practices [get]
func (h *Handler) GetAllPractices(w http.ResponseWriter, r *http.Request) {
	h.getAllEntities(w, r, &[]models.Practice{}, "", "")
}

// @Summary Get a practice by ID
// @Description Get a specific practice session by its ID
// @Tags practices
// @Produce json
// @Param id path string true "Practice ID"
// @Success 200 {object} models.Practice
// @Router /practices/{id} [get]
func (h *Handler) GetPractice(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Practice{})
}

// @Summary Update a practice
// @Description Update an existing practice session
// @Tags practices
// @Accept json
// @Produce json
// @Param id path string true "Practice ID"
// @Param practice body models.Practice true "Practice object"
// @Success 200 {object} models.Practice
// @Router /practices/{id} [put]
func (h *Handler) UpdatePractice(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Practice{})
}

// @Summary Delete a practice
// @Description Delete a practice session
// @Tags practices
// @Param id path string true "Practice ID"
// @Success 204 "No Content"
// @Router /practices/{id} [delete]
func (h *Handler) DeletePractice(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Practice{})
}

// @Summary Create a new set
// @Description Create a new set within a practice
// @Tags sets
// @Accept json
// @Produce json
// @Param practiceID path string true "Practice ID"
// @Param set body models.Set true "Set object"
// @Success 201 {object} models.Set
// @Router /practices/{practiceID}/sets [post]
func (h *Handler) CreateSet(w http.ResponseWriter, r *http.Request) {
	h.createEntity(w, r, &models.Set{})
}

// @Summary Get all sets in a practice
// @Description Get a list of all sets within a practice
// @Tags sets
// @Produce json
// @Param practiceID path string true "Practice ID"
// @Success 200 {array} models.Set
// @Router /practices/{practiceID}/sets [get]
func (h *Handler) GetAllSets(w http.ResponseWriter, r *http.Request) {
	practiceID := chi.URLParam(r, "practiceID")
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid UUID format", http.StatusBadRequest)
		return
	}
	h.getAllEntities(w, r, &[]models.Set{}, "practice_id", practiceID)
}

// @Summary Get a set by ID
// @Description Get a specific set by its ID
// @Tags sets
// @Produce json
// @Param id path string true "Set ID"
// @Success 200 {object} models.Set
// @Router /practices/{practiceID}/sets/{id} [get]
func (h *Handler) GetSet(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Set{})
}

// @Summary Update a set
// @Description Update an existing set
// @Tags sets
// @Accept json
// @Produce json
// @Param id path string true "Set ID"
// @Param set body models.Set true "Set object"
// @Success 200 {object} models.Set
// @Router /practices/{practiceID}/sets/{id} [put]
func (h *Handler) UpdateSet(w http.ResponseWriter, r *http.Request) {
	h.updateEntity(w, r, &models.Set{})
}

// @Summary Delete a set
// @Description Delete a set
// @Tags sets
// @Param id path string true "Set ID"
// @Success 204 "No Content"
// @Router /practices/{practiceID}/sets/{id} [delete]
func (h *Handler) DeleteSet(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Set{})
}

// @Summary Reorder sets in a practice
// @Description Update the order of sets within a practice
// @Tags sets
// @Accept json
// @Param practiceID path string true "Practice ID"
// @Param setOrder body array true "Array of set orders"
// @Success 200 "OK"
// @Router /practices/{practiceID}/sets/reorder [put]
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

// @Summary Reorder dogs in a set
// @Description Update the order of dogs within a set
// @Tags sets
// @Accept json
// @Param practiceID path string true "Practice ID"
// @Param setID path string true "Set ID"
// @Param dogOrder body array true "Array of dog orders"
// @Success 200 "OK"
// @Router /practices/{practiceID}/sets/{setID}/setdogs/reorder [put]
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
