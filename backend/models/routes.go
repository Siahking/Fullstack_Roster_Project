package models

import (
	"database/sql"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine, db *sql.DB) {
	frontendDir := findFrontendDir()

	//Serve static files
	router.Static("/css", filepath.Join(frontendDir, "css"))
	router.Static("/views", filepath.Join(frontendDir, "views"))

	router.LoadHTMLGlob(filepath.Join(frontendDir, "html", "*.html"))

	// HTML Routes
	htmlRoutes(router)

	// API Routes
	apiRouter(router, db)
}

func findFrontendDir() string {
	candidates := []string{
		"frontend",
		filepath.Join("..", "frontend"),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(candidate, "html")); err == nil {
			return candidate
		}
	}

	return "frontend"
}

func htmlRoutes(router *gin.Engine) {
	protected := router.Group("/")
	protected.Use(AuthRequired())

	// routes for html pages
	protected.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})
	protected.GET("/home", func(c *gin.Context) { //homepage
		c.HTML(http.StatusOK, "home.html", nil)
	})
	protected.GET("/find-locations", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-locations.html", nil)
	})
	protected.GET("/get-workers", func(c *gin.Context) {
		c.HTML(http.StatusOK, "workers.html", nil)
	})
	protected.GET("/find-workers", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-workers.html", nil)
	})
	protected.GET("/get-locations", func(c *gin.Context) {
		c.HTML(http.StatusOK, "locations.html", nil)
	})
	protected.GET("/constraints", func(c *gin.Context) {
		c.HTML(http.StatusOK, "constraints.html", nil)
	})
	protected.GET("/find-contraints", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-constraints.html", nil)
	})
	router.GET("/days-off", func(c *gin.Context) {
		c.HTML(http.StatusOK, "days-off.html", nil)
	})
	router.GET("/find-days-off", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-days-off.html", nil)
	})
	router.GET("/find-restrictions", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-restrictions.html", nil)
	})
	router.GET("/create-roster", func(c *gin.Context) {
		c.HTML(http.StatusOK, "create-roster.html", nil)
	})
	router.GET("find-rosters", func(c *gin.Context) {
		c.HTML(http.StatusOK, "find-rosters.html", nil)
	})
	router.GET("/login", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", nil)
	})
	router.GET("/account-info", func(c *gin.Context) {
		c.HTML(http.StatusOK, "account-info.html", nil)
	})
}

func apiRouter(router *gin.Engine, db *sql.DB) {
	protected := router.Group("/")
	protected.Use(AuthRequired())

	//delete route
	protected.DELETE("delete/:table/:id", func(c *gin.Context) {
		DeleteEntry(c, db)
	})

	//LOCATIONS ROUTES
	//get all locations
	protected.GET("/locations", func(c *gin.Context) { //
		GetLocations(c, db)
	})
	//get location by name or id
	protected.GET("/locations/:column/:value", func(c *gin.Context) {
		FindLocation(c, db)
	})
	//create a new location
	protected.POST("/locations/:location", func(c *gin.Context) {
		AddLocation(c, db)
	})
	//edit location
	protected.PATCH("/edit-location/:location", func(c *gin.Context) {
		EditLocation(c, db)
	})

	//WORKER ROUTES
	//get all workers
	protected.GET("/workers", func(c *gin.Context) {
		GetWorkers(c, db)
	})
	//find a worker by names,id number or id
	protected.GET("/find-worker", func(c *gin.Context) {
		FindWorker(c, db)
	})
	//create a worker
	protected.POST("/workers/add-worker", func(c *gin.Context) {
		AddWorker(c, db)
	})
	//edit worker
	protected.PATCH("/edit-worker/:id", func(c *gin.Context) {
		EditWorker(c, db)
	})

	//WORKER_LOCATION ROUTES
	//assign a worker to a route
	protected.POST("/assign-location/:worker_id/:location_id", func(c *gin.Context) {
		AssignWorkerToLocation(c, db)
	})
	//get the association between a worker and a location
	protected.GET("/get-worker-location-connections/:column/:id", func(c *gin.Context) {
		GetWorkerLocationConnections(c, db)
	})
	//remove a worker from a location
	protected.DELETE("/remove-connection", func(c *gin.Context) {
		RemoveConnection(c, db)
	})
	//edit worker or location in connection
	protected.PATCH("edit-connection/:id", func(c *gin.Context) {
		EditConnection(c, db)
	})

	//CONTRAINTS ROUTES
	//create a constraint
	protected.POST("/create-constraint", func(c *gin.Context) {
		CreateConstrant(c, db)
	})
	//find a constraint
	protected.GET("/find-constraints", func(c *gin.Context) {
		FindConstraint(c, db)
	})
	//modify a constraint
	protected.PATCH("/edit-constraints/:id", func(c *gin.Context) {
		EditConstraints(c, db)
	})
	//delete a constraint
	protected.DELETE("/delete-constraint/:id", func(c *gin.Context) {
		DeleteConstraint(c, db)
	})

	//DAYS OFF ROUTES
	//create days off
	protected.POST("/add-days-off", func(c *gin.Context) {
		AddDaysOff(c, db)
	})
	//get days off by column or value
	protected.GET("/get-days-off/:column/:value", func(c *gin.Context) {
		GetDaysOff(c, db)
	})
	//get all days off
	protected.GET("/get-days-off", func(c *gin.Context) {
		GetDaysOff(c, db)
	})
	//delete days off by id
	protected.DELETE("remove-days/:id", func(c *gin.Context) {
		RemoveDaysOff(c, db)
	})
	//edit days off
	protected.PATCH("edit-dayoff/:id", func(c *gin.Context) {
		EditDayOff(c, db)
	})

	//restriction routes
	//create a new restriction
	protected.POST("/create-restriction", func(c *gin.Context) {
		CreatePermanentRestriction(c, db)
	})
	//get all restrictions
	protected.GET("/get-restrictions", func(c *gin.Context) {
		GetRestrictions(c, db)
	})
	//find restrictions using data
	protected.GET("/find-restriction/:column/:id", func(c *gin.Context) {
		FindRestriction(c, db)
	})
	//delete restriction
	protected.DELETE("/delete-restriction/:id", func(c *gin.Context) {
		DeleteRestriction(c, db)
	})
	//edit restirction
	protected.PATCH("edit-restriction/:id", func(c *gin.Context) {
		EditRestriction(c, db)
	})

	//occupancy routes
	//create a new occupancy
	protected.POST("/create-occupancy", func(c *gin.Context) {
		CreateNewOccupancy(c, db)
	})
	//retrieve all occupancies
	protected.GET("/retrieve-occupancies", func(c *gin.Context) {
		RetrieveOccupancies(c, db)
	})
	//delete occuoancies
	protected.DELETE("/delete-occupancy/:id", func(c *gin.Context) {
		RemoveOccupancy(c, db)
	})
	//delete all occupancies
	protected.DELETE("/clear-occupancies", func(c *gin.Context) {
		EmptyOccupancies(c, db)
	})

	//find worker data for locations of find locations data for workers
	protected.GET("/retrieve-workers-locations/:column/:id", func(c *gin.Context) {
		RetrieveWorkersOrLocation(c, db)
	})

	//roster endpoints
	//save a roster
	protected.POST("/save-roster", func(c *gin.Context) {
		SaveRoster(c, db)
	})
	//retrieve rosters
	protected.GET("/retrieve-rosters", func(c *gin.Context) {
		RetrieveRosters(c, db)
	})
	//edit roster
	protected.PATCH("/edit-roster/:id", func(c *gin.Context) {
		EditRoster(c, db)
	})
	//delete roster
	protected.DELETE("/delete-roster", func(c *gin.Context) {
		DeleteRoster(c, db)
	})
	//create roster PDF
	protected.POST("/create-pdf", func(c *gin.Context) {
		GeneratePDF(c)
	})

	//roster entries routes
	//create entry
	protected.POST("/roster-entry", func(c *gin.Context) {
		RosterEntryHandler(c, db)
	})
	//retrieve roster entries
	protected.GET("/retrieve-entry", func(c *gin.Context) {
		RetrieveRosterEntries(c, db)
	})
	//edit roster entries
	protected.PATCH("/edit-entry/:id", func(c *gin.Context) {
		EditRosterEntry(c, db)
	})
	//delete roster entry
	protected.DELETE("/delete-entry", func(c *gin.Context) {
		DeleteRosterEntry(c, db)
	})

	//account routes
	//create account
	router.POST("/create-account", func(c *gin.Context) {
		CreateAccount(c, db)
	})
	//edit accounts
	protected.PATCH("/edit-account/:id", func(c *gin.Context) {
		EditAccount(c, db)
	})
	//delete account
	protected.DELETE("/delete-account", func(c *gin.Context) {
		DeleteAccount(c, db)
	})
	//find account
	protected.GET("/retrieve-account/:username", func(c *gin.Context) {
		FindAccount(c, db)
	})
	//login
	router.POST("/login", func(c *gin.Context) {
		Login(c, db)
	})
	//logout
	protected.POST("/logout", func(c *gin.Context) {
		Logout(c)
	})
}
