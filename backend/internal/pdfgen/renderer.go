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

	pdf.SetFont(fontFamily, "B", fontSize+5)
	fullName := strings.TrimSpace(req.Data.PersonalInfo.FirstName + " " + req.Data.PersonalInfo.LastName)
	pdf.CellFormat(0, 8, fullName, "", 1, "L", false, 0, "")

	pdf.SetFont(fontFamily, "", fontSize)
	contact := strings.Join(nonEmpty(
		req.Data.PersonalInfo.Location,
		req.Data.PersonalInfo.Phone,
		req.Data.PersonalInfo.Email,
		req.Data.PersonalInfo.LinkedIn,
		req.Data.PersonalInfo.Website,
	), " | ")
	if contact != "" {
		pdf.MultiCell(0, 6, contact, "", "L", false)
	}
	pdf.Ln(2)

	if strings.TrimSpace(req.Data.Summary) != "" {
		addSectionTitle(pdf, fontFamily, fontSize, "Summary")
		pdf.SetFont(fontFamily, "", fontSize)
		pdf.MultiCell(0, 6, strings.TrimSpace(req.Data.Summary), "", "L", false)
		pdf.Ln(1)
	}

	if len(req.Data.Experience) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Experience")
		for _, exp := range req.Data.Experience {
			pdf.SetFont(fontFamily, "B", fontSize)
			heading := strings.TrimSpace(exp.Role)
			if strings.TrimSpace(exp.Company) != "" {
				heading = strings.TrimSpace(exp.Role + " - " + exp.Company)
			}
			pdf.MultiCell(0, 6, heading, "", "L", false)
			pdf.SetFont(fontFamily, "", fontSize)
			dateLine := strings.TrimSpace(exp.StartDate)
			if strings.TrimSpace(exp.EndDate) != "" {
				if dateLine != "" {
					dateLine += " - "
				}
				dateLine += strings.TrimSpace(exp.EndDate)
			}
			if dateLine != "" || strings.TrimSpace(exp.Location) != "" {
				pdf.MultiCell(0, 6, strings.TrimSpace(strings.Join(nonEmpty(exp.Location, dateLine), " | ")), "", "L", false)
			}
			for _, bullet := range exp.Bullets {
				trimmed := strings.TrimSpace(bullet)
				if trimmed == "" {
					continue
				}
				pdf.MultiCell(0, 6, "- "+trimmed, "", "L", false)
			}
			pdf.Ln(1)
		}
	}

	if len(req.Data.Education) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Education")
		for _, edu := range req.Data.Education {
			pdf.SetFont(fontFamily, "B", fontSize)
			heading := strings.TrimSpace(edu.Degree)
			if strings.TrimSpace(edu.Institution) != "" {
				heading = strings.TrimSpace(edu.Degree + " - " + edu.Institution)
			}
			pdf.MultiCell(0, 6, heading, "", "L", false)
			pdf.SetFont(fontFamily, "", fontSize)
			line := strings.Join(nonEmpty(edu.Location, edu.GraduationDate), " | ")
			if line != "" {
				pdf.MultiCell(0, 6, line, "", "L", false)
			}
			for _, bullet := range edu.Bullets {
				trimmed := strings.TrimSpace(bullet)
				if trimmed == "" {
					continue
				}
				pdf.MultiCell(0, 6, "- "+trimmed, "", "L", false)
			}
			pdf.Ln(1)
		}
	}

	if len(req.Data.Skills) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Skills")
		pdf.SetFont(fontFamily, "", fontSize)
		pdf.MultiCell(0, 6, strings.Join(req.Data.Skills, ", "), "", "L", false)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("render pdf: %w", err)
	}

	return buf.Bytes(), nil
}

func addSectionTitle(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, title string) {
	pdf.SetFont(fontFamily, "B", fontSize+1)
	pdf.MultiCell(0, 6, title, "", "L", false)
	pdf.Line(16, pdf.GetY(), 194, pdf.GetY())
	pdf.Ln(1)
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
