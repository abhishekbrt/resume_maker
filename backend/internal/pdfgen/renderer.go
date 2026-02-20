package pdfgen

import (
	"bytes"
	_ "embed"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"

	"resume_maker/backend/internal/models"
)

// Generator creates ATS-friendly PDF bytes from resume data.
type Generator struct{}

type layoutConfig struct {
	leftMargin     float64
	rightMargin    float64
	topMargin      float64
	bottomMargin   float64
	lineHeight     float64
	sectionSpacing float64
	entrySpacing   float64
	rightColWidth  float64
	skillLabelW    float64
}

type contactToken struct {
	text string
	url  string
}

const (
	fontFamilyTimes    = "resume_times"
	fontFamilyGaramond = "resume_garamond"
	fontFamilyCalibri  = "resume_calibri"
	fontFamilyArial    = "resume_arial"
)

//go:embed fonts/times-regular.ttf
var timesRegularFont []byte

//go:embed fonts/times-bold.ttf
var timesBoldFont []byte

//go:embed fonts/times-italic.ttf
var timesItalicFont []byte

//go:embed fonts/times-bolditalic.ttf
var timesBoldItalicFont []byte

//go:embed fonts/garamond-regular.ttf
var garamondRegularFont []byte

//go:embed fonts/garamond-bold.ttf
var garamondBoldFont []byte

//go:embed fonts/garamond-italic.ttf
var garamondItalicFont []byte

//go:embed fonts/garamond-bolditalic.ttf
var garamondBoldItalicFont []byte

//go:embed fonts/calibri-regular.ttf
var calibriRegularFont []byte

//go:embed fonts/calibri-bold.ttf
var calibriBoldFont []byte

//go:embed fonts/calibri-italic.ttf
var calibriItalicFont []byte

//go:embed fonts/calibri-bolditalic.ttf
var calibriBoldItalicFont []byte

//go:embed fonts/arial-regular.ttf
var arialRegularFont []byte

//go:embed fonts/arial-bold.ttf
var arialBoldFont []byte

//go:embed fonts/arial-italic.ttf
var arialItalicFont []byte

//go:embed fonts/arial-bolditalic.ttf
var arialBoldItalicFont []byte

func defaultLayout() layoutConfig {
	return layoutConfig{
		leftMargin:     20,
		rightMargin:    20,
		topMargin:      20,
		bottomMargin:   20,
		lineHeight:     5.5,
		sectionSpacing: 1.2,
		entrySpacing:   0.8,
		rightColWidth:  52,
		skillLabelW:    40,
	}
}

// Generate renders a deterministic single-template PDF for v1.
func (Generator) Generate(req models.GeneratePDFRequest) ([]byte, error) {
	layout := defaultLayout()

	pdf := fpdf.New("P", "mm", "A4", "")
	if err := registerResumeFonts(pdf); err != nil {
		return nil, fmt.Errorf("register resume fonts: %w", err)
	}
	pdf.SetCreationDate(time.Unix(0, 0))
	pdf.SetCatalogSort(true)
	pdf.SetTitle("Resume", false)
	pdf.SetMargins(layout.leftMargin, layout.topMargin, layout.rightMargin)
	pdf.SetAutoPageBreak(true, layout.bottomMargin)
	pdf.AddPage()

	fontFamily := mapFont(req.Settings.FontFamily)
	fontSize := mapFontSize(req.Settings.FontSize)

	renderHeader(pdf, req, fontFamily, fontSize, layout)

	if len(req.Data.Education) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Education", layout)
		for _, edu := range req.Data.Education {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, edu.Institution, edu.Location, layout)
			writeTwoColumnRow(pdf, fontFamily, fontSize, false, edu.Degree, formatDateRange(edu.StartDate, edu.EndDate), layout)
			for _, bullet := range edu.Bullets {
				writeBullet(pdf, fontFamily, fontSize, bullet, layout)
			}
			pdf.Ln(layout.entrySpacing)
		}
	}

	if len(req.Data.Experience) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Experience", layout)
		for _, exp := range req.Data.Experience {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, exp.Role, formatDateRange(exp.StartDate, exp.EndDate), layout)
			writeTwoColumnRow(pdf, fontFamily, fontSize, false, exp.Company, exp.Location, layout)
			for _, bullet := range exp.Bullets {
				writeBullet(pdf, fontFamily, fontSize, bullet, layout)
			}
			pdf.Ln(layout.entrySpacing)
		}
	}

	if len(req.Data.Projects) > 0 {
		addSectionTitle(pdf, fontFamily, fontSize, "Projects", layout)
		for _, project := range req.Data.Projects {
			writeTwoColumnRow(pdf, fontFamily, fontSize, true, project.Name, formatDateRange(project.StartDate, project.EndDate), layout)
			if strings.TrimSpace(project.TechStack) != "" {
				writeWrappedText(pdf, fontFamily, "I", fontSize, strings.TrimSpace(project.TechStack), layout)
			}
			for _, bullet := range project.Bullets {
				writeBullet(pdf, fontFamily, fontSize, bullet, layout)
			}
			pdf.Ln(layout.entrySpacing)
		}
	}

	if hasTechnicalSkills(req.Data.TechnicalSkills) {
		addSectionTitle(pdf, fontFamily, fontSize, "Technical Skills", layout)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Languages", req.Data.TechnicalSkills.Languages, layout)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Frameworks", req.Data.TechnicalSkills.Frameworks, layout)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Developer Tools", req.Data.TechnicalSkills.DeveloperTools, layout)
		renderTechnicalSkillLine(pdf, fontFamily, fontSize, "Libraries", req.Data.TechnicalSkills.Libraries, layout)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("render pdf: %w", err)
	}

	return buf.Bytes(), nil
}

func renderHeader(pdf *fpdf.Fpdf, req models.GeneratePDFRequest, fontFamily string, fontSize float64, layout layoutConfig) {
	ensureSpace(pdf, 14, layout)

	pdf.SetFont(fontFamily, "B", fontSize+5)
	fullName := strings.TrimSpace(req.Data.PersonalInfo.FirstName + " " + req.Data.PersonalInfo.LastName)
	pdf.CellFormat(0, 8, fullName, "", 1, "C", false, 0, "")

	contactTokens := buildHeaderContactTokens(req.Data.PersonalInfo)
	if len(contactTokens) > 0 {
		renderCenteredContactTokens(pdf, fontFamily, fontSize, contactTokens, layout)
	}
	pdf.Ln(2)
}

func addSectionTitle(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, title string, layout layoutConfig) {
	ensureSpace(pdf, layout.lineHeight*2, layout)
	pdf.SetFont(fontFamily, "B", fontSize+1)
	pdf.MultiCell(0, layout.lineHeight, strings.ToUpper(title), "", "L", false)

	y := pdf.GetY()
	pageWidth, _ := pdf.GetPageSize()
	pdf.Line(layout.leftMargin, y, pageWidth-layout.rightMargin, y)
	pdf.Ln(layout.sectionSpacing)
}

func writeTwoColumnRow(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, bold bool, left string, right string, layout layoutConfig) {
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

	pageWidth, _ := pdf.GetPageSize()
	contentWidth := pageWidth - layout.leftMargin - layout.rightMargin
	leftWidth := contentWidth - layout.rightColWidth
	if leftWidth < 60 {
		leftWidth = contentWidth * 0.7
	}

	leftLines := splitOrDefault(pdf, left, leftWidth)
	rightLines := splitOrDefault(pdf, right, layout.rightColWidth)
	lineCount := max(len(leftLines), len(rightLines))
	rowHeight := float64(lineCount) * layout.lineHeight

	ensureSpace(pdf, rowHeight, layout)
	pdf.SetX(layout.leftMargin)

	for i := 0; i < lineCount; i++ {
		leftText := ""
		if i < len(leftLines) {
			leftText = leftLines[i]
		}
		rightText := ""
		if i < len(rightLines) {
			rightText = rightLines[i]
		}

		pdf.CellFormat(leftWidth, layout.lineHeight, leftText, "", 0, "L", false, 0, "")
		pdf.CellFormat(layout.rightColWidth, layout.lineHeight, rightText, "", 0, "R", false, 0, "")
		pdf.Ln(-1)
		pdf.SetX(layout.leftMargin)
	}
}

func writeBullet(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, bullet string, layout layoutConfig) {
	trimmed := strings.TrimSpace(bullet)
	if trimmed == "" {
		return
	}
	writeWrappedText(pdf, fontFamily, "", fontSize, "- "+trimmed, layout)
}

func writeWrappedText(pdf *fpdf.Fpdf, fontFamily string, style string, fontSize float64, value string, layout layoutConfig) {
	writeWrappedTextAligned(pdf, fontFamily, style, fontSize, value, "L", layout)
}

func writeWrappedTextAligned(pdf *fpdf.Fpdf, fontFamily string, style string, fontSize float64, value string, align string, layout layoutConfig) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return
	}

	pdf.SetFont(fontFamily, style, fontSize)
	pageWidth, _ := pdf.GetPageSize()
	contentWidth := pageWidth - layout.leftMargin - layout.rightMargin
	lines := splitOrDefault(pdf, trimmed, contentWidth)

	for _, line := range lines {
		ensureSpace(pdf, layout.lineHeight, layout)
		pdf.CellFormat(0, layout.lineHeight, line, "", 1, align, false, 0, "")
	}
}

func renderTechnicalSkillLine(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, label string, value string, layout layoutConfig) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return
	}

	pageWidth, _ := pdf.GetPageSize()
	contentWidth := pageWidth - layout.leftMargin - layout.rightMargin
	valueWidth := contentWidth - layout.skillLabelW
	if valueWidth < 40 {
		valueWidth = contentWidth * 0.6
	}

	pdf.SetFont(fontFamily, "B", fontSize)
	labelLines := splitOrDefault(pdf, label+":", layout.skillLabelW)
	pdf.SetFont(fontFamily, "", fontSize)
	valueLines := splitOrDefault(pdf, trimmed, valueWidth)

	lineCount := max(len(labelLines), len(valueLines))
	rowHeight := float64(lineCount) * layout.lineHeight
	ensureSpace(pdf, rowHeight, layout)
	pdf.SetX(layout.leftMargin)

	for i := 0; i < lineCount; i++ {
		labelText := ""
		if i < len(labelLines) {
			labelText = labelLines[i]
		}
		valueText := ""
		if i < len(valueLines) {
			valueText = valueLines[i]
		}

		pdf.SetFont(fontFamily, "B", fontSize)
		pdf.CellFormat(layout.skillLabelW, layout.lineHeight, labelText, "", 0, "L", false, 0, "")
		pdf.SetFont(fontFamily, "", fontSize)
		pdf.CellFormat(valueWidth, layout.lineHeight, valueText, "", 0, "L", false, 0, "")
		pdf.Ln(-1)
		pdf.SetX(layout.leftMargin)
	}
}

func ensureSpace(pdf *fpdf.Fpdf, neededHeight float64, layout layoutConfig) {
	_, pageHeight := pdf.GetPageSize()
	if pdf.GetY()+neededHeight > pageHeight-layout.bottomMargin {
		pdf.AddPage()
	}
}

func splitOrDefault(pdf *fpdf.Fpdf, value string, width float64) []string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return []string{""}
	}
	if width <= 0 {
		return []string{trimmed}
	}
	lines := pdf.SplitText(trimmed, width)
	if len(lines) == 0 {
		return []string{trimmed}
	}
	return lines
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
	case "arial":
		return fontFamilyArial
	case "calibri":
		return fontFamilyCalibri
	case "garamond":
		return fontFamilyGaramond
	case "times", "":
		return fontFamilyTimes
	default:
		return fontFamilyTimes
	}
}

type fontVariant struct {
	family string
	style  string
	data   []byte
}

func registerResumeFonts(pdf *fpdf.Fpdf) error {
	fontVariants := []fontVariant{
		{family: fontFamilyTimes, style: "", data: timesRegularFont},
		{family: fontFamilyTimes, style: "B", data: timesBoldFont},
		{family: fontFamilyTimes, style: "I", data: timesItalicFont},
		{family: fontFamilyTimes, style: "BI", data: timesBoldItalicFont},
		{family: fontFamilyGaramond, style: "", data: garamondRegularFont},
		{family: fontFamilyGaramond, style: "B", data: garamondBoldFont},
		{family: fontFamilyGaramond, style: "I", data: garamondItalicFont},
		{family: fontFamilyGaramond, style: "BI", data: garamondBoldItalicFont},
		{family: fontFamilyCalibri, style: "", data: calibriRegularFont},
		{family: fontFamilyCalibri, style: "B", data: calibriBoldFont},
		{family: fontFamilyCalibri, style: "I", data: calibriItalicFont},
		{family: fontFamilyCalibri, style: "BI", data: calibriBoldItalicFont},
		{family: fontFamilyArial, style: "", data: arialRegularFont},
		{family: fontFamilyArial, style: "B", data: arialBoldFont},
		{family: fontFamilyArial, style: "I", data: arialItalicFont},
		{family: fontFamilyArial, style: "BI", data: arialBoldItalicFont},
	}

	for _, variant := range fontVariants {
		if len(variant.data) == 0 {
			return fmt.Errorf("missing embedded font bytes for %s (%s)", variant.family, variant.style)
		}
		pdf.AddUTF8FontFromBytes(variant.family, variant.style, variant.data)
		if pdf.Err() {
			return fmt.Errorf("add font %s (%s): %w", variant.family, variant.style, pdf.Error())
		}
	}

	return nil
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

func max(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func buildHeaderContactTokens(info models.PersonalInfo) []contactToken {
	tokens := make([]contactToken, 0, 8)

	appendToken := func(text string, url string) {
		trimmedText := strings.TrimSpace(text)
		if trimmedText == "" {
			return
		}
		tokens = append(tokens, contactToken{text: trimmedText, url: normalizeLinkURL(url)})
	}

	appendToken(info.Phone, "")
	appendToken(info.Email, "mailto:"+strings.TrimSpace(info.Email))
	appendToken(info.LinkedIn, info.LinkedIn)
	appendToken(info.GitHub, info.GitHub)
	appendToken(info.Website, info.Website)

	for _, link := range info.OtherLinks {
		display := strings.TrimSpace(link.Label)
		if display == "" {
			display = strings.TrimSpace(link.URL)
		}
		appendToken(display, link.URL)
	}

	return tokens
}

func renderCenteredContactTokens(pdf *fpdf.Fpdf, fontFamily string, fontSize float64, tokens []contactToken, layout layoutConfig) {
	pdf.SetFont(fontFamily, "", fontSize)
	pageWidth, _ := pdf.GetPageSize()
	contentWidth := pageWidth - layout.leftMargin - layout.rightMargin

	lines := make([][]contactToken, 0, 2)
	currentLine := make([]contactToken, 0, len(tokens)*2)
	currentWidth := 0.0

	for i, token := range tokens {
		segmentWidth := pdf.GetStringWidth(token.text)
		separatorWidth := 0.0
		if i > 0 {
			separatorWidth = pdf.GetStringWidth(" | ")
		}

		if len(currentLine) > 0 && currentWidth+separatorWidth+segmentWidth > contentWidth {
			lines = append(lines, currentLine)
			currentLine = make([]contactToken, 0, len(tokens)*2)
			currentWidth = 0
			separatorWidth = 0
		}

		if separatorWidth > 0 {
			currentLine = append(currentLine, contactToken{text: " | "})
			currentWidth += separatorWidth
		}

		currentLine = append(currentLine, token)
		currentWidth += segmentWidth
	}

	if len(currentLine) > 0 {
		lines = append(lines, currentLine)
	}

	for _, line := range lines {
		lineWidth := 0.0
		for _, token := range line {
			lineWidth += pdf.GetStringWidth(token.text)
		}

		ensureSpace(pdf, layout.lineHeight, layout)
		startX := layout.leftMargin + (contentWidth-lineWidth)/2
		if startX < layout.leftMargin {
			startX = layout.leftMargin
		}
		pdf.SetX(startX)

		for _, token := range line {
			width := pdf.GetStringWidth(token.text)
			if token.url != "" {
				pdf.SetTextColor(47, 95, 121)
				pdf.CellFormat(width, layout.lineHeight, token.text, "", 0, "L", false, 0, token.url)
				pdf.SetTextColor(0, 0, 0)
			} else {
				pdf.CellFormat(width, layout.lineHeight, token.text, "", 0, "L", false, 0, "")
			}
		}
		pdf.Ln(-1)
	}
}

func normalizeLinkURL(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(trimmed, "http://") || strings.HasPrefix(trimmed, "https://") || strings.HasPrefix(trimmed, "mailto:") || strings.HasPrefix(trimmed, "tel:") {
		return trimmed
	}
	if strings.Contains(trimmed, "@") && !strings.Contains(trimmed, "/") {
		return "mailto:" + trimmed
	}
	return "https://" + trimmed
}
