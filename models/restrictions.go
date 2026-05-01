package models

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
)

type PermanentRestriction struct {
	ID        int     `json:"id"`
	WorkerId  int     `json:"worker_id"`
	DayOfWeek string  `json:"day_of_week"`
	StartTime *string `json:"start_time"`
	EndTime   *string `json:"end_time"`
}

// create a new permanent restriction
func CreatePermanentRestriction(c *gin.Context, db *sql.DB) {
	var permanentRestriction PermanentRestriction

	if err := c.ShouldBindJSON(&permanentRestriction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	dayOfWeek := permanentRestriction.DayOfWeek
	startTime := permanentRestriction.StartTime
	endTime := permanentRestriction.EndTime

	if dayOfWeek == "Any" {
		if *startTime == "" && *endTime == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid time values"})
			return
		}
	} else if (startTime == nil || *startTime == "") != (endTime == nil || *endTime == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please insert a start time and a end time"})
		return
	}

	var startTimeSQL, endTimeSQL sql.NullString

	if startTime != nil && *startTime != "" {
		startTimeSQL = sql.NullString{String: *startTime, Valid: true}
	} else {
		startTimeSQL = sql.NullString{Valid: false}
	}

	if endTime != nil && *endTime != "" {
		endTimeSQL = sql.NullString{String: *endTime, Valid: true}
	} else {
		endTimeSQL = sql.NullString{Valid: false}
	}

	query := "INSERT INTO permanent_restrictions (worker_id,day_of_week,start_time,end_time) VALUES (?,?,?,?)"
	_, err := db.Exec(query, permanentRestriction.WorkerId, dayOfWeek, startTimeSQL, endTimeSQL)

	if err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			if mysqlErr.Number == 1062 {
				c.JSON(http.StatusConflict, gin.H{"error": "The restriction for this worker already exists or this worker already has a restriction for this day"})
				return
			} else if mysqlErr.Number == 1452 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "This worker does not exist"})
				return
			} else if mysqlErr.Number == 1265 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Day of Week"})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert values due to error\n" + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Restriction created"})
}

// retrieve all permanent restrictions
func GetRestrictions(c *gin.Context, db *sql.DB) {
	var restrictions []PermanentRestriction
	rows, err := db.Query("SELECT id,worker_id,day_of_week,start_time,end_time FROM permanent_restrictions")

	if err != nil {
		log.Println("DB Query Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch restrictions"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var restriction PermanentRestriction
		if err := rows.Scan(&restriction.ID, &restriction.WorkerId, &restriction.DayOfWeek,
			&restriction.StartTime, &restriction.EndTime); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in scanning rows"})
			return
		}
		restrictions = append(restrictions, restriction)
	}

	if len(restrictions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No restrictions found"})
		return
	}

	c.JSON(http.StatusOK, restrictions)
}

// find permanent retstriction based on worker_id or id (permanent restriction id)
func FindRestriction(c *gin.Context, db *sql.DB) {
	var restrictions []PermanentRestriction
	column := strings.TrimSpace(c.Param("column"))
	id := strings.TrimSpace(c.Param("id"))

	if column != "worker_id" && column != "id" || id == "" || id == ":" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid search params, must be 'worker_id' or 'id'"})
		return
	}

	query := fmt.Sprintf("SELECT id,worker_id,day_of_week,start_time,end_time FROM permanent_restrictions WHERE %s = ?", column)
	rows, err := db.Query(query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in extracting values"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var restriction PermanentRestriction

		err := rows.Scan(&restriction.ID, &restriction.WorkerId, &restriction.DayOfWeek, &restriction.StartTime,
			&restriction.EndTime)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in scanning rows\n" + err.Error()})
			return
		}

		restrictions = append(restrictions, restriction)
	}

	if len(restrictions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No values found"})
		return
	}

	c.JSON(http.StatusOK, restrictions)
}

// delete permanent restriction using restriction id
func DeleteRestriction(c *gin.Context, db *sql.DB) {
	id := strings.TrimSpace(c.Param("id"))

	if id == "" || id == ":" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Id"})
		return
	}

	query := "DELETE FROM permanent_restrictions WHERE id = ?"
	result, err := db.Exec(query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in deleting restriction"})
		return
	}

	rowsAffected, _ := result.RowsAffected()

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Restriction does not exist"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
	}
}

func EditRestriction(c *gin.Context, db *sql.DB) {
	var restriction PermanentRestriction
	var query string
	var result sql.Result
	var err error
	idStr := c.Param("id")

	id, conversionErr := strconv.Atoi(idStr)

	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := c.ShouldBindJSON(&restriction); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if *restriction.StartTime == "99:99:99" && *restriction.EndTime == "99:99:99" {
		query = `UPDATE permanent_restrictions SET 
				worker_id = COALESCE(?, worker_id),
				day_of_week = COALESCE(?, day_of_week),
				start_time = NULL,end_time = NULL WHERE id = ?`

		result, err = db.Exec(query, restriction.WorkerId, restriction.DayOfWeek, id)
	} else {
		if *restriction.StartTime == "99:99:99" {
			query = `UPDATE permanent_restrictions SET 
					worker_id = COALESCE(?, worker_id),
					day_of_week = COALESCE(?, day_of_week),
					start_time = NULL,
					end_time = COALESCE(?, end_time)
					WHERE id = ?`

			result, err = db.Exec(query, restriction.WorkerId, restriction.DayOfWeek, restriction.EndTime, id)
		} else if *restriction.EndTime == "99:99:99" {
			query = `UPDATE permanent_restrictions SET 
					worker_id = COALESCE(?, worker_id),
					day_of_week = COALESCE(?, day_of_week),
					start_time = COALESCE(?, start_time),
					end_time = NULL WHERE id = ?`

			result, err = db.Exec(query, restriction.WorkerId, restriction.DayOfWeek, restriction.StartTime, id)
		} else {
			query = `UPDATE permanent_restrictions SET 
				worker_id = COALESCE(?, worker_id),
				day_of_week = COALESCE(?, day_of_week),
				start_time = COALESCE(?, start_time),
				end_time = COALESCE(?, end_time)
				WHERE id = ?`

			result, err = db.Exec(query, restriction.WorkerId, restriction.DayOfWeek, restriction.StartTime, restriction.EndTime, id)
		}
	}

	if err != nil {

		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1265:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid day value for day of the week field"})
				return
			case 1292:
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time value for start time or end time"})
				return
			case 3819:
				c.JSON(http.StatusBadRequest, gin.H{"error": "End Time must always be Later than the Start Time"})
				return
			default:
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error \n" + err.Error()})
				return
			}
		}
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made, Entry may not exist or is already up to date"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Restriction modified successfully"})
}
