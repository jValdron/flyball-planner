package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Practice struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ScheduledAt sql.NullTime
	Sets        []Set     `gorm:"constraint:OnDelete:CASCADE;"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}
