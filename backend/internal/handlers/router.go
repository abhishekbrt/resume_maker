package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"resume_maker/backend/internal/models"
	"resume_maker/backend/internal/pdfgen"
	"resume_maker/backend/internal/service"
)

type errorResponse struct {
	Error apiError `json:"error"`
}

type apiError struct {
	Code    string                         `json:"code"`
	Message string                         `json:"message"`
	Details []models.ValidationErrorDetail `json:"details,omitempty"`
}

// NewRouter returns the API router used by the server.
func NewRouter(version string) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(requestLogger)

	pdfService := service.NewPDFService(pdfgen.Generator{})

	r.Route("/api/v1", func(api chi.Router) {
		api.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
			writeJSON(w, http.StatusOK, map[string]string{
				"status":  "ok",
				"version": version,
			})
		})

		api.Get("/templates", func(w http.ResponseWriter, _ *http.Request) {
			writeJSON(w, http.StatusOK, map[string]any{
				"templates": []map[string]any{
					{
						"id":          "classic",
						"name":        "Classic",
						"description": "Clean single-column layout with serif typography. ATS-friendly.",
						"isDefault":   true,
					},
				},
			})
		})

		api.Post("/resumes/generate-pdf", func(w http.ResponseWriter, r *http.Request) {
			if !strings.Contains(strings.ToLower(r.Header.Get("Content-Type")), "application/json") {
				writeError(w, http.StatusBadRequest, "BAD_REQUEST", "Content-Type must be application/json", nil)
				return
			}

			var req models.GeneratePDFRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				writeError(w, http.StatusBadRequest, "BAD_REQUEST", "Malformed JSON body", nil)
				return
			}

			pdfBytes, err := pdfService.GeneratePDF(r.Context(), req)
			if err != nil {
				var validationErr *service.ValidationError
				switch {
				case errors.As(err, &validationErr):
					writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Request validation failed", validationErr.Details)
				case errors.Is(err, service.ErrPhotoTooLarge):
					writeError(w, http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE", "Photo exceeds 5MB limit", nil)
				default:
					slog.Error("generate pdf", "error", err.Error())
					writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error", nil)
				}
				return
			}

			filename := buildFilename(req)
			w.Header().Set("Content-Type", "application/pdf")
			w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(pdfBytes)
		})
	})

	return r
}

func buildFilename(req models.GeneratePDFRequest) string {
	first := sanitizeFilename(req.Data.PersonalInfo.FirstName)
	last := sanitizeFilename(req.Data.PersonalInfo.LastName)
	if first == "" || last == "" {
		return "Resume.pdf"
	}
	return fmt.Sprintf("%s_%s_Resume.pdf", first, last)
}

func sanitizeFilename(value string) string {
	cleaned := strings.Map(func(r rune) rune {
		switch {
		case r >= 'A' && r <= 'Z':
			return r
		case r >= 'a' && r <= 'z':
			return r
		case r >= '0' && r <= '9':
			return r
		default:
			return -1
		}
	}, value)
	return cleaned
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		slog.Info("request completed", "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds(), "request_id", middleware.GetReqID(r.Context()))
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code, message string, details []models.ValidationErrorDetail) {
	writeJSON(w, status, errorResponse{Error: apiError{
		Code:    code,
		Message: message,
		Details: details,
	}})
}
