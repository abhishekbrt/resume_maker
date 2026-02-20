package service

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"resume_maker/backend/internal/models"
)

// ErrPhotoTooLarge indicates the decoded photo payload exceeded the limit.
var ErrPhotoTooLarge = errors.New("photo is larger than 5MB")

const maxPhotoSizeBytes = 5 * 1024 * 1024

// PDFGenerator abstracts the rendering module to keep service code testable.
type PDFGenerator interface {
	Generate(req models.GeneratePDFRequest) ([]byte, error)
}

// ValidationError returns field-level validation failures.
type ValidationError struct {
	Details []models.ValidationErrorDetail
}

func (e *ValidationError) Error() string {
	return "validation failed"
}

// PDFService handles validation and delegates rendering to the generator.
type PDFService struct {
	generator PDFGenerator
}

func NewPDFService(generator PDFGenerator) *PDFService {
	return &PDFService{generator: generator}
}

func (s *PDFService) GeneratePDF(_ context.Context, req models.GeneratePDFRequest) ([]byte, error) {
	details := validate(req)
	if len(details) > 0 {
		return nil, &ValidationError{Details: details}
	}

	if strings.TrimSpace(req.Photo) != "" {
		if err := validatePhoto(req.Photo); err != nil {
			return nil, err
		}
	}

	bytes, err := s.generator.Generate(req)
	if err != nil {
		return nil, fmt.Errorf("generate pdf via renderer: %w", err)
	}

	return bytes, nil
}

func validate(req models.GeneratePDFRequest) []models.ValidationErrorDetail {
	var details []models.ValidationErrorDetail

	if strings.TrimSpace(req.Data.PersonalInfo.FirstName) == "" {
		details = append(details, models.ValidationErrorDetail{
			Field:   "data.personalInfo.firstName",
			Message: "must not be empty",
		})
	}

	if strings.TrimSpace(req.Data.PersonalInfo.LastName) == "" {
		details = append(details, models.ValidationErrorDetail{
			Field:   "data.personalInfo.lastName",
			Message: "must not be empty",
		})
	}

	if req.Settings.ShowPhoto && strings.TrimSpace(req.Photo) == "" {
		details = append(details, models.ValidationErrorDetail{
			Field:   "photo",
			Message: "must be provided when settings.showPhoto is true",
		})
	}

	hasTechnicalSkills := strings.TrimSpace(req.Data.TechnicalSkills.Languages) != "" ||
		strings.TrimSpace(req.Data.TechnicalSkills.Frameworks) != "" ||
		strings.TrimSpace(req.Data.TechnicalSkills.DeveloperTools) != "" ||
		strings.TrimSpace(req.Data.TechnicalSkills.Libraries) != ""

	if len(req.Data.Experience) == 0 && len(req.Data.Education) == 0 && len(req.Data.Projects) == 0 && !hasTechnicalSkills {
		details = append(details, models.ValidationErrorDetail{
			Field:   "data",
			Message: "at least one content section must be filled (experience, education, projects, or technicalSkills)",
		})
	}

	for index, exp := range req.Data.Experience {
		if strings.TrimSpace(exp.Role) == "" && strings.TrimSpace(exp.Company) == "" {
			details = append(details, models.ValidationErrorDetail{
				Field:   fmt.Sprintf("data.experience[%d]", index),
				Message: "must include role or company",
			})
		}
	}

	for index, edu := range req.Data.Education {
		if strings.TrimSpace(edu.Institution) == "" {
			details = append(details, models.ValidationErrorDetail{
				Field:   fmt.Sprintf("data.education[%d].institution", index),
				Message: "must not be empty",
			})
		}
	}

	for index, project := range req.Data.Projects {
		if strings.TrimSpace(project.Name) == "" {
			details = append(details, models.ValidationErrorDetail{
				Field:   fmt.Sprintf("data.projects[%d].name", index),
				Message: "must not be empty",
			})
		}
	}

	fontFamily := strings.ToLower(strings.TrimSpace(req.Settings.FontFamily))
	switch fontFamily {
	case "times", "garamond", "calibri", "arial":
	default:
		details = append(details, models.ValidationErrorDetail{
			Field:   "settings.fontFamily",
			Message: "must be one of: times, garamond, calibri, arial",
		})
	}

	fontSize := strings.ToLower(strings.TrimSpace(req.Settings.FontSize))
	switch fontSize {
	case "small", "medium", "large":
	default:
		details = append(details, models.ValidationErrorDetail{
			Field:   "settings.fontSize",
			Message: "must be one of: small, medium, large",
		})
	}

	return details
}

func validatePhoto(photo string) error {
	value := strings.TrimSpace(photo)
	if value == "" {
		return nil
	}

	if !strings.HasPrefix(value, "data:image/jpeg;base64,") && !strings.HasPrefix(value, "data:image/png;base64,") {
		return &ValidationError{Details: []models.ValidationErrorDetail{{
			Field:   "photo",
			Message: "must be a base64 encoded JPEG or PNG data URL",
		}}}
	}

	parts := strings.SplitN(value, ",", 2)
	if len(parts) != 2 {
		return &ValidationError{Details: []models.ValidationErrorDetail{{
			Field:   "photo",
			Message: "invalid base64 photo encoding",
		}}}
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return &ValidationError{Details: []models.ValidationErrorDetail{{
			Field:   "photo",
			Message: "invalid base64 photo encoding",
		}}}
	}

	if len(decoded) > maxPhotoSizeBytes {
		return ErrPhotoTooLarge
	}

	return nil
}
