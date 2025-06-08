package main

import (
	"encoding/csv"
	"flyball-practice-planner/api/models"
	"log"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	var count int64
	db.Model(&models.Owner{}).Count(&count)
	if count > 0 {
		log.Println("Database already seeded, skipping...")
		return
	}

	log.Println("Seeding database...")

	// Create club
	club := models.Club{
		ID:             uuid.New(),
		Name:           "On My Go!",
		NAFAClubNumber: "1002",
	}
	db.Create(&club)

	ownersCSV := `givenName,surname
Andrea,Donovan
Brit,Walton
Christine,NT
Gerry,Teed
Jack,Brown
Janice,Aubé
Jason,Valdron
Kelly,Hogg
Karen,Jacobson
Kendra,DeWitt
Nicole,Kerr
Patti,Breaker
Sandra-Sam,Foster
Stefani,Chouinard
Victoria,Perron
Whitney,Yapp
Nadia,Miller
Hilary,Fegan
Emily,Totton
Julia,Khoury
Carrie,MacAllister`
	dogsCSV := `name,ownerGivenName
Fennec,Andrea
Rose,Andrea
Atticus,Brit
Millie,Brit
Myst,Christine
Prim,Christine
Onyx,Gerry
Gracie,Jack
Lexi,Janice
Timber,Janice
Vala,Jason
Belinda,Karen
Keen,Kelly
Luna,Kelly
Juno,Kendra
Kiwi,Kendra
Piper,Nicole
Quinn,Nicole
Ten,Patti
Viv,Patti
Zig,Patti
Axle,Sandra-Sam
Rush,Sandra-Sam
Styx,Sandra-Sam
Even,Stefani
Prize,Stefani
Envy,Victoria
Logan,Whitney
Lupin,Whitney
Pippin,Whitney
Press,Nadia
Bandit,Hilary
Bean,Emily
Miso,Julia
Scooter,Carrie`

	var owners []models.Owner
	reader := csv.NewReader(strings.NewReader(ownersCSV))
	rows, _ := reader.ReadAll()
	for i, row := range rows {
		if i == 0 {
			continue
		}
		owners = append(owners, models.Owner{
			ID:        uuid.New(),
			GivenName: row[0],
			Surname:   row[1],
			ClubID:    club.ID,
		})
	}
	db.Create(&owners)

	var dogs []models.Dog
	reader = csv.NewReader(strings.NewReader(dogsCSV))
	rows, _ = reader.ReadAll()
	for i, row := range rows {
		if i == 0 {
			continue
		}
		var owner models.Owner
		db.Where("given_name = ?", row[1]).First(&owner)
		dogs = append(dogs, models.Dog{
			ID:      uuid.New(),
			Name:    row[0],
			OwnerID: owner.ID,
			ClubID:  club.ID,
		})
	}
	db.Create(&dogs)

	log.Println("Database seeding complete.")
}
