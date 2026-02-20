package pdfgen

import (
	"bytes"
	"strings"
	"testing"

	"github.com/go-pdf/fpdf"

	"resume_maker/backend/internal/models"
)

func TestWriteTwoColumnRowNearPageBottomMovesToNewPage(t *testing.T) {
	pdf := fpdf.New("P", "mm", "A4", "")
	layout := defaultLayout()
	pdf.SetMargins(layout.leftMargin, layout.topMargin, layout.rightMargin)
	pdf.SetAutoPageBreak(true, layout.bottomMargin)
	pdf.AddPage()
	pdf.SetY(274)

	writeTwoColumnRow(
		pdf,
		"Times",
		11,
		true,
		strings.Repeat("Long left content wraps to next line repeatedly ", 6),
		"Apr 2025 - Dec 2025",
		layout,
	)

	if pdf.PageNo() < 2 {
		t.Fatalf("expected row rendering to move to page 2, got page %d", pdf.PageNo())
	}

	if pdf.GetY() > 80 {
		t.Fatalf("expected cursor to continue near top of new page after row render, got y=%f", pdf.GetY())
	}
}

func TestMapFontUsesDistinctFamilies(t *testing.T) {
	families := map[string]string{
		"times":    mapFont("times"),
		"garamond": mapFont("garamond"),
		"calibri":  mapFont("calibri"),
		"arial":    mapFont("arial"),
	}

	if families["times"] == families["garamond"] {
		t.Fatalf("expected times and garamond to map to different PDF families, both mapped to %q", families["times"])
	}
	if families["calibri"] == families["arial"] {
		t.Fatalf("expected calibri and arial to map to different PDF families, both mapped to %q", families["calibri"])
	}
	if mapFont("") != fontFamilyTimes {
		t.Fatalf("expected empty font family to default to %q", fontFamilyTimes)
	}
}

func TestGeneratePDFDiffersByFontFamily(t *testing.T) {
	generator := Generator{}
	baseRequest := models.GeneratePDFRequest{
		Data: models.ResumeData{
			PersonalInfo: models.PersonalInfo{
				FirstName: "Abhishek",
				LastName:  "Bharti",
				Email:     "abhishek@example.com",
			},
			Experience: []models.ExperienceEntry{
				{
					Role:      "Software Engineer Intern",
					Company:   "Example Corp",
					StartDate: "Apr 2025",
					EndDate:   "Dec 2025",
					Bullets: []string{
						"Implemented concurrent backend services.",
					},
				},
			},
		},
		Settings: models.ResumeSetting{
			FontSize: "medium",
		},
	}

	generate := func(fontFamily string) []byte {
		req := baseRequest
		req.Settings.FontFamily = fontFamily
		pdfBytes, err := generator.Generate(req)
		if err != nil {
			t.Fatalf("generate(%s): %v", fontFamily, err)
		}
		if len(pdfBytes) == 0 {
			t.Fatalf("generate(%s): produced empty PDF", fontFamily)
		}
		return pdfBytes
	}

	timesPDF := generate("times")
	garamondPDF := generate("garamond")
	calibriPDF := generate("calibri")
	arialPDF := generate("arial")

	if bytes.Equal(timesPDF, garamondPDF) {
		t.Fatal("expected times and garamond PDFs to differ")
	}
	if bytes.Equal(calibriPDF, arialPDF) {
		t.Fatal("expected calibri and arial PDFs to differ")
	}
}

func TestGeneratePDFIncludesImageWhenPhotoEnabled(t *testing.T) {
	generator := Generator{}
	req := models.GeneratePDFRequest{
		Data: models.ResumeData{
			PersonalInfo: models.PersonalInfo{
				FirstName: "Ada",
				LastName:  "Lovelace",
				Email:     "ada@example.com",
			},
			TechnicalSkills: models.TechnicalSkills{
				Languages: "Go",
			},
		},
		Settings: models.ResumeSetting{
			ShowPhoto:  true,
			FontFamily: "times",
			FontSize:   "medium",
		},
		Photo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7YhJkAAAAASUVORK5CYII=",
	}

	pdfBytes, err := generator.Generate(req)
	if err != nil {
		t.Fatalf("generate with photo: %v", err)
	}
	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF bytes")
	}
	if !bytes.Contains(pdfBytes, []byte("/Subtype /Image")) {
		t.Fatal("expected generated PDF to contain embedded image object")
	}
}
