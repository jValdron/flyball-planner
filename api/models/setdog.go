package models

import (
	"github.com/google/uuid"
)

type SetDog struct {
	SetID uuid.UUID `gorm:"primaryKey"`
	DogID uuid.UUID `gorm:"primaryKey"`
	Order int
	Lane  string
}
