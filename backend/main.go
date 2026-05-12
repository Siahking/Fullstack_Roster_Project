package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"final-project/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	_ "github.com/lib/pq"
)

func main() {
	// Set up database connection
	db, dsn, err := models.InitializeDB()
	if err != nil {
		log.Fatal("Error connecting to database: ", err)
	}
	defer db.Close()

	//Run migrations automatically on startup
	models.RunMigrations(dsn)

	//Get the router ready
	router := gin.Default()

	//Initialize sessions
	store := cookie.NewStore([]byte("super-secret-key"))
	router.Use(sessions.Sessions("roster-session", store))

	//Allow cors
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5501", "http://127.0.0.1:5500", "http://localhost:5500","https://fullstack-roster-project.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	//get routes
	models.RegisterRoutes(router, db)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting Gin server on :%s\n", port)

	log.Fatal(router.Run(":" + port))
}
