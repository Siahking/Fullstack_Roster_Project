package models

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	"net/http"
	"strconv"
	"strings"
)

type WorkerLocation struct {
	ID         int  `json:"id"`
	WorkerID   *int `json:"worker_id"`
	LocationID *int `json:"location_id"`
}

// assign workers to location using workerid and locationid
func AssignWorkerToLocation(c *gin.Context, db *sql.DB) {
	workerIdStr := c.Param("worker_id")
	locationIdStr := c.Param("location_id")

	if workerIdStr == "" || locationIdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	workerId, err1 := strconv.Atoi(workerIdStr)
	locationId, err2 := strconv.Atoi(locationIdStr)

	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "WorkerId and LocationId needs to be numeric values"})
		return
	}

	query := "INSERT INTO worker_locations (worker_id,location_id) VALUES (?,?)"
	_, err := db.Exec(query, workerId, locationId)
	if err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			if mysqlErr.Number == 1062 {
				c.JSON(http.StatusConflict, gin.H{"error": "Worker Location link already exists"})
				return
			} else if mysqlErr.Number == 1452 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert value\n" + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Connection added successfully"})
}

// retrieve all connections between workers and locations based on workerid or location id
func GetWorkerLocationConnections(c *gin.Context, db *sql.DB) {
	column := strings.TrimSpace(c.Param("column"))
	valueStr := c.Param("id")
	validQueries := map[string]string{
		"worker_id":   "SELECT * FROM worker_locations WHERE worker_id = ?",
		"location_id": "SELECT * FROM worker_locations WHERE location_id = ?",
		"id":          "SELECT * FROM worker_locations WHERE id = ?",
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get values from the database\n" + err.Error()})
		return
	}
	defer rows.Close()

	var connections []WorkerLocation
	for rows.Next() {
		var connection WorkerLocation
		err := rows.Scan(&connection.ID, &connection.WorkerID, &connection.LocationID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning rows\n" + err.Error()})
			return
		}
		connections = append(connections, connection)
	}

	if len(connections) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No worker location connections found"})
		return
	}

	c.JSON(http.StatusOK, connections)
}

// remove worker to locations connection based on the connection id, worker id or location id
func RemoveConnection(c *gin.Context, db *sql.DB) {
	var query string
	var result sql.Result
	var err error

	workerID := c.Query("worker_id")
	locationID := c.Query("location_id")
	Id := c.Query("id")

	if Id != "" {
		query = "DELETE FROM worker_locations WHERE id = ?"
		result, err = db.Exec(query, Id)
	} else if workerID != "" && locationID != "" {
		query = "DELETE FROM worker_locations WHERE worker_id = ? AND location_id = ?"
		result, err = db.Exec(query, workerID, locationID)
	} else if workerID != "" {
		query = "DELETE FROM worker_locations WHERE worker_id = ?"
		result, err = db.Exec(query, workerID)
	} else if locationID != "" {
		query = "DELETE FROM worker_locations WHERE location_id = ?"
		result, err = db.Exec(query, locationID)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid column input"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in deleting values " + err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in checking rows" + err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Entry found"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
	}
}

func EditConnection(c *gin.Context, db *sql.DB) {
	var connection WorkerLocation
	idStr := c.Param("id")

	id, conversionErr := strconv.Atoi(idStr)

	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	if err := c.ShouldBindJSON(&connection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `UPDATE worker_locations SET
			worker_id = COALESCE(?, worker_id),
			location_id = COALESCE(?, location_id)
			WHERE id = ?`

	result, err := db.Exec(query, connection.WorkerID, connection.LocationID, id)
	if err != nil {
		var errMsg string
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1452:
				errMsg = "Worker or Location with this ID does not exist"
			case 1062:
				errMsg = "Duplicate Entry, a connection with this worker and location params already exists"
			}
		} else {
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
	c.JSON(http.StatusCreated, gin.H{"message": "Connection modified successfully"})
}
