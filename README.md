# Mapa Przygód

Gra edukacyjna dla dzieci z klas 1–3: programowanie (układanie drogi ze strzałek, pętle), matematyka i język polski w przygodzie przez kolejne krainy, w stylu pixel art.

> Instrukcja dla rodziców (jak uruchomić grę bez wiedzy technicznej) powstanie w etapie 6 planu.
> Ten plik opisuje na razie budowanie gry ze źródeł.

## Budowanie

```bash
npm install
npm run build        # tworzy dist/: jeden plik index.html + pliki aplikacji (PWA)
```

`dist/index.html` działa samodzielnie: otwarty z dysku, z dowolnego hostingu plików statycznych albo z serwera.

## Testy

```bash
npx playwright install chromium   # raz: przeglądarka do testów
npm test                          # buduje grę i uruchamia wszystkie testy (ok. 2,5 min)
npm run test:quick                # tylko szybkie testy bez przeglądarki
```

Testy grają w prawdziwą grę w przeglądarce Chromium:

| Plik | Co sprawdza |
| --- | --- |
| `tests/expedition.test.mjs` | Pełne wyprawy na poziomach 1–3, czy da się zebrać wszystkie monety w limicie klocków, limit prób na poziomie 3, wyjście z wyprawy w trakcie animacji, szerokość telefonu |
| `tests/save.test.mjs` | Przeniesienie zapisu z pierwszej wersji, PIN, gracze, kopia zapisu, cofanie, uszkodzone pliki, dwie otwarte karty |
| `tests/camp.test.mjs` | Budowa z pytaniem o odejmowanie, ozdoby, ogródek, sklep, działanie budynków na wyprawie |
| `tests/offline.test.mjs` | Gra bez internetu, otwarcie pliku z dysku, brak zapytań poza grę |
| `tests/unit.test.mjs` | SHA-256 dla PIN-u, nazwy kluczy zapisu, wersja w pamięci offline |

Każdy test kończy się błędem, gdy na stronie wystąpi jakikolwiek nieobsłużony wyjątek.

Gra jest losowa (mapy, potwory, słowa), więc każde uruchomienie sprawdza inne przypadki. Na początku wyników każdy plik wypisuje swoje ziarno losowania, np. `SEED=561586849`. Gdy test się wywróci, ten sam przebieg powtórzysz poleceniem:

```bash
SEED=561586849 node --test tests/expedition.test.mjs
```

## Struktura

| Katalog / plik | Co zawiera |
| --- | --- |
| `src/main.js` | Start gry |
| `src/state.js` | Wspólny stan: zapis, wyprawa, scena |
| `src/save.js` | Zapis w wersji 2, migracja ze starszej wersji, profile, eksport i import |
| `src/profiles.js` | PIN przy pierwszym uruchomieniu, ekran „Kto gra?” |
| `src/parent.js` | Panel rodzica |
| `src/sprites.js`, `hero.js`, `pets.js`, `monsters.js`, `props.js` | Grafika rysowana kodem |
| `src/*-room.js`, `expedition.js` | Wyprawa i jej pokoje |
| `src/styles.css`, `src/index.html` | Wygląd i szablon strony |
| `public/` | Manifest, service worker (tryb offline), ikony |
| `tests/` | Testy (patrz wyżej) |
| `tools/` | Generator ikon z grafiki gry |

## Zapis gry

Postęp zapisuje się w przeglądarce (`localStorage`, klucz `lesna-wyprawa-v2`: klucze zachowały pierwszą nazwę gry, żeby nie zgubić zapisów). Rodzic może zrobić kopię zapisu i wczytać ją na innym urządzeniu w panelu „Dla rodzica”.

## Licencje

Kod: MIT. Czcionki Pixelify Sans i Nunito: SIL Open Font License 1.1.
