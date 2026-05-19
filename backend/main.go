package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
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
	secureCookie := secureCookieEnabled()
	sameSite := http.SameSiteLaxMode
	if secureCookie {
		sameSite = http.SameSiteNoneMode
	}

	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   86400,
		HttpOnly: true,
		Secure:   secureCookie,
		SameSite: sameSite,
	})
	router.Use(sessions.Sessions("roster-session", store))

	//Allow cors
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins(),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
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

func secureCookieEnabled() bool {
	value := strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SECURE")))
	if value != "" {
		return value == "true"
	}

	return gin.Mode() == gin.ReleaseMode || os.Getenv("RENDER") != "" || os.Getenv("RENDER_EXTERNAL_URL") != ""
}

func allowedOrigins() []string {
	origins := []string{
		"http://127.0.0.1:5501",
		"http://127.0.0.1:5500",
		"http://localhost:5500",
		"http://localhost:8080",
		"https://fullstack-roster-project.vercel.app",
	}

	for _, origin := range strings.Split(os.Getenv("FRONTEND_URLS"), ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if origin := strings.TrimSpace(os.Getenv("FRONTEND_URL")); origin != "" {
		origins = append(origins, origin)
	}

	return origins
}
