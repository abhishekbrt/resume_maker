package pdfgen

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"

	"resume_maker/backend/internal/models"
)

// Generator creates ATS-friendly PDF bytes from resume data.
type Generator struct{}

// Generate renders a deterministic single-template PDF for v1.
func (Generator) Generate(req models.GeneratePDFRequest) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetCreationDate(time.Unix(0, 0))
	pdf.SetCatalogSort(true)
	pdf.SetTitle("Resume", false)
	pdf.SetMargins(16, 16, 16)
	pdf.AddPage()

	fontFamily := mapFont(req.Settings.FontFamily)
	fontSize := mapFontSize(req.Settings.FontSize)

	renderHeader(pdf, req, fontFamily, fontSize)

	if len(req.Data.Education) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Education")
		for _, edu := range req.Data.Education {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, edu.Institution, edu.Location)
			writeTwoColumnRow(pdf, fontFamily, fontSize, false, edu.Degree, formatDateRange(edu.StartDate, edu.EndDate))
			for _, bullet := range edu.Bullets {
				trimmed := strings.TrimSpace(bullet)
				if trimmed == "" {
					continue
				}
				pdf.SetFont(fontFamily, "", fontSize)
				pdf.MultiCell(0, 5.5, "- "+trimmed, "", "L", false)
			}
			pdf.Ln(0.8)
		}
	}

	if len(req.Data.Experience) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Experience")
		for _, exp := range req.Data.Experience {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, exp.Role, formatDateRange(exp.StartDate, exp.EndDate))
			writeTwoColumnRow(pdf, fontFamily, fontSize, false, exp.Company, exp.Location)
			for _, bullet := range exp.Bullets {
				trimmed := strings.TrimSpace(bullet)
				if trimmed == "" {
					continue
				}
				pdf.SetFont(fontFamily, "", fontSize)
				pdf.MultiCell(0, 5.5, "- "+trimmed, "", "L", false)
			}
			pdf.Ln(0.8)
		}
	}

	if len(req.Data.Projects) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Projects")
		for _, project := range req.Data.Projects {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, project.Name, formatDateRange(project.StartDate, project.EndDate))
			if strings.TrimSpace(project.TechStack) != "" {
				pdf.SetFont(fontFamily, "I", fontSize)
				pdf.MultiCell(0, 5.5, strings.TrimSpace(project.TechStack), "", "L", false)
			}
			for _, bullet := range project.Bullets {
				trimmed := strings.TrimSpace(bullet)
				if trimmed == "" {
					continue
				}
				pdf.SetFont(fontFamily, "", fontSize)
				pdf.MultiCell(0, 5.5, "- "+trimmed, "", "L", false)
			}
			pdf.Ln(0.8)
		}
	}

	if hasTechnicalSkills(req.Data.TechnicalSkills) {
		addSectionTitle(pdf, fontFamily, fontSize, "Technical Skills")
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Languages", req.Data.TechnicalSkills.Languages)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Frameworks", req.Data.TechnicalSkills.Frameworks)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Developer Tools", req.Data.TechnicalSkills.DeveloperTools)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Libraries", req.Data.TechnicalSkills.Libraries)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("render pdf: %w", err)
	}

	return buf.Bytes(), nil
}

func renderHeader(pdf *fpdf.Fpdf, req models.GeneratePDFRequest, fontFamily string, fontSize float64) {
	pdf.SetFont(fontFamily, "B", fontSize+5)
	fullName := strings.TrimSpace(req.Data.PersonalInfo.FirstName + " " + req.Data.PersonalInfo.LastName)
	pdf.CellFormat(0, 8, fullName, "", 1, "C", false, 0, "")

	pdf.SetFont(fontFamily, "", fontSize)
	contact := strings.Join(nonEmpty(
		req.Data.PersonalInfo.Phone,
		req.Data.PersonalInfo.Email,
		req.Data.PersonalInfo.LinkedIn,
		req.Data.PersonalInfo.GitHub,
	), " | ")
	if contact != "" {
		pdf.MultiCell(0, 5.5, contact, "", "C", false)
	}
	pdf.Ln(2)
}

func addSectionTitle(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, title string) {
	pdf.SetFont(fontFamily, "B", fontSize+1)
	pdf.MultiCell(0, 5.5, strings.ToUpper(title), "", "L", false)
	y := pdf.GetY()
	pdf.Line(16, y, 194, y)
	pdf.Ln(0.8)
}

func writeTwoColumnRow(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, bold bool, left string, right string) {
	left = strings.TrimSpace(left)
	right = strings.TrimSpace(right)
	if left == "" && right == "" {
		return
	}

	style := ""
	if bold {
		style = "B"
	}
	pdf.SetFont(fontFamily, style, fontSize)

	x := pdf.GetX()
	y := pdf.GetY()
	leftWidth := 130.0
	rightWidth := 48.0
	lineHeight := 5.5

	pdf.MultiCell(leftWidth, lineHeight, left, "", "L", false)
	heightUsed := pdf.GetY() - y
	if heightUsed < lineHeight {
		heightUsed = lineHeight
	}

	pdf.SetXY(x+leftWidth, y)
	pdf.CellFormat(rightWidth, lineHeight, right, "", 0, "R", false, 0, "")
	pdf.SetXY(x, y+heightUsed)
}

func renderTechnicalSkillLine(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, label string, value string) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return
	}
	pdf.SetFont(fontFamily, "B", fontSize)
	pdf.CellFormat(38, 5.5, label+":", "", 0, "L", false, 0, "")
	pdf.SetFont(fontFamily, "", fontSize)
	pdf.MultiCell(0, 5.5, trimmed, "", "L", false)
}

func hasTechnicalSkills(skills models.TechnicalSkills) bool {
	return strings.TrimSpace(skills.Languages) != "" ||
		strings.TrimSpace(skills.Frameworks) != "" ||
		strings.TrimSpace(skills.DeveloperTools) != "" ||
		strings.TrimSpace(skills.Libraries) != ""
}

func formatDateRange(startDate string, endDate string) string {
	start := strings.TrimSpace(startDate)
	end := strings.TrimSpace(endDate)
	switch {
	case start == "" && end == "":
		return ""
	case start == "":
		return end
	case end == "":
		return start
	default:
		return start + " - " + end
	}
}

func mapFont(fontFamily string) string {
	switch strings.ToLower(strings.TrimSpace(fontFamily)) {
	case "arial", "calibri":
		return "Arial"
	case "garamond", "times", "":
		return "Times"
	default:
		return "Times"
	}
}

func mapFontSize(size string) float64 {
	switch strings.ToLower(strings.TrimSpace(size)) {
	case "small":
		return 10
	case "large":
		return 12
	case "medium", "":
		return 11
	default:
		return 11
	}
}

func nonEmpty(parts ...string) []string {
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
