package handlers

import (
	"encoding/json"
	"flyball-practice-planner/api/models"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// @Summary Create a new owner
// @Description Create a new dog owner
// @Tags owners
// @Accept json
// @Produce json
// @Param owner body models.Owner true "Owner object"
// @Success 201 {object} models.Owner
// @Router /owners [post]
func (h *Handler) CreateOwner(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}

	var owner models.Owner
	if err := json.NewDecoder(r.Body).Decode(&owner); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	owner.ClubID = uuid.MustParse(clubID)

	if err := h.DB.Create(&owner).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(owner)
}

// @Summary Get all owners
// @Description Get a list of all owners with their dogs
// @Tags owners
// @Produce json
// @Success 200 {array} models.Owner
// @Router /owners [get]
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

// @Summary Get an owner by ID
// @Description Get a specific owner by their ID
// @Tags owners
// @Produce json
// @Param id path string true "Owner ID"
// @Success 200 {object} models.Owner
// @Router /owners/{id} [get]
func (h *Handler) GetOwner(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Owner{})
}

// @Summary Update an owner
// @Description Update an existing owner
// @Tags owners
// @Accept json
// @Produce json
// @Param id path string true "Owner ID"
// @Param owner body models.Owner true "Owner object"
// @Success 200 {object} models.Owner
// @Router /owners/{id} [put]
func (h *Handler) UpdateOwner(w http.ResponseWriter, r *http.Request) {
	clubID := chi.URLParam(r, "clubID")
	ownerID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(clubID); err != nil {
		http.Error(w, "Invalid club ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(ownerID); err != nil {
		http.Error(w, "Invalid owner ID", http.StatusBadRequest)
		return
	}

	var owner models.Owner
	if err := json.NewDecoder(r.Body).Decode(&owner); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	owner.ID = uuid.MustParse(ownerID)
	owner.ClubID = uuid.MustParse(clubID)

	if err := h.DB.Save(&owner).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(owner)
}

// @Summary Delete an owner
// @Description Delete an owner
// @Tags owners
// @Param id path string true "Owner ID"
// @Success 204 "No Content"
// @Router /owners/{id} [delete]
func (h *Handler) DeleteOwner(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Owner{})
}

// @Summary Create a new dog
// @Description Create a new dog for an owner
// @Tags dogs
// @Accept json
// @Produce json
// @Param ownerID path string true "Owner ID"
// @Param dog body models.Dog true "Dog object"
// @Success 201 {object} models.Dog
// @Router /owners/{ownerID}/dogs [post]
func (h *Handler) CreateDog(w http.ResponseWriter, r *http.Request) {
	ownerID := chi.URLParam(r, "ownerID")
	if _, err := uuid.Parse(ownerID); err != nil {
		http.Error(w, "Invalid owner ID", http.StatusBadRequest)
		return
	}

	var dog models.Dog
	if err := json.NewDecoder(r.Body).Decode(&dog); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	dog.OwnerID = uuid.MustParse(ownerID)

	// Handle empty CRN
	if dog.CRN != nil && *dog.CRN == "" {
		dog.CRN = nil
	}

	if err := h.DB.Create(&dog).Error; err != nil {
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"idx_dogs_crn\" (SQLSTATE 23505)" {
			http.Error(w, "A dog with this CRN already exists", http.StatusConflict)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dog)
}

// @Summary Get all dogs for an owner
// @Description Get a list of all dogs belonging to an owner
// @Tags dogs
// @Produce json
// @Param ownerID path string true "Owner ID"
// @Success 200 {array} models.Dog
// @Router /owners/{ownerID}/dogs [get]
func (h *Handler) GetAllDogs(w http.ResponseWriter, r *http.Request) {
	ownerID := chi.URLParam(r, "ownerID")
	if _, err := uuid.Parse(ownerID); err != nil {
		http.Error(w, "Invalid UUID format", http.StatusBadRequest)
		return
	}
	h.getAllEntities(w, r, &[]models.Dog{}, "owner_id", ownerID)
}

// @Summary Get a dog by ID
// @Description Get a specific dog by its ID
// @Tags dogs
// @Produce json
// @Param id path string true "Dog ID"
// @Success 200 {object} models.Dog
// @Router /owners/{ownerID}/dogs/{id} [get]
func (h *Handler) GetDog(w http.ResponseWriter, r *http.Request) {
	h.getEntity(w, r, &models.Dog{})
}

// @Summary Update a dog
// @Description Update an existing dog
// @Tags dogs
// @Accept json
// @Produce json
// @Param id path string true "Dog ID"
// @Param dog body models.Dog true "Dog object"
// @Success 200 {object} models.Dog
// @Router /owners/{ownerID}/dogs/{id} [put]
func (h *Handler) UpdateDog(w http.ResponseWriter, r *http.Request) {
	ownerID := chi.URLParam(r, "ownerID")
	dogID := chi.URLParam(r, "id")

	if _, err := uuid.Parse(ownerID); err != nil {
		http.Error(w, "Invalid owner ID", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(dogID); err != nil {
		http.Error(w, "Invalid dog ID", http.StatusBadRequest)
		return
	}

	var dog models.Dog
	if err := json.NewDecoder(r.Body).Decode(&dog); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	dog.ID = uuid.MustParse(dogID)
	dog.OwnerID = uuid.MustParse(ownerID)

	// Handle empty CRN
	if dog.CRN != nil && *dog.CRN == "" {
		dog.CRN = nil
	}

	if err := h.DB.Save(&dog).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(dog)
}

// @Summary Delete a dog
// @Description Delete a dog
// @Tags dogs
// @Param id path string true "Dog ID"
// @Success 204 "No Content"
// @Router /owners/{ownerID}/dogs/{id} [delete]
func (h *Handler) DeleteDog(w http.ResponseWriter, r *http.Request) {
	h.deleteEntity(w, r, &models.Dog{})
}
