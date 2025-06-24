# Schemat bazy danych – AI Travel Planner

## 1. Tabele

### users

Ta tabela jest zarządzana przez Supabase Auth.

| Kolumna       | Typ danych   | Ograniczenia                           |
| ------------- | ------------ | -------------------------------------- |
| id            | uuid         | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email         | varchar(255) | NOT NULL, UNIQUE                       |
| password_hash | text         | NOT NULL                               |
| created_at    | timestamptz  | NOT NULL, DEFAULT now()                |

### plans

| Kolumna         | Typ danych   | Ograniczenia                                     |
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
| created_at      | timestamptz  | NOT NULL, DEFAULT now()                          |

### attractions

| Kolumna     | Typ danych    | Ograniczenia                           |
| ----------- | ------------- | -------------------------------------- |
| id          | uuid          | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name        | varchar(255)  | NOT NULL                               |
| address     | varchar(255)  | NOT NULL                               |
| description | varchar(1000) | NOT NULL                               |
| created_at  | timestamptz   | NOT NULL, DEFAULT now()                |

### plan_activity

| Kolumna        | Typ danych    | Ograniczenia                                           |
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

| Kolumna       | Typ danych  | Ograniczenia                                     |
| ------------- | ----------- | ------------------------------------------------ |
| id            | uuid        | PRIMARY KEY, DEFAULT gen_random_uuid()           |
| plan_id       | uuid        | NOT NULL, REFERENCES plans(id) ON DELETE CASCADE |
| error_message | text        | NOT NULL                                         |
| created_at    | timestamptz | NOT NULL, DEFAULT now()                          |

---

## 2. Relacje między tabelami

- **users (1) → (N) plans**: Jeden użytkownik może mieć wiele planów.
- **plans (1) → (N) plan_activity**: Jeden plan może mieć wiele aktywności.
- **attractions (1) → (N) plan_activity**: Jedna atrakcja może być powiązana z wieloma aktywnościami w różnych planach.
- **plans (1) → (N) generation_errors**: Jeden plan może mieć wiele logów błędów generowania.

## 3. Indeksy

- `users(email)` – unikalny indeks dla szybkiego logowania
- `plans(user_id)` – przyspiesza pobieranie planów użytkownika
- `plan_activity(plan_id, day_number)` – szybkie pobieranie aktywności dla danego planu i dnia
- `plan_activity(attraction_id)` – szybkie wyszukiwanie po atrakcji
- `plans(created_at)` – sortowanie po dacie utworzenia
- `plan_activity(created_at)` – sortowanie aktywności
- `generation_errors(plan_id)` – szybkie pobieranie błędów dla planu

## 4. Zasady PostgreSQL (RLS)

### Przykładowe zasady RLS (Row Level Security):

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

- Brak RLS – atrakcje mogą być współdzielone globalnie.

#### users

- RLS nie jest wymagane – dostęp tylko przez Supabase Auth.

## 5. Dodatkowe uwagi i wyjaśnienia

- Wszystkie klucze główne to UUID (gen_random_uuid), co ułatwia skalowanie i integrację z Supabase.
- Plany i powiązane aktywności są usuwane kaskadowo po usunięciu użytkownika.
- Dni planu są reprezentowane przez pole `day_number` w plan_activity (brak osobnej tabeli days).
- Aktywności mogą być współdzielone między planami przez tabelę attractions.
- Pola tekstowe mają ograniczenia długości zgodnie z wymaganiami.
- Budżet i waluta są opcjonalne.
- Ograniczenie do 30 dni na plan jest wymuszane przez CHECK na day_number.
- Akceptacja aktywności jest przechowywana w polu `accepted` w plan_activity.
- Logi błędów generowania są powiązane z planem w osobnej tabeli.
- Indeksy i ograniczenia zapewniają wydajność i spójność danych.
- RLS zapewnia, że użytkownik widzi tylko swoje plany i powiązane dane.
