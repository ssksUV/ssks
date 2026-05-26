# SSKS – Backend

REST API dla aplikacji SSKS. Node.js + Express + TypeScript + Prisma + PostgreSQL (Neon).

## Wymagania

- Node.js 20+
- npm 10+
- Dostęp do bazy danych (Neon) 

## Uruchomienie

```bash
cd packages/backend
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

Serwer startuje na `http://localhost:3000`.

## Weryfikacja

```bash
curl http://localhost:3000/health
```

## Komendy

| Komenda | Opis |
|---------|------|
| `npm run dev` | Serwer deweloperski z hot-reload |
| `npm run build` | Kompilacja TypeScript → `dist/` |
| `npm start` | Uruchomienie zbudowanej wersji |
| `npm run db:migrate` | Zastosowanie nowych migracji |
| `npm run db:generate` | Regeneracja klienta Prisma po zmianie schematu |
| `npm run db:studio` | GUI podglądu bazy danych |

## Zmienne środowiskowe

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) |
| `JWT_SECRET` | Sekret do podpisywania tokenów JWT (min. 32 znaki), token ważny 24h |
| `PORT` | Port serwera (domyślnie 3000) |
| `NODE_ENV` | Środowisko: `development` / `production` |
| `UPLOADS_DIR` | Folder na zdjęcia z audytów (domyślnie `./uploads`) |

## Struktura

```
src/
├── index.ts          # punkt wejścia, konfiguracja Express
├── routes/           # definicje tras API
├── controllers/      # obsługa żądań HTTP
├── services/         # logika biznesowa
└── middleware/       # JWT, autoryzacja, tenant isolation
prisma/
└── schema.prisma     # schemat bazy danych
```

## Endpointy

### Auth

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| POST | `/api/auth/login` | Logowanie, zwraca JWT | – |
| POST | `/api/auth/register` | Tworzenie nowego użytkownika | ADMIN, MANAGER (tylko MANAGER/AUDITOR w swoim tenancie) |

### Tenants

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| GET | `/api/tenants` | Lista wszystkich tenantów | ADMIN |
| GET | `/api/tenants/:id` | Szczegóły tenanta | ADMIN |
| POST | `/api/tenants` | Tworzenie tenanta | ADMIN |
| PUT | `/api/tenants/:id` | Edycja tenanta | ADMIN |

### Stores

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| GET | `/api/stores` | Lista sklepów tenanta | MANAGER |
| GET | `/api/stores/:id` | Szczegóły sklepu | MANAGER |
| POST | `/api/stores` | Tworzenie sklepu | MANAGER |
| PUT | `/api/stores/:id` | Edycja sklepu | MANAGER |
| DELETE | `/api/stores/:id` | Dezaktywacja sklepu | MANAGER |

### Users

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| GET | `/api/users?tenantId=` | Lista użytkowników tenanta | ADMIN, MANAGER |
| PUT | `/api/users/:id?tenantId=` | Edycja użytkownika | ADMIN, MANAGER |
| DELETE | `/api/users/:id?tenantId=` | Dezaktywacja użytkownika | ADMIN, MANAGER |

### Templates

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| GET | `/api/templates` | Lista szablonów checklist | MANAGER |
| GET | `/api/templates/:id` | Szczegóły szablonu z kategoriami i punktami | MANAGER |
| POST | `/api/templates` | Tworzenie szablonu | MANAGER |
| PUT | `/api/templates/:id` | Edycja szablonu | MANAGER |
| DELETE | `/api/templates/:id` | Dezaktywacja szablonu | MANAGER |
| POST | `/api/templates/:id/categories` | Dodanie kategorii do szablonu | MANAGER |
| PUT | `/api/templates/categories/:id` | Edycja kategorii | MANAGER |
| DELETE | `/api/templates/categories/:id` | Usunięcie kategorii (kaskadowo usuwa punkty) | MANAGER |
| POST | `/api/templates/categories/:id/items` | Dodanie punktu kontrolnego | MANAGER |
| PUT | `/api/templates/items/:id` | Edycja punktu kontrolnego | MANAGER |
| DELETE | `/api/templates/items/:id` | Usunięcie punktu kontrolnego | MANAGER |

### Audits

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| GET | `/api/audits` | Lista audytów (MANAGER: wszystkie w tenancie, AUDITOR: własne) | MANAGER, AUDITOR |
| GET | `/api/audits/:id` | Szczegóły audytu z wynikami | MANAGER, AUDITOR |
| POST | `/api/audits` | Tworzenie audytu | MANAGER |
| PATCH | `/api/audits/:id/start` | Rozpoczęcie audytu (status → IN_PROGRESS) | AUDITOR |
| PUT | `/api/audits/:id/results` | Zapis wyników punktów kontrolnych | AUDITOR |
| PATCH | `/api/audits/:id/complete` | Zakończenie audytu (status → COMPLETED) | AUDITOR |
| PATCH | `/api/audits/:id/reopen` | Ponowne otwarcie audytu (status → IN_PROGRESS) | MANAGER |
| GET | `/api/audits/:id/pdf` | Pobranie raportu PDF (tylko COMPLETED) | MANAGER, AUDITOR |

### Uploads

| Metoda | Ścieżka | Opis | Autoryzacja |
|--------|---------|------|-------------|
| POST | `/api/uploads` | Upload zdjęcia (multipart/form-data, pole: `photo`) | MANAGER, AUDITOR |
| GET | `/uploads/:filename` | Pobranie zdjęcia (statyczny URL) | – |