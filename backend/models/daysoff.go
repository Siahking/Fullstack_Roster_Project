package models

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type DaysOff struct {
	BreakId   int     `json:"break_id"`
	WorkerId  *int    `json:"worker_id"`
	StartDate *string `json:"start_date"`
	EndDate   *string `json:"end_date"`
}

// create a new day off field
func AddDaysOff(c *gin.Context, db *sql.DB) {
	var daysOff DaysOff

	if err := c.ShouldBind(&daysOff); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalud request body\n" + err.Error()})
		return
	}

	if daysOff.StartDate == nil || daysOff.EndDate == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start Date and End date are required"})
		return
	}

	layout := "2006-01-02"

	startDate, startDateErr := time.Parse(layout, *daysOff.StartDate)
	endDate, endDateErr := time.Parse(layout, *daysOff.EndDate)
	if startDateErr != nil || endDateErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date time format"})
		return
	}

	if startDate.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start date must be in the future"})
		return
	}

	if endDate.Before(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End Date must be after the start date"})
		return
	}

	query := "INSERT INTO days_off (worker_id,start_date,end_date) VALUES (?,?::date,?::date)"
	_, err := execDB(db, query, daysOff.WorkerId, *daysOff.StartDate, *daysOff.EndDate)

	if err != nil {
		if hasPostgresCode(err, pgUniqueViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "This temporary leave for this worker already exists"})
			return
		} else if hasPostgresCode(err, pgForeignKeyViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "This worker does not exist"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in inserting values\n" + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Days off added successfully"})
}

// retrieve all dayoffs values, or retrieve values based on worker_id or break_id
func GetDaysOff(c *gin.Context, db *sql.DB) {
	var rows *sql.Rows
	var err error
	var dayOffs []DaysOff
	column := c.Param("column")
	value := c.Param("value")

	if column == "" {
		rows, err = queryDB(db, "SELECT break_id, worker_id, start_date::text, end_date::text FROM days_off")
	} else if column == "worker_id" {
		query := "SELECT break_id, worker_id, start_date::text, end_date::text FROM days_off WHERE worker_id = ?"
		rows, err = queryDB(db, query, value)
	} else if column == "break_id" {
		query := "SELECT break_id, worker_id, start_date::text, end_date::text FROM days_off WHERE break_id = ?"
		rows, err = queryDB(db, query, value)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column entry"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in extracting values from the table\n" + err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var dates DaysOff

		if err := rows.Scan(&dates.BreakId, &dates.WorkerId, &dates.StartDate, &dates.EndDate); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in retrieving values\n" + err.Error()})
			return
		}

		dayOffs = append(dayOffs, dates)
	}

	if len(dayOffs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No values found"})
		return
	}

	c.JSON(http.StatusOK, dayOffs)
}

// remove dayoff data based on break_id
func RemoveDaysOff(c *gin.Context, db *sql.DB) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Id is not a number"})
		return
	}

	query := "DELETE FROM days_off WHERE break_id = ?"

	result, err := execDB(db, query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in performing query" + err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No rows affected\n" + err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Entry found"})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
		return
	}
}

func EditDayOff(c *gin.Context, db *sql.DB) {
	var dayOff DaysOff
	idStr := c.Param("id")

	id, conversonErr := strconv.Atoi(idStr)

	if conversonErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	if err := c.ShouldBindJSON(&dayOff); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := checkDates(dayOff); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	query := `UPDATE days_off SET
			worker_id = COALESCE(?, worker_id),
			start_date = COALESCE(?::date, start_date),
			end_date = COALESCE(?::date, end_date)
			WHERE break_id = ?`

	result, err := execDB(db, query, dayOff.WorkerId, dayOff.StartDate, dayOff.EndDate, id)

	if err != nil {
		var errMsg string
		switch {
		case hasPostgresCode(err, pgForeignKeyViolation):
			errMsg = "Worker with this ID does not exist"
		case hasPostgresCode(err, pgCheckViolation):
			errMsg = "End Date must be after Start Date and Start Date Must be After the End Date"
		case hasPostgresCode(err, pgUniqueViolation):
			errMsg = "Duplicate Entry, a constraint with this ID Number already exists"
		default:
			errMsg = "Unknown error occurred"
		}
		c.JSON(http.StatusConflict, gin.H{"error": errMsg})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made, Entry may not exist or is already up to date"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Day Off modified successfully"})
}

func checkDates(dayOff DaysOff) error {
	layout := "2006-01-02"
	var startDate, endDate time.Time
	var err error

	if dayOff.StartDate != nil {
		startDate, err = time.Parse(layout, *dayOff.StartDate)

		if err != nil {
			return errors.New(" Invalid Start Date Format")
		}

		if startDate.Before(time.Now()) {
			return errors.New(" Start date must be in the future")
		}
	}
	if dayOff.EndDate != nil {
		endDate, err = time.Parse(layout, *dayOff.EndDate)
		if err != nil {
			return errors.New(" Invalid End Date Format")
		}

		if dayOff.StartDate != nil && endDate.Before(startDate) {
			return errors.New(" End Date must be after the start date")
		}
	}
	return nil
}
