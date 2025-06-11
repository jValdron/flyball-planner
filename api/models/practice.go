package models

import (
	"time"

	"github.com/google/uuid"
)

type PracticeStatus string

const (
	PracticeStatusDraft PracticeStatus = "Draft"
	PracticeStatusReady PracticeStatus = "Ready"
)

type Practice struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ClubID      uuid.UUID      `gorm:"type:uuid;not null;column:club_id"`
	ScheduledAt time.Time      `gorm:"not null"`
	Status      PracticeStatus `gorm:"type:varchar(10);default:'Draft'"`
	Sets        []Set          `gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt   time.Time      `gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
}
