package models

import (
	"time"
	"github.com/google/uuid"
)

type Note struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Content   string    `gorm:"not null"`
	DogID     uuid.UUID `gorm:"type:uuid;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}
