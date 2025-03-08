package models

import (
	"database/sql"

	"github.com/google/uuid"
)

type Practice struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ScheduledAt sql.NullTime
	Sets        []Set `gorm:"constraint:OnDelete:CASCADE;"`
}
