package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Create a new practice
// @Description Create a new practice session for a club
// @Tags practices
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param practice body models.Practice true "Practice object"
// @Success 201 {object} models.Practice
// @Router /clubs/{clubID}/practices [post]
func (h *Handler) CreatePractice(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var practice models.Practice
	if err := json.NewDecoder(r.Body).Decode(&practice); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Validate that the practice is not in the past
	if practice.ScheduledAt.Before(time.Now()) {
		http.Error(w, "Cannot create a practice in the past", http.StatusBadRequest)
		return
	}

	practice.ClubID = uuid.MustParse(clubID)

	if err := h.DB.Create(&practice).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(practice)
}

// @Summary Get all practices for a club
// @Description Get a list of all practice sessions for a specific club
// @Tags practices
// @Produce json
// @Param clubID path string true "Club ID"
// @Success 200 {array} models.Practice
// @Router /clubs/{clubID}/practices [get]
func (h *Handler) GetAllPractices(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	h.getAllEntities(w, r, &[]models.Practice{}, "club_id", clubID)
}

// @Summary Get a practice by ID
// @Description Get a specific practice session by its ID
// @Tags practices
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Practice ID"
// @Success 200 {object} models.Practice
// @Router /clubs/{clubID}/practices/{id} [get]
func (h *Handler) GetPractice(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	practiceID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid practice ID", http.StatusBadRequest)
		return
	}

	var practice models.Practice
	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).First(&practice).Error; err != nil {
		http.Error(w, "Practice not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(practice)
}

// @Summary Update a practice
// @Description Update an existing practice session
// @Tags practices
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Practice ID"
// @Param practice body models.Practice true "Practice object"
// @Success 200 {object} models.Practice
// @Router /clubs/{clubID}/practices/{id} [put]
func (h *Handler) UpdatePractice(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	practiceID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid practice ID", http.StatusBadRequest)
		return
	}

	var practice models.Practice
	if err := json.NewDecoder(r.Body).Decode(&practice); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if !practice.ScheduledAt.IsZero() && practice.ScheduledAt.Before(time.Now()) {
		http.Error(w, "Cannot update a practice to be in the past", http.StatusBadRequest)
		return
	}

	var existingPractice models.Practice
	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).First(&existingPractice).Error; err != nil {
		http.Error(w, "Practice not found", http.StatusNotFound)
		return
	}

	updates := make(map[string]any)
	if practice.Status != "" {
		updates["status"] = practice.Status
	}
	if !practice.ScheduledAt.IsZero() {
		updates["scheduled_at"] = practice.ScheduledAt
	}

	if err := h.DB.Model(&existingPractice).Updates(updates).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get the updated practice
	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).First(&practice).Error; err != nil {
		http.Error(w, "Practice not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(practice)
}

// @Summary Delete a practice
// @Description Delete a practice session
// @Tags practices
// @Param clubID path string true "Club ID"
// @Param id path string true "Practice ID"
// @Success 204 "No Content"
// @Router /clubs/{clubID}/practices/{id} [delete]
func (h *Handler) DeletePractice(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	practiceID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid practice ID", http.StatusBadRequest)
		return
	}

	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).Delete(&models.Practice{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
