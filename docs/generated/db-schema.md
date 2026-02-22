# Database Schema

> Auto-generated database schema documentation. Update this when schema changes.

---

## Tables

### `auth.users` (managed by Supabase Auth)

Google OAuth identities are stored in Supabase's managed `auth.users` table.
Application code should treat `auth.users.id` (UUID) as the canonical user ID.

---

### `profiles`

| Column       | Type          | Constraints                                 | Description                     |
| ------------ | ------------- | ------------------------------------------- | ------------------------------- |
| `id`         | `UUID`        | PRIMARY KEY, FK → auth.users(id)            | User identifier (same as auth)  |
| `full_name`  | `TEXT`        |                                             | Display name                    |
| `avatar_url` | `TEXT`        |                                             | Optional avatar path            |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW()                     | Profile creation time           |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW(), trigger-maintained | Last profile update             |

---

### `resumes`

| Column        | Type           | Constraints                             | Description                                    |
| ------------- | -------------- | --------------------------------------- | ---------------------------------------------- |
| `id`          | `UUID`         | PRIMARY KEY, DEFAULT gen_random_uuid()  | Unique resume identifier                       |
| `user_id`     | `UUID`         | FK → auth.users(id), NOT NULL           | Owner of the resume                            |
| `title`       | `VARCHAR(255)` | NOT NULL, DEFAULT 'Untitled Resume'     | User-given name for this resume                |
| `template_id` | `VARCHAR(50)`  | FK → templates(id), NOT NULL            | Which template to render with                  |
| `data`        | `JSONB`        | NOT NULL                                | Full resume content (see schema below)         |
| `photo_path`  | `TEXT`         |                                         | Storage object path for profile photo          |
| `created_at`  | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW()                 | Creation time                                  |
| `updated_at`  | `TIMESTAMPTZ`  | NOT NULL, DEFAULT NOW(), trigger-backed | Last update time (maintained by DB trigger)    |

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
    "github": "string (URL, optional)",
    "website": "string (URL, optional)",
    "otherLinks": [
      {
        "id": "string (uuid)",
        "label": "string",
        "url": "string (URL)"
      }
    ]
  },
  "experience": [
    {
      "id": "string (uuid)",
      "company": "string",
      "location": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "id": "string (uuid)",
      "institution": "string",
      "location": "string",
      "degree": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "projects": [
    {
      "id": "string (uuid)",
      "name": "string",
      "techStack": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["string"]
    }
  ],
  "technicalSkills": {
    "languages": "string",
    "frameworks": "string",
    "developerTools": "string",
    "libraries": "string"
  }
}
```

---

## Indexes

```sql
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_user_updated_at ON resumes(user_id, updated_at DESC);
```

---

## Notes

- `auth.users` is the source of truth for identity (Google OAuth via Supabase Auth)
- `profiles` and `resumes` enforce per-user access with Row Level Security (RLS)
- The `data` JSONB column keeps resume content flexible while metadata remains relational
- Profile photos are stored in object storage; `photo_path` stores the object key/path
