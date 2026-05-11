package models

import (
	"log"
	"net/url"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(dsn string) {
	m, err := migrate.New(
		migrationFileURL(),
		dsn,
	)
	if err != nil {
		log.Fatal(err)
	}

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		log.Fatal(err)
	}

	log.Print("Migrations applied successfully")
}

func findMigrationsDir() string {
	candidates := []string{
		"migrations",
		filepath.Join("backend", "migrations"),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}

	return "migrations"
}

func migrationFileURL() string {
	absolutePath, err := filepath.Abs(findMigrationsDir())
	if err != nil {
		absolutePath = findMigrationsDir()
	}

	return (&url.URL{
		Scheme: "file",
		Path:   filepath.ToSlash(absolutePath),
	}).String()
}
