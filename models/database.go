package models

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func InitializeDB() (*sql.DB, string, error) {

	err := godotenv.Load()
	if err != nil {
		return nil, "", fmt.Errorf("error loading .env file: %v", err)
	}

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, password, host, port, dbname)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, "", err
	}

	//Test database connection
	if err = db.Ping(); err != nil {
		return nil, "", fmt.Errorf("cannot connect to the database: %v", err)
	}

	fmt.Println("Connection established successfully!")
	return db, dsn, nil
}
