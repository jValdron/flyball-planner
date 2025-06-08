package models

import (
	"time"

	"github.com/google/uuid"
)

type AttendanceStatus int

const (
	AttendanceUnknown AttendanceStatus = iota
	AttendanceNo
	AttendanceYes
)

type PracticeAttendance struct {
	ID         uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	PracticeID uuid.UUID        `gorm:"type:uuid;not null"`
	DogID      uuid.UUID        `gorm:"type:uuid;not null"`
	Attending  AttendanceStatus `gorm:"type:integer;not null;default:0"`
	CreatedAt  time.Time        `gorm:"autoCreateTime"`
	UpdatedAt  time.Time        `gorm:"autoUpdateTime"`
}
