
# Frontend Sklepowego Systemu Kontroli Standardów

Frontend aplikacji SSKS zbudowany przy użyciu React, TypeScript, Vite i Ant Design.

## Struktura

- `src/main.tsx` – punkt wejścia aplikacji
- `src/App.tsx` – główny komponent aplikacji
- `src/router` – konfiguracja routingu
- `src/pages` – strony aplikacji 
- `src/components` – komponenty wielokrotnego użytku, głównie układ aplikacji
- `src/services` – komunikacja z backendem i konfiguracja Axios
- `src/types` – typy TypeScript używane w aplikacji

## Uruchamianie

1. Przejdź do katalogu frontend:

```bash
cd packages/web
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Uruchom aplikację:

```bash
npm run dev
```

4. Otwórz przeglądarkę:

```bash
http://localhost:5173
```

## Skrypty

- `npm run dev` – uruchomienie trybu deweloperskiego
- `npm run build` – budowa produkcyjna aplikacji
- `npm run lint` – sprawdzenie kodu ESLint
- `npm run preview` – podgląd zbudowanej wersji

## Autoryzacja

Frontend używa JWT do logowania i zabezpieczania tras.

- `src/services/http.ts` – instancja Axios z interceptorem dodającym nagłówek `Authorization`
- `src/services/auth.service.ts` – logowanie i weryfikacja tokenu
- `src/router/index.tsx` – ochrona tras za pomocą loadera `requireAuth`
- `src/components/layout/AppLayout.tsx` – układ aplikacji i menu zależne od roli użytkownika

## Główne funkcje

- strona logowania `/login`
- ochrona tras i weryfikacja tokenu przed wejściem na chronione widoki
- dynamiczne menu w zależności od roli użytkownika
- obsługa tras: Dashboard, Tenants, Store, Users

## Wskazówki

- Upewnij się, że backend działa na `http://localhost:3000`
- Backend musi mieć poprawnie skonfigurowany `JWT_SECRET`
- W pliku `src/services/http.ts` możesz dopasować `baseURL`, jeśli API działa pod innym adresem

