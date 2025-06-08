package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Create a new room
// @Description Create a new room for a club
// @Tags rooms
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param room body models.Room true "Room object"
// @Success 201 {object} models.Room
// @Router /clubs/{clubID}/rooms [post]
func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var room models.Room
	if err := json.NewDecoder(r.Body).Decode(&room); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	room.ClubID = uuid.MustParse(clubID)

	// If this is the first room, make it the default
	var count int64
	if err := h.DB.Model(&models.Room{}).Where("club_id = ?", clubID).Count(&count).Error; err != nil {
		http.Error(w, "Failed to check existing rooms", http.StatusInternalServerError)
		return
	}
	if count == 0 {
		room.IsDefault = true
	}

	if err := h.DB.Create(&room).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

// @Summary Get all rooms for a club
// @Description Get a list of all rooms for a specific club
// @Tags rooms
// @Produce json
// @Param clubID path string true "Club ID"
// @Success 200 {array} models.Room
// @Router /clubs/{clubID}/rooms [get]
func (h *Handler) GetAllRooms(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var rooms []models.Room
	if err := h.DB.Where("club_id = ?", clubID).Order("name ASC").Find(&rooms).Error; err != nil {
		http.Error(w, "Failed to retrieve rooms", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(rooms)
}

// @Summary Get a room by ID
// @Description Get a specific room by its ID
// @Tags rooms
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Room ID"
// @Success 200 {object} models.Room
// @Router /clubs/{clubID}/rooms/{id} [get]
func (h *Handler) GetRoom(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	roomID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(roomID); err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	var room models.Room
	if err := h.DB.Where("id = ? AND club_id = ?", roomID, clubID).First(&room).Error; err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(room)
}

// @Summary Update a room
// @Description Update an existing room
// @Tags rooms
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Room ID"
// @Param room body models.Room true "Room object"
// @Success 200 {object} models.Room
// @Router /clubs/{clubID}/rooms/{id} [put]
func (h *Handler) UpdateRoom(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	roomID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(roomID); err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	var room models.Room
	if err := json.NewDecoder(r.Body).Decode(&room); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Ensure IDs match URL parameters
	room.ID = uuid.MustParse(roomID)
	room.ClubID = uuid.MustParse(clubID)

	// If this room is being set as default, unset any other default rooms
	if room.IsDefault {
		if err := h.DB.Model(&models.Room{}).Where("club_id = ? AND id != ?", clubID, roomID).Update("is_default", false).Error; err != nil {
			http.Error(w, "Failed to update other rooms", http.StatusInternalServerError)
			return
		}
	}

	if err := h.DB.Where("id = ? AND club_id = ?", roomID, clubID).Updates(&room).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(room)
}

// @Summary Delete a room
// @Description Delete a room
// @Tags rooms
// @Param clubID path string true "Club ID"
// @Param id path string true "Room ID"
// @Success 204 "No Content"
// @Router /clubs/{clubID}/rooms/{id} [delete]
func (h *Handler) DeleteRoom(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	roomID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(roomID); err != nil {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}

	// Check if this is the last room
	var count int64
	if err := h.DB.Model(&models.Room{}).Where("club_id = ?", clubID).Count(&count).Error; err != nil {
		http.Error(w, "Failed to check room count", http.StatusInternalServerError)
		return
	}
	if count <= 1 {
		http.Error(w, "Cannot delete the last room", http.StatusBadRequest)
		return
	}

	// Check if this is the default room
	var room models.Room
	if err := h.DB.Where("id = ? AND club_id = ?", roomID, clubID).First(&room).Error; err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}
	if room.IsDefault {
		// Set another room as default before deleting
		var newDefault models.Room
		if err := h.DB.Where("club_id = ? AND id != ?", clubID, roomID).First(&newDefault).Error; err != nil {
			http.Error(w, "Failed to find another room to set as default", http.StatusInternalServerError)
			return
		}
		if err := h.DB.Model(&newDefault).Update("is_default", true).Error; err != nil {
			http.Error(w, "Failed to set new default room", http.StatusInternalServerError)
			return
		}
	}

	if err := h.DB.Where("id = ? AND club_id = ?", roomID, clubID).Delete(&models.Room{}).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
