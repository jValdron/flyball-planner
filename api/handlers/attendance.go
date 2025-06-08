package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Get all attendances for a practice
// @Description Get a list of all attendance records for a specific practice
// @Tags attendance
// @Produce json
// @Param clubID path string true "Club ID"
// @Param practiceID path string true "Practice ID"
// @Success 200 {array} models.PracticeAttendance
// @Router /clubs/{clubID}/practices/{practiceID}/attendance [get]
func (h *Handler) GetAllAttendances(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	practiceID := chi.URLParam(r, "practiceID")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid practice ID", http.StatusBadRequest)
		return
	}

	// Verify the practice belongs to the club
	var practice models.Practice
	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).First(&practice).Error; err != nil {
		http.Error(w, "Practice not found", http.StatusNotFound)
		return
	}

	var attendances []models.PracticeAttendance
	if err := h.DB.Where("practice_id = ?", practiceID).Find(&attendances).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(attendances)
}

// @Summary Update attendance for a dog
// @Description Update or create attendance record for a dog in a practice
// @Tags attendance
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param practiceID path string true "Practice ID"
// @Param dogID path string true "Dog ID"
// @Param attendance body models.PracticeAttendance true "Attendance object"
// @Success 200 {object} models.PracticeAttendance
// @Router /clubs/{clubID}/practices/{practiceID}/attendance/{dogID} [put]
func (h *Handler) UpdateAttendance(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	practiceID := chi.URLParam(r, "practiceID")
	dogID := chi.URLParam(r, "dogID")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(practiceID); err != nil {
		http.Error(w, "Invalid practice ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(dogID); err != nil {
		http.Error(w, "Invalid dog ID", http.StatusBadRequest)
		return
	}

	// Verify the practice belongs to the club
	var practice models.Practice
	if err := h.DB.Where("id = ? AND club_id = ?", practiceID, clubID).First(&practice).Error; err != nil {
		http.Error(w, "Practice not found", http.StatusNotFound)
		return
	}

	var attendance models.PracticeAttendance
	if err := json.NewDecoder(r.Body).Decode(&attendance); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Ensure the IDs match the URL parameters
	attendance.PracticeID = uuid.MustParse(practiceID)
	attendance.DogID = uuid.MustParse(dogID)

	// Try to find existing attendance record
	var existingAttendance models.PracticeAttendance
	result := h.DB.Where("practice_id = ? AND dog_id = ?", practiceID, dogID).First(&existingAttendance)

	if result.Error == nil {
		// Update existing record
		if err := h.DB.Model(&existingAttendance).Updates(map[string]interface{}{
			"attending": attendance.Attending,
		}).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		attendance = existingAttendance
	} else {
		// Create new record
		if err := h.DB.Create(&attendance).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	json.NewEncoder(w).Encode(attendance)
}
