package models

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func InitializeDB() (*sql.DB, string, error) {
	_ = godotenv.Load()

	// if err := loadEnvFile(); err != nil {
	// 	return nil, "", err
	// }

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")
	sslMode := os.Getenv("DB_SSLMODE")

	if sslMode == "" {
		sslMode = "disable"
	}

	if user == "" || host == "" {
        return nil, "", fmt.Errorf("database environment variables are missing")
    }

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, dbname, sslMode)

	db, err := sql.Open("postgres", dsn)
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

// func loadEnvFile() error {
// 	candidates := []string{
// 		".env",
// 		"../.env",
// 	}

// 	for _, candidate := range candidates {
// 		if _, err := os.Stat(candidate); err == nil {
// 			if loadErr := godotenv.Load(candidate); loadErr != nil {
// 				return fmt.Errorf("error loading %s file: %v", candidate, loadErr)
// 			}
// 			return nil
// 		}
// 	}

// 	return fmt.Errorf("error loading .env file: no .env file found in backend/ or project root")
// }
