package pdfgen

import (
	"strings"
	"testing"

	"github.com/go-pdf/fpdf"
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
