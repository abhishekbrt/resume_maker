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
				"linkedin":  "linkedin.com/in/ada",
				"github":    "github.com/ada",
				"website":   "adalovelace.dev",
				"otherLinks": []map[string]any{
					{
						"label": "LeetCode",
						"url":   "leetcode.com/ada",
					},
				},
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
	if !bytes.Contains(rr.Body.Bytes(), []byte("/URI")) {
		t.Fatalf("expected PDF to include clickable URI annotations")
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

func TestGeneratePDFSuccessForLongResumeContent(t *testing.T) {
	router := handlers.NewRouter("1.0.0")
	bullets := make([]string, 0, 60)
	for i := 0; i < 60; i++ {
		bullets = append(bullets, "Implemented concurrency-heavy backend systems and validated throughput under sustained load.")
	}

	payload := map[string]any{
		"data": map[string]any{
			"personalInfo": map[string]any{
				"firstName": "Abhishek",
				"lastName":  "Bharti",
				"email":     "abhishek@example.com",
				"github":    "github.com/abhishekbhrt",
			},
			"experience": []map[string]any{
				{
					"company":   "Google",
					"role":      "Backend Engineer Intern",
					"location":  "Mountain View, California",
					"startDate": "April 2025",
					"endDate":   "Dec 2025",
					"bullets":   bullets,
				},
			},
			"projects": []map[string]any{
				{
					"name":      "Space Invaders Game (Go)",
					"techStack": "Golang",
					"startDate": "2024",
					"endDate":   "2025",
					"bullets":   bullets[:20],
				},
			},
			"technicalSkills": map[string]any{
				"languages":      "Java, Golang, Python",
				"frameworks":     "React, Node.js, PyTorch",
				"developerTools": "Git, Docker",
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
	if !bytes.HasPrefix(rr.Body.Bytes(), []byte("%PDF")) {
		t.Fatalf("expected PDF bytes to start with %%PDF")
	}
	pageMarkers := bytes.Count(rr.Body.Bytes(), []byte("/Type /Page"))
	if pageMarkers < 2 {
		t.Fatalf("expected multi-page PDF output, got only %d page marker(s)", pageMarkers)
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
