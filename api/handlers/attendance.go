package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AttendanceUpdate struct {
	DogID     uuid.UUID               `json:"DogID"`
	Attending models.AttendanceStatus `json:"Attending"`
}

type UpdateAttendancesRequest struct {
	Updates []AttendanceUpdate `json:"updates"`
}

type AttendanceResponse struct {
	Attendances map[string]models.AttendanceStatus `json:"attendances"`
}

// @Summary Get all attendances for a practice
// @Description Get a map of dog IDs to their attendance status for a specific practice
// @Tags attendance
// @Produce json
// @Param clubID path string true "Club ID"
// @Param practiceID path string true "Practice ID"
// @Success 200 {object} AttendanceResponse
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

	attendanceMap := make(map[string]models.AttendanceStatus)
	for _, attendance := range attendances {
		attendanceMap[attendance.DogID.String()] = attendance.Attending
	}

	response := AttendanceResponse{
		Attendances: attendanceMap,
	}

	json.NewEncoder(w).Encode(response)
}

// @Summary Update multiple attendances
// @Description Update or create multiple attendance records for dogs in a practice
// @Tags attendance
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param practiceID path string true "Practice ID"
// @Param request body UpdateAttendancesRequest true "Attendance updates"
// @Success 200 {array} models.PracticeAttendance
// @Router /clubs/{clubID}/practices/{practiceID}/attendance [put]
func (h *Handler) UpdateAttendances(w http.ResponseWriter, r *http.Request) {
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

	var req UpdateAttendancesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Start a transaction
	tx := h.DB.Begin()
	if tx.Error != nil {
		http.Error(w, "Failed to start transaction", http.StatusInternalServerError)
		return
	}

	var updatedAttendances []models.PracticeAttendance

	// Process each update
	for _, update := range req.Updates {
		var attendance models.PracticeAttendance
		result := tx.Where("practice_id = ? AND dog_id = ?", practiceID, update.DogID).First(&attendance)

		if result.Error == nil {
			// Update existing record
			attendance.Attending = update.Attending
			if err := tx.Save(&attendance).Error; err != nil {
				tx.Rollback()
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		} else {
			// Create new record
			attendance = models.PracticeAttendance{
				PracticeID: uuid.MustParse(practiceID),
				DogID:      update.DogID,
				Attending:  update.Attending,
			}
			if err := tx.Create(&attendance).Error; err != nil {
				tx.Rollback()
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}
		updatedAttendances = append(updatedAttendances, attendance)
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		http.Error(w, "Failed to commit changes", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedAttendances)
}
