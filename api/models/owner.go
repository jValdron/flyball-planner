package models

import (
	"time"
	"github.com/google/uuid"
)

type Owner struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	GivenName string
	Surname   string
	ClubID    uuid.UUID `gorm:"type:uuid;not null"`
	Dogs      []Dog     `gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}
