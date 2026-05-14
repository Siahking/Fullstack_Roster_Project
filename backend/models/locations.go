package models

import (
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"unicode"
)

type Location struct {
	ID       int     `json:"id"`
	Location *string `json:"location"`
}

func formatLocationName(value string) string {
	words := strings.Fields(value)
	for index, word := range words {
		words[index] = formatLocationWord(word)
	}
	return strings.Join(words, " ")
}

func formatLocationWord(word string) string {
	lowerWord := strings.ToLower(word)
	runes := []rune(lowerWord)
	if len(runes) == 0 || unicode.IsDigit(runes[0]) {
		return lowerWord
	}

	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}

// retrieve all locations
func GetLocations(c *gin.Context, db *sql.DB) {
	rows, err := queryDB(db, "SELECT id, location FROM locations")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var locations []Location

	for rows.Next() {
		var loc Location
		if err := rows.Scan(&loc.ID, &loc.Location); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		locations = append(locations, loc)
	}

	if len(locations) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No locations found"})
		return
	}

	c.IndentedJSON(http.StatusOK, locations)
}

// find location by id or name
func FindLocation(c *gin.Context, db *sql.DB) {
	var query string
	var rows *sql.Rows
	var err error
	var locations []Location

	column := c.Param("column")
	value := c.Param("value")
	baseString := "SELECT id,location FROM locations WHERE "

	if value == "0" || (column != "id" && column != "location") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid param entry"})
		return
	} else if column == "id" {
		query = baseString + "id = ?"
		rows, err = queryDB(db, query, value)
	} else {
		query = baseString + "LOWER(location) LIKE LOWER(?)"
		rows, err = queryDB(db, query, "%"+value+"%")
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error searching for values\n" + err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var loc Location
		err := rows.Scan(&loc.ID, &loc.Location)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while scanning location\n" + err.Error()})
			return
		}
		locations = append(locations, loc)
	}

	if len(locations) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Location not found"})
		return
	}

	c.JSON(http.StatusOK, locations)
}

// add a new location
func AddLocation(c *gin.Context, db *sql.DB) {
	newLocation := formatLocationName(c.Param("location"))

	if newLocation == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Null Parameter"})
		return
	}

	query := "INSERT INTO locations (location) VALUES (?)"
	_, err := execDB(db, query, newLocation)
	if err != nil {
		if hasPostgresCode(err, pgUniqueViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "This location already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert value\n" + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Location added successfully"})
}

// function used to delete a worker or a location
func DeleteEntry(c *gin.Context, db *sql.DB) {
	table := strings.TrimSpace(c.Param("table"))
	id := strings.TrimSpace(c.Param("id"))

	if table == "" || table == ":" || id == "" || id == ":" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input"})
		return
	}

	if table != "workers" && table != "locations" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE id = %s", table, id)
	var result sql.Result
	var err error

	result, err = execDB(db, query)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in getting rows " + err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No rows affected" + err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "No Entry found"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
	}
}

func EditLocation(c *gin.Context, db *sql.DB) {
	var location Location
	currentLocation := formatLocationName(c.Param("location"))

	if currentLocation == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location input"})
		return
	}

	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if location.Location == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location input"})
		return
	}

	newLocation := formatLocationName(*location.Location)
	if newLocation == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid location input"})
		return
	}

	query := `UPDATE locations SET location = ? WHERE LOWER(location) = LOWER(?)`

	result, err := execDB(db, query, newLocation, currentLocation)

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Location with this name already exists"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made, Entry may not exist or is already up to date"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Location edited successfully"})
}
