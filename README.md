# Sklepowy System Kontroli Standardów (SSKS)

Monorepo z aplikacją webową i backendem API.

## Struktura projektu

- `packages/backend` – serwer Express + TypeScript + Prisma + PostgreSQL
- `packages/web` – frontend React + TypeScript + Vite + Ant Design

## Wymagania

- Node.js 20+
- npm 10+
- PostgreSQL 

## Szybki start

1. Zainstaluj zależności w monorepo:

```bash
cd packages/backend
npm install
cd ../web
npm install
```

Możesz też wykonać to z katalogu `ssks` gdy korzystasz z workspaces:

```bash
npm install
```

2. Skopiuj plik konfiguracyjny backendu:

```bash
cd packages/backend
cp .env.example .env
```

3. Uruchom lokalną bazę PostgreSQL i ustaw poprawny `DATABASE_URL` w `packages/backend/.env`.

4. Wygeneruj klienta Prisma i uruchom backend:

```bash
npm run db:generate
npm run dev
```

5. Uruchom frontend:

```bash
cd ../web
npm run dev
```

Frontend domyślnie startuje na `http://localhost:5173`.

## Backend

### Ważne skrypty

- `npm run dev` – uruchomienie serwera w trybie deweloperskim
- `npm run build` – kompilacja TypeScript do `dist/`
- `npm start` – uruchomienie zbudowanej wersji
- `npm run db:migrate` – zastosowanie migracji Prisma
- `npm run db:generate` – generacja klienta Prisma
- `npm run db:studio` – uruchamianie Prisma Studio
- `npm run db:seed` – wstrzyknięcie danych testowych

### Zmienne środowiskowe

- `DATABASE_URL` – adres bazy PostgreSQL
- `JWT_SECRET` – sekret JWT (min. 32 znaki)
- `PORT` – port serwera (domyślnie `3000`)
- `NODE_ENV` – środowisko `development` / `production`
- `UPLOADS_DIR` – folder na przesyłane pliki

## Frontend

### Ważne skrypty

- `npm run dev` – uruchomienie aplikacji w trybie deweloperskim
- `npm run build` – budowa aplikacji statycznej
- `npm run preview` – podgląd zbudowanej wersji

## Autoryzacja i role

Backend używa JWT. Po zalogowaniu frontend zapisuje token w `localStorage` i wysyła go w nagłówku `Authorization`.

Endpoint `/api/auth/validate` weryfikuje token i zwraca informacje o użytkowniku, w tym jego `role`.

## Testowe konto administratora (po wykonaniu npm run db:seed)

- email: `admin@ssks.pl`
- hasło: `Admin123!`

## Uwagi

Upewnij się, że backend i frontend pracują z tą samą bazą danych oraz że `DATABASE_URL` jest poprawnie skonfigurowany. Jeśli masz problem z logowaniem, sprawdź, czy serwer API działa na `http://localhost:3000` i czy `JWT_SECRET` jest ustawiony.

