package models

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Worker struct {
	ID           *int     `json:"id"`
	FirstName    *string  `json:"first_name"`
	LastName     *string  `json:"last_name"`
	MiddleName   *string  `json:"middle_name"`
	Gender       *string  `json:"gender"`
	Address      *string  `json:"address"`
	Contact      *string  `json:"contact"`
	Age          *int     `json:"age"`
	ID_Number    *int64   `json:"id_number"`
	Availability *string  `json:"availability"`
	Hours        []string `json:"hours"`
}

// create a new worker
func AddWorker(c *gin.Context, db *sql.DB) {
	var worker Worker
	if err := c.ShouldBindJSON(&worker); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if *worker.FirstName == "" || *worker.LastName == "" || *worker.Address == "" ||
		*worker.Age == 0 || *worker.ID_Number == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing params"})
		return
	}

	hoursJSON, err := json.Marshal(worker.Hours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert hours to JSON: \n" + err.Error()})
		return
	}

	query := "INSERT INTO workers (first_name, last_name, middle_name,gender,address,contact, age, id_number,availability,hours)VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?::availability_enum, ?::jsonb)"

	_, insertionErr := execDB(db, query, worker.FirstName, worker.LastName, worker.MiddleName,
		worker.Gender, worker.Address, worker.Contact, worker.Age, worker.ID_Number, worker.Availability, string(hoursJSON))

	if insertionErr != nil {
		if hasPostgresCode(insertionErr, pgUniqueViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "Worker with this ID Number already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in adding values to the db: " + insertionErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Worker added successfully"})
}

// find a worker by firstname,lasatname,middlename ,id number or id
func FindWorker(c *gin.Context, db *sql.DB) {
	baseString := "SELECT * FROM workers WHERE "
	id := c.Query("id")
	firstname := c.Query("first_name")
	lastname := c.Query("last_name")
	middlename := c.Query("middle_name")
	id_number := c.Query("id_number")

	var query string
	var rows *sql.Rows
	var err error

	if id != "" {
		query = baseString + "id = ?"
		rows, err = queryDB(db, query, id)
	} else if id_number != "" {
		query = baseString + "id_number = ?"
		rows, err = queryDB(db, query, id_number)
	} else if firstname != "" && lastname != "" && middlename != "" {
		query = baseString + "first_name LIKE ? AND last_name LIKE ? AND middle_name LIKE ?"
		rows, err = queryDB(db, query, "%"+firstname+"%", "%"+lastname+"%", "%"+middlename+"%")
	} else if firstname != "" && middlename != "" {
		query = baseString + "first_name LIKE ? AND middle_name LIKE ?"
		rows, err = queryDB(db, query, "%"+firstname+"%", "%"+middlename+"%")
	} else if lastname != "" && middlename != "" {
		query = baseString + "last_name LIKE ? AND middle_name LIKE ?"
		rows, err = queryDB(db, query, "%"+lastname+"%", "%"+middlename+"%")
	} else if firstname != "" {
		query = baseString + "first_name LIKE ?"
		rows, err = queryDB(db, query, "%"+firstname+"%")
	} else if lastname != "" {
		query = baseString + "last_name LIKE ?"
		rows, err = queryDB(db, query, "%"+lastname+"%")
	} else if middlename != "" {
		query = baseString + "middle_name LIKE ?"
		rows, err = queryDB(db, query, "%"+middlename+"%")
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid search parameters"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in query execution\n" + err.Error()})
		return
	}
	defer rows.Close()

	var workers []Worker

	for rows.Next() {
		var worker Worker
		var hoursJSON string

		err := rows.Scan(&worker.ID, &worker.FirstName, &worker.LastName, &worker.MiddleName,
			&worker.Gender, &worker.Address, &worker.Contact, &worker.Age, &worker.ID_Number, &worker.Availability, &hoursJSON)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning rows\n" + err.Error()})
			return
		}

		if hoursJSON != "" {
			err = json.Unmarshal([]byte(hoursJSON), &worker.Hours)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding hours JSON\n" + err.Error()})
				return
			}
		} else {
			worker.Hours = []string{}
		}
		workers = append(workers, worker)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while going through the rows\n" + err.Error()})
		return
	}

	if len(workers) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Workers found"})
		return
	} else {
		c.JSON(http.StatusOK, workers)
	}
}

// retrieve all workers
func GetWorkers(c *gin.Context, db *sql.DB) {
	rows, err := queryDB(db, "SELECT * FROM workers")

	if err != nil {
		log.Println("DB Query Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to fetch workers",
		})
		return
	}
	defer rows.Close()

	var employees []Worker

	for rows.Next() {
		var worker Worker
		var hoursJSON []byte

		if err := rows.Scan(&worker.ID,
			&worker.FirstName, &worker.LastName,
			&worker.MiddleName, &worker.Gender,
			&worker.Address, &worker.Contact,
			&worker.Age, &worker.ID_Number, &worker.Availability, &hoursJSON); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning rows\n" + err.Error()})
			return
		}

		if err := json.Unmarshal(hoursJSON, &worker.Hours); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error while parsing JSON hours\n" + err.Error()})
			return
		}

		employees = append(employees, worker)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error scanning rows\n" + err.Error()})
		return
	}

	if len(employees) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Employees found"}) //empty table
	} else {
		c.IndentedJSON(http.StatusOK, employees)
	}
}

func EditWorker(c *gin.Context, db *sql.DB) {
	var worker Worker
	var hoursJSON interface{}
	idStr := c.Param("id")

	id, conversonErr := strconv.Atoi(idStr)

	if conversonErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	if err := c.ShouldBindJSON(&worker); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if worker.Hours == nil {
		hoursJSON = nil
	} else {
		value, err := json.Marshal(worker.Hours)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert hours to JSON: \n" + err.Error()})
			return
		}
		hoursJSON = string(value)
	}

	query := `UPDATE workers SET
			first_name = COALESCE(?, first_name),
			last_name = COALESCE(?, last_name),
			middle_name = COALESCE(?, middle_name),
			gender = COALESCE(?, gender),
			address = COALESCE(?, address),
			contact = COALESCE(?, contact),
			age = COALESCE(?, age),
			id_number = COALESCE(?, id_number),
			availability = COALESCE(?::availability_enum, availability),
			hours = COALESCE(?::jsonb, hours)
			WHERE id = ?`

	result, err := execDB(db, query, worker.FirstName, worker.LastName, worker.MiddleName, worker.Gender,
		worker.Address, worker.Contact, worker.Age, worker.ID_Number, worker.Availability,
		hoursJSON, id)

	if err != nil {
		if hasPostgresCode(err, pgUniqueViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "Worker with this id number already exists"})
			return
		}
		c.JSON(http.StatusConflict, gin.H{"error": "Unknown error occured"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made, Entry may not exist or is already up to date"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Worker modified successfully"})
}
