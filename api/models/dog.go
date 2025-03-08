package models

import (
	"github.com/google/uuid"
)

type Dog struct {
	ID      uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name    string
	OwnerID uuid.UUID `gorm:"type:uuid;not null"`
}
