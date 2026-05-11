package models

import (
	"database/sql"
	"errors"
	"strconv"
	"strings"

	"github.com/lib/pq"
)

const (
	pgUniqueViolation       = "23505"
	pgForeignKeyViolation   = "23503"
	pgCheckViolation        = "23514"
	pgNotNullViolation      = "23502"
	pgInvalidText           = "22P02"
	pgInvalidDatetimeFormat = "22007"
	pgDatetimeFieldOverflow = "22008"
)

func execDB(db *sql.DB, query string, args ...any) (sql.Result, error) {
	return db.Exec(rebindPostgres(query), args...)
}

func queryDB(db *sql.DB, query string, args ...any) (*sql.Rows, error) {
	return db.Query(rebindPostgres(query), args...)
}

func queryRowDB(db *sql.DB, query string, args ...any) *sql.Row {
	return db.QueryRow(rebindPostgres(query), args...)
}

func rebindPostgres(query string) string {
	var builder strings.Builder
	builder.Grow(len(query) + 8)

	argNumber := 1
	for _, char := range query {
		if char == '?' {
			builder.WriteByte('$')
			builder.WriteString(strconv.Itoa(argNumber))
			argNumber++
			continue
		}
		builder.WriteRune(char)
	}

	return builder.String()
}

func hasPostgresCode(err error, codes ...string) bool {
	var pgErr *pq.Error
	if !errors.As(err, &pgErr) {
		return false
	}

	for _, code := range codes {
		if string(pgErr.Code) == code {
			return true
		}
	}
	return false
}
