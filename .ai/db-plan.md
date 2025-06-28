# Database Schema – AI Travel Planner

## 1. Tables

### users

This table is managed by Supabase Auth.

| Column        | Data Type    | Constraints                            |
| ------------- | ------------ | -------------------------------------- |
| id            | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email         | varchar(255) | NOT NULL, UNIQUE                       |
| password_hash | text         | NOT NULL                               |
| created_at    | timestamptz  | NOT NULL, DEFAULT now()                |

### plans

| Column          | Data Type    | Constraints                                      |
| --------------- | ------------ | ------------------------------------------------ |
| id              | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| user_id         | uuid         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE |
| name            | varchar(255) | NOT NULL                                         |
| destination     | varchar(255) | NOT NULL                                         |
| start_date      | date         | NOT NULL                                         |
| end_date        | date         | NOT NULL                                         |
| adults_count    | integer      | NOT NULL, CHECK (adults_count >= 1)              |
| children_count  | integer      | NOT NULL, CHECK (children_count >= 0)            |
| budget_total    | integer      | NULLABLE                                         |
| budget_currency | varchar(16)  | NULLABLE                                         |
| travel_style    | varchar(64)  | NULLABLE                                         |
| job_id          | uuid         | UNIQUE, NOT NULL                                 |
| status          | varchar(32)  | NOT NULL, DEFAULT 'processing'                   |
| created_at      | timestamptz  | NOT NULL, DEFAULT now()                          |

### attractions

| Column      | Data Type     | Constraints                            |
| ----------- | ------------- | -------------------------------------- |
| id          | uuid          | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name        | varchar(255)  | NOT NULL                               |
| address     | varchar(255)  | NOT NULL                               |
| description | varchar(1000) | NOT NULL                               |
| created_at  | timestamptz   | NOT NULL, DEFAULT now()                |

### plan_activity

| Column         | Data Type     | Constraints                                            |
| -------------- | ------------- | ------------------------------------------------------ |
| id             | uuid          | PRIMARY KEY, DEFAULT gen_random_uuid()                 |
| plan_id        | uuid          | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE       |
| attraction_id  | uuid          | NOT NULL, REFERENCES attractions(id)                   |
| day_number     | integer       | NOT NULL, CHECK (day_number >= 1 AND day_number <= 30) |
| activity_order | integer       | NOT NULL                                               |
| accepted       | boolean       | NOT NULL, DEFAULT true                                 |
| custom_desc    | varchar(1000) | NULLABLE                                               |
| opening_hours  | varchar(255)  | NULLABLE                                               |
| cost           | integer       | NULLABLE                                               |
| created_at     | timestamptz   | NOT NULL, DEFAULT now()                                |

### generation_errors

| Column        | Data Type   | Constraints                                      |
| ------------- | ----------- | ------------------------------------------------ |
| id            | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| plan_id       | uuid        | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE |
| error_message | text        | NOT NULL                                         |
| error_details | jsonb       | NULLABLE                                         |
| created_at    | timestamptz | NOT NULL, DEFAULT now()                          |

---

## 2. Table Relationships

- **users (1) → (N) plans**: One user can have many plans.
- **plans (1) → (N) plan_activity**: One plan can have many activities.
- **attractions (1) → (N) plan_activity**: One attraction can be linked to many activities in different plans.
- **plans (1) → (N) generation_errors**: One plan can have many generation error logs.

## 3. Indexes

- `users(email)` – unique index for fast login
- `plans(user_id)` – speeds up fetching user's plans
- `plans(job_id)` – unique index for job lookup
- `plans(status)` – index for status queries
- `plan_activity(plan_id, day_number)` – fast retrieval of activities for a given plan and day
- `plan_activity(attraction_id)` – fast search by attraction
- `plans(created_at)` – sorting by creation date
- `plan_activity(created_at)` – sorting activities
- `generation_errors(plan_id)` – fast retrieval of errors for a plan

## 4. PostgreSQL Rules (RLS)

### Example RLS (Row Level Security) policies:

#### plans

```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_is_owner ON plans
  USING (user_id = auth.uid());
```

#### plan_activity

```sql
ALTER TABLE plan_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_owns_plan ON plan_activity
  USING (plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid()));
```

#### generation_errors

```sql
ALTER TABLE generation_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_owns_plan ON generation_errors
  USING (plan_id IN (SELECT id FROM plans WHERE user_id = auth.uid()));
```

#### attractions

- No RLS – attractions can be shared globally.

#### users

- RLS not required – access only via Supabase Auth.

## 5. Additional Notes and Explanations

- All primary keys are UUIDs (gen_random_uuid), which facilitates scaling and integration with Supabase.
- Plans and related activities are deleted in cascade when a user is deleted.
- Plan days are represented by the `day_number` field in plan_activity (no separate days table).
- Activities can be shared between plans via the attractions table.
- Text fields have length limits according to requirements.
- Budget and currency are optional.
- The 30-day limit per plan is enforced by a CHECK on day_number.
- Activity acceptance is stored in the `accepted` field in plan_activity.
- Generation error logs are linked to a plan in a separate table and can store structured error details.
- Indexes and constraints ensure data performance and consistency.
- RLS ensures that a user only sees their own plans and related data.
