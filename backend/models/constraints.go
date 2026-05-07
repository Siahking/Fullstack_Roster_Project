package models

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
)

type Constraint struct {
	ID      *int    `json:"id"`
	Worker1 *int    `json:"worker1_id"`
	Worker2 *int    `json:"worker2_id"`
	Note    *string `json:"note"`
}

// Create constraint
func CreateConstrant(c *gin.Context, db *sql.DB) {
	var constraint Constraint

	if err := c.ShouldBindJSON(&constraint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := "INSERT INTO worker_constraints (worker1_id,worker2_id,note) VALUES (?,?,?)"

	_, err := db.Exec(query, constraint.Worker1, constraint.Worker2, constraint.Note)

	if err != nil {
		var errMsg string
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1452:
				errMsg = "Worker with this ID does not exist"
			case 1048:
				errMsg = "Null worker cannot exist"
			case 3819:
				errMsg = "Can't use the same worker value for both params"
			case 1062:
				errMsg = "Duplicate entry, Constraint already exists"
			default:
				errMsg = "Database error"
			}
		} else {
			errMsg = "Unknown error occurred"
		}
		c.JSON(http.StatusConflict, gin.H{"error": errMsg})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successful entry"})
}

// find constraint based on worker's firstname and last name
func FindConstraint(c *gin.Context, db *sql.DB) {
	advancedSearch := false
	var query string
	var rows *sql.Rows
	var err error
	var id int

	worker1Id := c.Query("worker1_id")
	worker2Id := c.Query("worker2_id")

	idStr := c.Query("id")
	worker1FirstName := c.Query("worker1_firstname")
	worker1LastName := c.Query("worker1_lastname")
	worker2FirstName := c.Query("worker2_firstname")
	worker2LastName := c.Query("worker2_lastname")
	baseString1 := `SELECT wc.id,w1.first_name AS worker1_firstname,w1.last_name AS worker1_lastname,w2.first_name AS worker2_firstname,
					w2.last_name AS worker2_lastname,wc.note AS note 
					FROM worker_constraints wc 
					JOIN workers w1 ON wc.worker1_id = w1.id
					JOIN workers w2 ON wc.worker2_id = w2.id
					WHERE`
	baseString2 := "SELECT * FROM worker_constraints"

	if idStr == "" {
		id = 0
	} else {
		id, err = strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}
	}

	if worker1Id != "" && worker2Id != "" {
		query = baseString2 + " WHERE worker1_id = ? AND worker2_id = ?"
		rows, err = db.Query(query, worker1Id, worker2Id)
	} else if id == 0 && worker1FirstName == "" && worker1LastName == "" && worker2FirstName == "" {
		rows, err = db.Query(baseString2)
	} else if id > 0 {
		query = baseString2 + " WHERE id = ?"
		rows, err = db.Query(query, id)
	} else {
		advancedSearch = true
		if worker1FirstName != "" && worker2FirstName != "" {
			query = baseString1 + `(
				(w1.first_name = ? AND w1.last_name = ? AND w2.first_name = ? AND w2.last_name = ? )
				OR 
				(w1.first_name = ? AND w1.last_name = ? AND w2.first_name = ? AND w2.last_name = ? )
			)`
			rows, err = db.Query(
				query, worker1FirstName, worker1LastName, worker2FirstName, worker2LastName,
				worker2FirstName, worker2LastName, worker1FirstName, worker1LastName)
		} else if worker1FirstName != "" || worker2FirstName != "" {
			query = baseString1 + ` (w1.first_name = ? AND w1.last_name = ? OR w2.first_name = ? AND w2.last_name = ?)`
			if worker1FirstName != "" {
				rows, err = db.Query(query, worker1FirstName, worker1LastName, worker1FirstName, worker1LastName)
			} else {
				rows, err = db.Query(query, worker2FirstName, worker2LastName, worker2FirstName, worker2LastName)
			}
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid search parameters"})
			return
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in searching for constraint\n" + err.Error()})
		return
	}

	defer rows.Close()

	if advancedSearch {
		var results []AdvancedConstraintSearch

		for rows.Next() {
			var constraint AdvancedConstraintSearch
			innerError := rows.Scan(&constraint.ID, &constraint.Worker1FirstName, &constraint.Worker1LastName,
				&constraint.Worker2FirstName, &constraint.Worker2LastName, &constraint.Note)
			if innerError != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while scanning location\n" + innerError.Error()})
				return
			}
			results = append(results, constraint)
		}

		if len(results) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No constraint found"})
			return
		}

		c.IndentedJSON(http.StatusOK, results)
	} else {
		var constraints []Constraint

		for rows.Next() {
			var constraint Constraint
			innerError := rows.Scan(&constraint.ID, &constraint.Worker1, &constraint.Worker2, &constraint.Note)
			if innerError != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while scanning location\n" + innerError.Error()})
				return
			}
			constraints = append(constraints, constraint)
		}

		if len(constraints) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "No constraint found"})
			return
		}

		c.IndentedJSON(http.StatusOK, constraints)
	}
}

// edit constraints by changing constraints between different workers and reason behind why the constraint exists
func EditConstraints(c *gin.Context, db *sql.DB) {
	var constraint Constraint
	idStr := c.Param("id")

	id, conversionErr := strconv.Atoi(idStr)

	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	if err := c.ShouldBindJSON(&constraint); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	query := `UPDATE worker_constraints SET 
			worker1_id = COALESCE(?, worker1_id),
			worker2_id = COALESCE(?, worker2_id),
			note = COALESCE(?, note) 
			WHERE id = ?`

	result, err := db.Exec(query, constraint.Worker1, constraint.Worker2, constraint.Note, id)

	if err != nil {
		var errMsg string
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1452:
				errMsg = "Worker with this ID does not exist"
			case 3819:
				errMsg = "Can't use the same worker value for both params"
			case 1062:
				errMsg = "Duplicate Entry, a constraint with this ID Number already exists"
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

	c.JSON(http.StatusCreated, gin.H{"message": "Constraint modified successfully"})
}

// delete constraint using constraint id
func DeleteConstraint(c *gin.Context, db *sql.DB) {
	idStr := c.Param("id")

	id, err := strconv.Atoi(idStr)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id parameter"})
		return
	}

	query := "DELETE FROM worker_constraints WHERE id = ?"
	result, err := db.Exec(query, id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in deleting constraint\n" + err.Error()})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No rows affected\n" + err.Error()})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Constraint does not exist"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Entry deleted successfully"})
	}
}
