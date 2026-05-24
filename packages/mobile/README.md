# SSKS Mobile

Aplikacja mobilna systemu SSKS przygotowana w React Native oraz Expo.

## Cel aplikacji

Aplikacja służy audytorowi do wykonywania audytów sklepów w terenie.

Główne funkcje:
- logowanie użytkownika,
- pobieranie przypisanych audytów,
- wypełnianie karty audytu,
- obsługa kategorii i punktów kontroli,
- zapis odpowiedzi OK / FAIL / NA,
- dodawanie notatek oraz zdjęć,
- zakończenie audytu i przesłanie wyników do backendu.

## Technologie

- React Native
- Expo
- Expo Router
- TypeScript
- komunikacja z backendem SSKS API

## Uruchomienie

Z katalogu głównego repozytorium:

    cd packages/mobile
    npm install
    npm run start

## Backend

Aplikacja mobilna korzysta z backendu SSKS dostępnego domyślnie pod adresem:

    http://localhost:3000/api

Docelowo adres API będzie konfigurowany w pliku środowiskowym aplikacji mobilnej.
