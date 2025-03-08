package models

import (
	"github.com/google/uuid"
)

type Owner struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	GivenName string
	Surname   string
	Dogs      []Dog `gorm:"constraint:OnDelete:CASCADE;"`
}
