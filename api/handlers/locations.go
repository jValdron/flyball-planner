package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Create a new location
// @Description Create a new location for a club
// @Tags locations
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param location body models.Location true "Location object"
// @Success 201 {object} models.Location
// @Router /clubs/{clubID}/locations [post]
func (h *Handler) CreateLocation(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var location models.Location
	if err := json.NewDecoder(r.Body).Decode(&location); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	location.ClubID = uuid.MustParse(clubID)

	// If this is the first location, make it the default
	var count int64
	if err := h.DB.Model(&models.Location{}).Where("club_id = ?", clubID).Count(&count).Error; err != nil {
		http.Error(w, "Failed to check existing locations", http.StatusInternalServerError)
		return
	}

	if count == 0 {
		location.IsDefault = true
	}

	if err := h.DB.Create(&location).Error; err != nil {
		http.Error(w, "Failed to create location", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(location)
}

// @Summary Get all locations for a club
// @Description Get a list of all locations for a specific club
// @Tags locations
// @Produce json
// @Param clubID path string true "Club ID"
// @Success 200 {array} models.Location
// @Router /clubs/{clubID}/locations [get]
func (h *Handler) GetAllLocations(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var locations []models.Location
	if err := h.DB.Where("club_id = ?", clubID).Order("name ASC").Find(&locations).Error; err != nil {
		http.Error(w, "Failed to retrieve locations", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(locations)
}

// @Summary Get a location by ID
// @Description Get a specific location by its ID
// @Tags locations
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Location ID"
// @Success 200 {object} models.Location
// @Router /clubs/{clubID}/locations/{id} [get]
func (h *Handler) GetLocation(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	locationID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	if _, err := uuid.Parse(locationID); err != nil {
		http.Error(w, "Invalid location ID", http.StatusBadRequest)
		return
	}

	var location models.Location
	if err := h.DB.Where("id = ? AND club_id = ?", locationID, clubID).First(&location).Error; err != nil {
		http.Error(w, "Location not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(location)
}

// @Summary Update a location
// @Description Update an existing location
// @Tags locations
// @Accept json
// @Produce json
// @Param clubID path string true "Club ID"
// @Param id path string true "Location ID"
// @Param location body models.Location true "Location object"
// @Success 200 {object} models.Location
// @Router /clubs/{clubID}/locations/{id} [put]
func (h *Handler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	locationID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	if _, err := uuid.Parse(locationID); err != nil {
		http.Error(w, "Invalid location ID", http.StatusBadRequest)
		return
	}

	var location models.Location
	if err := json.NewDecoder(r.Body).Decode(&location); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	location.ID = uuid.MustParse(locationID)
	location.ClubID = uuid.MustParse(clubID)

	// If this location is being set as default, unset any other default locations
	if location.IsDefault {
		if err := h.DB.Model(&models.Location{}).Where("club_id = ? AND id != ?", clubID, locationID).Update("is_default", false).Error; err != nil {
			http.Error(w, "Failed to update other locations", http.StatusInternalServerError)
			return
		}
	}

	if err := h.DB.Where("id = ? AND club_id = ?", locationID, clubID).Updates(&location).Error; err != nil {
		http.Error(w, "Failed to update location", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(location)
}

// @Summary Delete a location
// @Description Delete a location
// @Tags locations
// @Param clubID path string true "Club ID"
// @Param id path string true "Location ID"
// @Success 204 "No Content"
// @Router /clubs/{clubID}/locations/{id} [delete]
func (h *Handler) DeleteLocation(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	locationID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	if _, err := uuid.Parse(locationID); err != nil {
		http.Error(w, "Invalid location ID", http.StatusBadRequest)
		return
	}

	// Check if this is the last location
	var count int64
	if err := h.DB.Model(&models.Location{}).Where("club_id = ?", clubID).Count(&count).Error; err != nil {
		http.Error(w, "Failed to check location count", http.StatusInternalServerError)
		return
	}

	if count <= 1 {
		http.Error(w, "Cannot delete the last location", http.StatusBadRequest)
		return
	}

	// Check if this is the default location
	var location models.Location
	if err := h.DB.Where("id = ? AND club_id = ?", locationID, clubID).First(&location).Error; err != nil {
		http.Error(w, "Location not found", http.StatusNotFound)
		return
	}

	if location.IsDefault {
		http.Error(w, "Cannot delete the default location", http.StatusBadRequest)
		return
	}

	if err := h.DB.Delete(&location).Error; err != nil {
		http.Error(w, "Failed to delete location", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
