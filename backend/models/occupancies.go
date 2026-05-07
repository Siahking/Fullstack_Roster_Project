package models

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Occupancy struct {
	ID        int    `json:"id"`
	WorkerId  int    `json:"worker_id"`
	EventDate string `json:"event_date"`
	Note      string `json:"note"`
}

// occupancy is used to store which days workers are assigned to when they are assigned to different days to work
func CreateNewOccupancy(c *gin.Context, db *sql.DB) {
	var occupancy Occupancy

	if err := c.ShouldBindJSON(&occupancy); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	layout := "2006-01-02"

	_, eventDateError := time.Parse(layout, occupancy.EventDate)

	if eventDateError != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format,\n" + eventDateError.Error()})
		return
	}

	query := "INSERT INTO occupancy (worker_id,event_date,note) VALUES (?,?,?)"
	_, err := db.Exec(query, occupancy.WorkerId, occupancy.EventDate, occupancy.Note)

	if err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			if mysqlErr.Number == 1062 {
				c.JSON(http.StatusConflict, gin.H{"error": "This Occupancy for this worker already exists"})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in inserting values,\n" + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Occupancy added successfully"})
}

// retrieve all occupancies or retrieve occupancies by worker_id,event_date or note
func RetrieveOccupancies(c *gin.Context, db *sql.DB) {
	var query string
	var occupancies []Occupancy
	var rows *sql.Rows
	var err error
	eventDate := c.Query("event_date")
	workerId := c.Query("worker_id")
	note := c.Query("note")

	allowedParams := map[string]bool{
		"event_date": true,
		"worker_id":  true,
		"note":       true,
	}

	for key := range c.Request.URL.Query() {
		if !allowedParams[key] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unrecognized query parameter: " + key})
			return
		}
	}

	var conditions []string
	var args []any
	if eventDate != "" {
		conditions = append(conditions, "event_date = ?")
		args = append(args, eventDate)
	}
	if workerId != "" {
		conditions = append(conditions, "worker_id = ?")
		args = append(args, workerId)
	}
	if note != "" {
		conditions = append(conditions, "note = ?")
		args = append(args, note)
	}

	if len(conditions) == 0 {
		query = "SELECT * FROM occupancy ORDER BY event_date"
		rows, err = db.Query(query)
	} else {
		whereClause := strings.Join(conditions, " AND ")
		query = "SELECT * FROM occupancy WHERE " + whereClause + " ORDER BY event_date"
		rows, err = db.Query(query, args...)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in exctracting values\n" + err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var occupancy Occupancy

		if err := rows.Scan(&occupancy.ID, &occupancy.WorkerId, &occupancy.EventDate, &occupancy.Note); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in retrieving values\n" + err.Error()})
			return
		}

		occupancies = append(occupancies, occupancy)
	}

	if len(occupancies) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No values found"})
		return
	}

	c.JSON(http.StatusOK, occupancies)
}

// remove occupancyby occupancy id
func RemoveOccupancy(c *gin.Context, db *sql.DB) {
	idStr := c.Param("id")

	id, conversionErr := strconv.Atoi(idStr)

	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id Parameter"})
		return
	}

	query := "DELETE FROM occupancy WHERE id = ?"
	result, err := db.Exec(query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in deleting occupancy\n" + err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No rows affected\n" + err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Occupancy does not exist"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
	}
}

// delete all stored records from the occupancy table
func EmptyOccupancies(c *gin.Context, db *sql.DB) {
	query1 := `DELETE FROM occupancy`

	_, err1 := db.Exec(query1)

	if err1 != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in clearing table\n" + err1.Error()})
		return
	}

	query2 := "ALTER TABLE occupancy AUTO_INCREMENT = 1"
	_, err2 := db.Exec(query2)

	if err2 != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while reseting autoincrement\n" + err2.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Table cleared successfully"})
}
