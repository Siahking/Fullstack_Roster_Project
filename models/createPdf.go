package models

import (
	"bytes"
	"net/http"
	"os"
	"strings"

	wkhtmltopdf "github.com/SebastiaanKlippert/go-wkhtmltopdf"
	"github.com/gin-gonic/gin"
)

type pdfRequest struct {
	HTML     string `json:"html"`
	Filename string `json:"filename"`
}

func configureWkhtmltopdfPath() {
	const defaultWindowsPath = `C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe`

	if wkhtmltopdf.GetPath() != "" {
		return
	}

	if _, err := os.Stat(defaultWindowsPath); err == nil {
		wkhtmltopdf.SetPath(defaultWindowsPath)
	}
}

func GeneratePDF(c *gin.Context) {
	var request pdfRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid PDF request"})
		return
	}

	if strings.TrimSpace(request.HTML) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PDF HTML is required"})
		return
	}

	configureWkhtmltopdfPath()

	pdfg, err := wkhtmltopdf.NewPDFGenerator()
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "wkhtmltopdf not found") {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "wkhtmltopdf is not installed or WKHTMLTOPDF_PATH is not configured"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not start PDF generator: " + err.Error()})
		return
	}

	page := wkhtmltopdf.NewPageReader(bytes.NewReader([]byte(request.HTML)))
	pdfg.AddPage(page)

	pdfg.PageSize.Set(wkhtmltopdf.PageSizeLetter)
	pdfg.Orientation.Set(wkhtmltopdf.OrientationLandscape)
	pdfg.MarginTop.Set(4)
	pdfg.MarginBottom.Set(4)
	pdfg.MarginLeft.Set(4)
	pdfg.MarginRight.Set(4)

	err = pdfg.Create()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create PDF: " + err.Error()})
		return
	}

	filename := strings.TrimSpace(request.Filename)
	if filename == "" {
		filename = "roster.pdf"
	}
	if !strings.HasSuffix(strings.ToLower(filename), ".pdf") {
		filename += ".pdf"
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, "application/pdf", pdfg.Bytes())
}
