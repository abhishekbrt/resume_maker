package main

import (
	"log/slog"
	"net/http"
	"os"

	"resume_maker/backend/internal/handlers"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := handlers.NewRouter("1.0.0")
	slog.Info("starting server", "port", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		slog.Error("server stopped", "error", err.Error())
		os.Exit(1)
	}
}
