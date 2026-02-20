# Database Schema

> Auto-generated database schema documentation. Update this when schema changes.

---

## Tables

### `users`

| Column          | Type           | Constraints                            | Description            |
| --------------- | -------------- | -------------------------------------- | ---------------------- |
| `id`            | `UUID`         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `email`         | `VARCHAR(255)` | UNIQUE, NOT NULL                       | User's email address   |
| `password_hash` | `VARCHAR(255)` | NOT NULL                               | bcrypt hashed password |
| `full_name`     | `VARCHAR(255)` |                                        | Display name           |
| `created_at`    | `TIMESTAMPTZ`  | DEFAULT NOW()                          | Account creation time  |
| `updated_at`    | `TIMESTAMPTZ`  | DEFAULT NOW()                          | Last update time       |

---

### `resumes`

| Column        | Type           | Constraints                            | Description                            |
| ------------- | -------------- | -------------------------------------- | -------------------------------------- |
| `id`          | `UUID`         | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique resume identifier               |
| `user_id`     | `UUID`         | FK → users(id), NOT NULL               | Owner of the resume                    |
| `title`       | `VARCHAR(255)` | NOT NULL, DEFAULT 'Untitled Resume'    | User-given name for this resume        |
| `template_id` | `VARCHAR(50)`  | NOT NULL, DEFAULT 'classic'            | Which template to render with          |
| `data`        | `JSONB`        | NOT NULL                               | Full resume content (see schema below) |
| `photo_url`   | `TEXT`         |                                        | S3 path to profile photo (nullable)    |
| `created_at`  | `TIMESTAMPTZ`  | DEFAULT NOW()                          | Creation time                          |
| `updated_at`  | `TIMESTAMPTZ`  | DEFAULT NOW()                          | Last update time                       |

---

### `templates`

| Column        | Type           | Constraints   | Description                           |
| ------------- | -------------- | ------------- | ------------------------------------- |
| `id`          | `VARCHAR(50)`  | PRIMARY KEY   | Template identifier (e.g., 'classic') |
| `name`        | `VARCHAR(100)` | NOT NULL      | Display name                          |
| `description` | `TEXT`         |               | Template description                  |
| `is_default`  | `BOOLEAN`      | DEFAULT FALSE | Whether this is the default template  |
| `created_at`  | `TIMESTAMPTZ`  | DEFAULT NOW() | Creation time                         |

---

## Resume Data JSONB Schema

The `data` column in `resumes` stores structured JSON. Here is the expected shape:

```json
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "location": "string",
    "phone": "string",
    "email": "string",
    "linkedin": "string (URL, optional)",
    "website": "string (URL, optional)"
  },
  "summary": "string (paragraph, optional)",
  "experience": [
    {
      "id": "string (uuid)",
      "company": "string",
      "location": "string",
      "role": "string",
      "startDate": "string (YYYY-MM)",
      "endDate": "string (YYYY-MM or 'Present')",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "id": "string (uuid)",
      "institution": "string",
      "location": "string",
      "degree": "string",
      "graduationDate": "string (YYYY-MM)",
      "bullets": ["string"]
    }
  ],
  "skills": ["string"],
  "sections": [
    {
      "id": "string (uuid)",
      "title": "string (e.g., 'Volunteering', 'Projects', 'Certifications')",
      "items": [
        {
          "label": "string",
          "value": "string"
        }
      ]
    }
  ],
  "sectionOrder": [
    "personalInfo",
    "summary",
    "experience",
    "education",
    "skills",
    "sections"
  ],
  "settings": {
    "showPhoto": true,
    "fontSize": "medium",
    "fontFamily": "times"
  }
}
```

---

## Indexes

```sql
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_updated_at ON resumes(updated_at DESC);
```

---

## Notes

- The `data` JSONB column allows schema flexibility — new fields can be added without migrations
- The `sectionOrder` array controls the rendering order of sections in the template
- The `sections` array is a generic container for custom sections (Projects, Volunteering, Certifications, etc.)
- Photo storage: the actual image is in S3; `photo_url` stores the S3 key for retrieval
