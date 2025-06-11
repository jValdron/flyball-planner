package models

import (
	"time"

	"github.com/google/uuid"
)

type DogStatus string

const (
	DogStatusActive   DogStatus = "Active"
	DogStatusInactive DogStatus = "Inactive"
)

type Dog struct {
	ID      uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name    string
	CRN     *string   `gorm:"uniqueIndex:idx_dogs_crn,where:crn IS NOT NULL"`
	OwnerID uuid.UUID `gorm:"type:uuid;not null"`
	ClubID  uuid.UUID `gorm:"type:uuid;not null"`
	/**
	  Level 1: Just beginning training
		Level 2: Started jump work, wall or box work
		Level 3: Dog is on the box
		Level 4: Can do lineups but not yet solid
		Level 5: Solid dog that can do anything
	*/
	TrainingLevel int       `gorm:"not null;default:1;check:training_level >= 1 AND training_level <= 5"`
	Status        DogStatus `gorm:"not null;default:'Active';check:status IN ('Active', 'Inactive')"`
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}
