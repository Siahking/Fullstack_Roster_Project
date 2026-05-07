package models

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdvancedConstraintSearch struct {
	ID               *int    `json:"id"`
	Worker1FirstName *string `json:"worker1_firstname"`
	Worker1LastName  *string `json:"worker1_lastname"`
	Worker2FirstName *string `json:"worker2_firstname"`
	Worker2LastName  *string `json:"worker2_lastname"`
	Note             *string `json:"note"`
}

func RetrieveWorkersOrLocation(c *gin.Context, db *sql.DB) {
	column := strings.TrimSpace(c.Param("column"))
	valueStr := c.Param("id")

	validQueries := map[string]string{
		"worker_id":   "SELECT l.* FROM locations l JOIN worker_locations wl on l.id = wl.location_id WHERE wl.worker_id = ?",
		"location_id": "SELECT w.* FROM workers w JOIN worker_locations wl ON w.id = wl.worker_id WHERE wl.location_id = ?",
	}

	value, conversionErr := strconv.Atoi(valueStr)
	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id parameter"})
		return
	}

	query, exists := validQueries[column]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column parameter"})
		return
	}

	rows, err := db.Query(query, value)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve values from database\n" + err.Error()})
		return
	}
	defer rows.Close()

	var connections interface{}
	found := false

	if column == "worker_id" {
		var locations []Location
		for rows.Next() {
			found = true
			var location Location
			err := rows.Scan(&location.ID, &location.Location)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan locations\n" + err.Error()})
				return
			}
			locations = append(locations, location)
		}
		connections = locations
	} else {
		var workers []Worker
		for rows.Next() {
			found = true
			var worker Worker
			var hoursJSON string
			err := rows.Scan(&worker.ID, &worker.FirstName, &worker.LastName, &worker.MiddleName,
				&worker.Gender, &worker.Address, &worker.Contact, &worker.Age, &worker.ID_Number,
				&worker.Availability, &hoursJSON)

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan workers\n" + err.Error()})
				return
			}

			if hoursJSON != "" {
				conversionErr := json.Unmarshal([]byte(hoursJSON), &worker.Hours)
				if conversionErr != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in decoding hours JSON\n" + conversionErr.Error()})
					return
				}
			} else {
				worker.Hours = []string{}
			}
			workers = append(workers, worker)
		}
		connections = workers
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "No values retrieved for given params"})
		return
	}

	c.JSON(http.StatusOK, connections)
}
