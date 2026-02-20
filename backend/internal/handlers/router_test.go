package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"resume_maker/backend/internal/handlers"
)

func TestHealthEndpoint(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if got := rr.Header().Get("Content-Type"); !strings.Contains(got, "application/json") {
		t.Fatalf("expected JSON response, got %q", got)
	}

	if body := rr.Body.String(); !strings.Contains(body, `"status":"ok"`) {
		t.Fatalf("expected status ok in body, got %s", body)
	}
}

func TestTemplatesEndpoint(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	req := httptest.NewRequest(http.MethodGet, "/api/v1/templates", nil)
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if body := rr.Body.String(); !strings.Contains(body, `"id":"classic"`) {
		t.Fatalf("expected classic template, got %s", body)
	}
}

func TestGeneratePDFSuccess(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	payload := map[string]any{
		"data": map[string]any{
			"personalInfo": map[string]any{
				"firstName": "Ada",
				"lastName":  "Lovelace",
				"email":     "ada@example.com",
			},
			"experience": []map[string]any{
				{
					"company":   "Analytical Engines Inc.",
					"role":      "Research Assistant",
					"startDate": "June 2020",
					"endDate":   "Present",
					"bullets": []string{
						"Designed robust analytical workflows.",
					},
				},
			},
			"technicalSkills": map[string]any{
				"languages":      "Go, Python",
				"frameworks":     "React",
				"developerTools": "Docker, Git",
				"libraries":      "NumPy",
			},
		},
		"settings": map[string]any{
			"showPhoto":  false,
			"fontSize":   "medium",
			"fontFamily": "times",
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/resumes/generate-pdf", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body=%s", rr.Code, rr.Body.String())
	}
	if got := rr.Header().Get("Content-Type"); !strings.Contains(got, "application/pdf") {
		t.Fatalf("expected PDF response, got %q", got)
	}
	if !strings.Contains(rr.Header().Get("Content-Disposition"), "Lovelace") {
		t.Fatalf("expected generated file name to include last name, got %q", rr.Header().Get("Content-Disposition"))
	}
	if !bytes.HasPrefix(rr.Body.Bytes(), []byte("%PDF")) {
		t.Fatalf("expected PDF bytes to start with %%PDF")
	}
}

func TestGeneratePDFSuccessWithTechnicalSkillsOnly(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	payload := map[string]any{
		"data": map[string]any{
			"personalInfo": map[string]any{
				"firstName": "Jake",
				"lastName":  "Ryan",
			},
			"technicalSkills": map[string]any{
				"languages": "Java, Python, C++",
			},
		},
		"settings": map[string]any{
			"showPhoto":  false,
			"fontSize":   "medium",
			"fontFamily": "times",
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/resumes/generate-pdf", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body=%s", rr.Code, rr.Body.String())
	}
}

func TestGeneratePDFValidationError(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	payload := map[string]any{
		"data": map[string]any{
			"personalInfo": map[string]any{
				"firstName": "",
				"lastName":  "",
			},
			"technicalSkills": map[string]any{
				"languages": "",
			},
		},
		"settings": map[string]any{
			"showPhoto":  false,
			"fontSize":   "medium",
			"fontFamily": "times",
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/resumes/generate-pdf", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", rr.Code, rr.Body.String())
	}
	if body := rr.Body.String(); !strings.Contains(body, "VALIDATION_ERROR") {
		t.Fatalf("expected validation error code, got %s", body)
	}
}

func TestCORSPreflightAllowsEditorOrigin(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/resumes/generate-pdf", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type")
	rr := httptest.NewRecorder()

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for preflight, got %d", rr.Code)
	}
	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Fatalf("expected allowed origin header, got %q", got)
	}
}
