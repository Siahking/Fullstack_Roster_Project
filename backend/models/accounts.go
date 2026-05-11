package models

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type Account struct {
	AccountID int     `json:"account_id"`
	Username  *string `json:"username"`
	Password  *string `json:"password"`
}

func CreateAccount(c *gin.Context, db *sql.DB) {
	var account Account

	if err := c.ShouldBindJSON(&account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if *account.Username == "" || *account.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Params"})
		return
	}

	encryptedPassword, err := bcrypt.GenerateFromPassword([]byte(*account.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	query := "INSERT INTO user_accounts (username,password) VALUES (?,?)"

	_, insertionErr := execDB(db, query, account.Username, string(encryptedPassword))

	if insertionErr != nil {
		if hasPostgresCode(insertionErr, pgUniqueViolation) {
			c.JSON(http.StatusConflict, gin.H{"error": "An account with this username already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in creating account: " + insertionErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Account created successfully"})
}

func RetrieveAccounts(db *sql.DB, username string) (*Account, error) {
	if username == "" {
		return nil, fmt.Errorf("Username is required")
	}

	query := "SELECT * FROM user_accounts WHERE username = ?"
	row := queryRowDB(db, query, username)

	var account Account
	err := row.Scan(&account.AccountID, &account.Username, &account.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, sql.ErrNoRows
		}
		return nil, err
	}

	return &account, nil
}

func FindAccount(c *gin.Context, db *sql.DB) {
	username := c.Param("username")

	query := `SELECT * FROM user_accounts WHERE username = ?`

	rows, err := queryDB(db, query, username)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in query execution\n" + err.Error()})
		return
	}

	defer rows.Close()

	var accounts []Account

	for rows.Next() {
		var account Account

		err := rows.Scan(&account.AccountID, &account.Username, &account.Password)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error in scanning rows\n" + err.Error()})
			return
		}

		accounts = append(accounts, account)
	}

	if len(accounts) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Accounts found"})
		return
	} else {
		c.JSON(http.StatusOK, accounts)
	}
}

func EditAccount(c *gin.Context, db *sql.DB) {
	var account Account
	idStr := c.Param("id")

	id, conversionErr := strconv.Atoi(idStr)

	if conversionErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID parameter"})
		return
	}

	if err := c.ShouldBind(&account); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if account.Password != nil {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*account.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error found while hashing new password"})
			return
		}

		hashedStr := string(hashedPassword)
		account.Password = &hashedStr
	}

	query := `UPDATE user_accounts SET
		username = COALESCE(?, username),
		password = COALESCE(?, password)
		WHERE account_id = ?
	`

	result, err := execDB(db, query, account.Username, account.Password, id)

	if err != nil {
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No changes made, Entry may not exist or is already up to date"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account modified successfully"})
}

func DeleteAccount(c *gin.Context, db *sql.DB) {
	baseString := "DELETE FROM user_accounts WHERE "
	accountId := c.Query("account_id")
	username := c.Query("username")

	var query string
	var result sql.Result
	var err error

	if accountId != "" {
		query = baseString + "account_id = ?"
		result, err = execDB(db, query, accountId)
	} else if username != "" {
		query = baseString + "username = ?"
		result, err = execDB(db, query, username)
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params"})
		return
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error in deleting values\n" + err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No Entry found for given params"})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
	}
}

func Login(c *gin.Context, db *sql.DB) {
	var input Account
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if input.Username == nil || input.Password == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Usrname and password required",
		})
		return
	}

	account, err := RetrieveAccounts(db, *input.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "No account found with this username"})
			return
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(*account.Password), []byte(*input.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
		return
	}

	session := sessions.Default(c)
	session.Set("user", *account.Username)
	session.Save()

	c.JSON(http.StatusOK, gin.H{"message": "Login successful"})
}

func Logout(c *gin.Context) {
	session := sessions.Default(c)

	session.Clear()
	session.Save()

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		user := session.Get("user")

		if user == nil {
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		c.Next()
	}
}
