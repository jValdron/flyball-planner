package models

import (
	"time"

	"github.com/google/uuid"
)

type Club struct {
	ID                  uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name                string    `gorm:"not null"`
	NAFAClubNumber      string    `gorm:"uniqueIndex;not null"`
	DefaultPracticeTime string    `gorm:"not null;default:'10:00'"`
	CreatedAt           time.Time `gorm:"autoCreateTime"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}
