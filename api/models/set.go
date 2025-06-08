package models

import (
	"github.com/google/uuid"
)

type Set struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	PracticeID uuid.UUID `gorm:"type:uuid;not null"`
	LocationID uuid.UUID `gorm:"type:uuid;not null"`
	Order      int
	SetDogs    []SetDog `gorm:"constraint:OnDelete:CASCADE;"`
}
