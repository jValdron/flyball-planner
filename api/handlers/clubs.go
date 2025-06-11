package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// @Summary Get all clubs
// @Description Get a list of all clubs
// @Tags clubs
// @Produce json
// @Success 200 {array} models.Club
// @Router /clubs [get]
func (h *Handler) GetAllClubs(w http.ResponseWriter, r *http.Request) {
	var clubs []models.Club
	if err := h.DB.Order("name ASC").Find(&clubs).Error; err != nil {
		http.Error(w, "Failed to retrieve clubs", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(clubs)
}

// @Summary Get a club
// @Description Get a specific club by its ID
// @Tags clubs
// @Produce json
// @Param id path string true "Club ID"
// @Success 200 {object} models.Club
// @Router /clubs/{id} [get]
func (h *Handler) GetClub(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Club{})
}

// @Summary Create a club
// @Description Create a new club
// @Tags clubs
// @Accept json
// @Produce json
// @Param club body models.Club true "Club object"
// @Success 201 {object} models.Club
// @Router /clubs [post]
func (h *Handler) CreateClub(w http.ResponseWriter, r *http.Request) {
	var club models.Club
	if err := json.NewDecoder(r.Body).Decode(&club); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := h.DB.Create(&club).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(club)
}

// @Summary Update a club
// @Description Update an existing club's information
// @Tags clubs
// @Accept json
// @Produce json
// @Param id path string true "Club ID"
// @Param club body models.Club true "Club object"
// @Success 200 {object} models.Club
// @Router /clubs/{id} [put]
func (h *Handler) UpdateClub(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "id")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var club models.Club
	if err := json.NewDecoder(r.Body).Decode(&club); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	club.ID = uuid.MustParse(clubID)

	if err := h.DB.Save(&club).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(club)
}

// @Summary Get all dogs in a club
// @Description Get a list of all dogs belonging to members of a club
// @Tags clubs
// @Produce json
// @Param id path string true "Club ID"
// @Success 200 {array} models.Dog
// @Router /clubs/{id}/dogs [get]
func (h *Handler) GetAllClubDogs(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "id")

	var dogs []models.Dog
	if err := h.DB.Where("club_id = ?", clubID).Find(&dogs).Error; err != nil {
		http.Error(w, "Failed to retrieve dogs", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(dogs)
}

// @Summary Get a specific dog in a club
// @Description Get a specific dog by its ID within a club
// @Tags clubs
// @Produce json
// @Param id path string true "Club ID"
// @Param dogId path string true "Dog ID"
// @Success 200 {object} models.Dog
// @Router /clubs/{id}/dogs/{dogId} [get]
func (h *Handler) GetClubDog(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "id")
	dogID := chi.URLParam(r, "dogId")
	var dog models.Dog
	if err := h.DB.Where("id = ? AND club_id = ?", dogID, clubID).First(&dog).Error; err != nil {
		http.Error(w, "Dog not found in this club", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(dog)
}
