package models

// GeneratePDFRequest is the payload consumed by the v1 PDF endpoint.
type GeneratePDFRequest struct {
	Data     ResumeData    `json:"data"`
	Settings ResumeSetting `json:"settings"`
	Photo    string        `json:"photo,omitempty"`
}

// ResumeData contains all resume sections used by both preview and PDF rendering.
type ResumeData struct {
	PersonalInfo    PersonalInfo      `json:"personalInfo"`
	Experience      []ExperienceEntry `json:"experience,omitempty"`
	Education       []EducationEntry  `json:"education,omitempty"`
	Projects        []ProjectEntry    `json:"projects,omitempty"`
	TechnicalSkills TechnicalSkills   `json:"technicalSkills,omitempty"`
}

// PersonalInfo is the header content for the resume.
type PersonalInfo struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Location  string `json:"location,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Email     string `json:"email,omitempty"`
	LinkedIn  string `json:"linkedin,omitempty"`
	GitHub    string `json:"github,omitempty"`
	Website   string `json:"website,omitempty"`
}

// ExperienceEntry represents a single role in the experience section.
type ExperienceEntry struct {
	ID        string   `json:"id,omitempty"`
	Company   string   `json:"company"`
	Location  string   `json:"location,omitempty"`
	Role      string   `json:"role"`
	StartDate string   `json:"startDate,omitempty"`
	EndDate   string   `json:"endDate,omitempty"`
	Bullets   []string `json:"bullets,omitempty"`
}

// EducationEntry represents a single education entry.
type EducationEntry struct {
	ID          string   `json:"id,omitempty"`
	Institution string   `json:"institution"`
	Location    string   `json:"location,omitempty"`
	Degree      string   `json:"degree"`
	StartDate   string   `json:"startDate,omitempty"`
	EndDate     string   `json:"endDate,omitempty"`
	Bullets     []string `json:"bullets,omitempty"`
}

// ProjectEntry represents a project in the projects section.
type ProjectEntry struct {
	ID        string   `json:"id,omitempty"`
	Name      string   `json:"name"`
	TechStack string   `json:"techStack,omitempty"`
	StartDate string   `json:"startDate,omitempty"`
	EndDate   string   `json:"endDate,omitempty"`
	Bullets   []string `json:"bullets,omitempty"`
}

// TechnicalSkills stores categorized technical skills.
type TechnicalSkills struct {
	Languages      string `json:"languages,omitempty"`
	Frameworks     string `json:"frameworks,omitempty"`
	DeveloperTools string `json:"developerTools,omitempty"`
	Libraries      string `json:"libraries,omitempty"`
}

// ResumeSetting configures PDF rendering options.
type ResumeSetting struct {
	ShowPhoto  bool   `json:"showPhoto"`
	FontSize   string `json:"fontSize"`
	FontFamily string `json:"fontFamily"`
}

// ValidationErrorDetail maps a concrete field to a validation failure.
type ValidationErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}
