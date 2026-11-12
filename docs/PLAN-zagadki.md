# Plan zmian w zagadkach: logika, matematyka, zegar

Stan: **przyjęty do realizacji, nic jeszcze nie wdrożone** (12 listopada 2026). Plan realizuje się krok po kroku, w kolejności z rozdziału 2. Uzasadnienie i źródła są w karcie „Mechanika zagadek” dokumentu z planem gry; tutaj jest to, czego potrzebuje wykonawca.

Programowanie (ścieżka), walka na karty i pieniądze **zostają bez zmian**.

## 0. Zasady dla wykonawcy

1. **Jeden krok naraz.** Po każdym kroku: testy, przegląd kodu, publikacja, raport (lista w rozdziale 5). Nie zaczynaj następnego kroku bez zielonego `npm test`.
2. **Zapis dziecka jest nietykalny.** Klucz `lesna-wyprawa-v2` się nie zmienia. Każde nowe pole profilu trzeba dopisać w `normalizeProfile` w `src/save.js`, bo ta funkcja przepuszcza tylko znane pola. Stary zapis bez pola musi się wczytać.
3. **Nie usuwaj kluczy z `SKILLS`** w `src/stats.js`: `normalizeStats` wyrzuca odpowiedzi o nieznanym kluczu, więc usunięcie `logic.who` skasowałoby historię. Stare klucze zostają z dopiskiem „(dawne)”.
4. **Opis w statystykach ma limit 40 znaków** (`record(..., detail)` tnie dłuższe).
5. **Generator osobno od ekranu.** Każda zagadka ma moduł bez DOM (`gen(lvl)`, `check(q, state)`, `solution(q)`), testowany w Node tysiące razy, i osobny moduł ekranu.
6. **Każda zagadka mieści się na jednym ekranie** na 360×640, 390×844, 768×1024 i 1024×768. Nowy ekran = nowy przypadek w `tests/layout.test.mjs`.
7. **Bez przeciągania.** Układanie działa na dwa dotknięcia: dotknij element, potem miejsce. Dotknięcie zajętego miejsca oddaje element. To zwykłe przyciski, więc działa klawiatura, czytnik ekranu i Playwright.
8. **Bez zegara w zadaniach.** Żadna zagadka nie ma limitu czasu ani nagrody za szybkość.
9. **Tekst minimalny.** Polecenie to jedno krótkie zdanie czytane na głos (`say`). Wskazówki są obrazkowe; dotknięcie wskazówki czyta ją na głos (`speak(text, true)`).
10. Po każdym `await` w pokoju sprawdzaj `left(run)`. Teksty od gracza i z zapisu tylko przez `esc()` albo `say()`; `sayHTML()` zostaje wyłącznie tam, gdzie jest dziś.
11. Losowość gry przez `rnd/ri/pick/shuffle` z `src/util.js` (ziarno), efekty mogą używać `Math.random`.
12. Poziom bierz przez nową funkcję `levelFor(domain)` w `src/content.js` (`"logic"`, `"math"`, `"time"`), która na razie zwraca `GS.G.level`. Etap 3 rozdzieli poziomy na dziedziny bez ruszania zagadek.

## 1. Zebrane uwagi i co z nimi robimy

| # | Uwaga | Skąd | Decyzja | Krok |
| --- | --- | --- | --- | --- |
| 1 | Zagadki logiczne są do poprawienia | rodzic | Sowa daje jedną zagadkę do układania zamiast dwóch pytań z wyborem | 2–4, 6–9 |
| 2 | „Kto to zrobił?” sprawdza czytanie i wiedzę o zwierzętach; strzał trafia w 25–33% | przegląd | Znika. Następca: „Kto gdzie mieszka” (to samo łączenie faktów, ale układane) | 2 |
| 3 | „Jeśli… to…” da się rozwiązać bez reguły, zadań jest 11 i są stałe | przegląd | Znika z pokoju Sowy. Wróci jako klocek warunku w programowaniu (Etap 4) | 2 |
| 4 | „Co nie pasuje” jest płytkie | przegląd | Zostaje tylko na poziomie 1 | 6 |
| 5 | „Co dalej” zna tylko wzory powtarzane | przegląd, Alfik | Dochodzą ciągi liczbowe i figury rosnące | 6 |
| 6 | Brak zadań przestrzennych (6 z 21 zadań Alfika) | Alfik | Nowa zagadka „Płytki i klocki” | 3 |
| 7 | Brak łamigłówek liczbowych (8 z 21 zadań Alfika) | Alfik | „Piramida liczbowa”, potem „Znaki” | 4, 9 |
| 8 | Równania z symbolem: A + A + A = 12 | Alfik | „Waga” jako obraz równania | 9 |
| 9 | Odkrywanie reguły próbami (wzór Zoombinis) | przegląd | „Dwa mosty” | 8 |
| 10 | Rozmieszczanie pod warunkami | przegląd, Alfik | Obrazkowe sudoku | 7 |
| 11 | Matematyka: lekko zmodyfikować | rodzic | Trzy małe zmiany w walce | 1 |
| 12 | Po błędzie dziecko dostaje sam wynik | przegląd | Obrazkowe wyjaśnienie: ramka dziesiątkowa, oś liczbowa | 1 |
| 13 | Błędne odpowiedzi tarczy są losowe | przegląd | Odpowiedzi z typowych pomyłek, rodzaj pomyłki trafia do statystyk | 1 |
| 14 | Na kartach jest sama cyfra | przegląd | Kropki pod cyfrą na poziomie 1 | 1 |
| 15 | Zegar: zbadać | rodzic | Cztery małe zmiany, potem dwie większe | 5, 10 |
| 16 | Wskazówki ustawia się osobno, więc nie widać, że duża przesuwa małą | przegląd | Zegar z przekładnią | 5 |
| 17 | Zapis 3:30 to osobna umiejętność | przegląd | Na poziomie 1 odpowiedzi słowami; start od samej małej wskazówki | 5 |
| 18 | Dziecko nie czuje, ile trwa 5 minut, a ile godzina | rodzic | „Zgadnij, ile potrwa wyprawa” i „godzina to tyle, co N wypraw”; potem dokręcanie czasu i plan dnia | 5, 10 |
| 19 | Teksty za długie, wszystko ma się mieścić na ekranie | rodzic | Zasady 6 i 9 | każdy |
| 20 | Pokój Sowy wydłużył wyprawę | znane | Jedna zagadka, cel do 3 minut | 2 |
| 21 | Programowanie, walka na karty, pieniądze są w porządku | rodzic | Bez zmian | — |
| 22 | Presja czasu: dowody sporne | przegląd | Zostajemy bez zegara w zadaniach | — |

**Przyjęte rozstrzygnięcia** (wcześniej pytania do rodzica; można je odwrócić przed krokiem, którego dotyczą):

- Sowa daje jedną zagadkę do układania na wyprawę.
- Zadania z treścią: później, jako osobny pokój. Nie w tym planie.
- Małe zmiany zegara idą bez czekania na obserwację; obserwacja dziecka decyduje o kroku 10.
- „Maszyna Sowy” odpada (pokrywa się z ciągami i piramidą).

## 2. Kolejność

| Krok | Co | Wielkość | Co dziecko zobaczy |
| --- | --- | --- | --- |
| 1 | Matematyka: wyjaśnienie po błędzie, mądrzejsze odpowiedzi, kropki na kartach | mała | Po złej odpowiedzi na tarczy animacja, jak to policzyć |
| 2 | Sowa: wspólna rama zagadek + „Kto gdzie mieszka”; koniec „Kto to zrobił?” i „Jeśli… to…” | duża | Domki i zwierzaki do ustawienia |
| 3 | „Płytki i klocki” | średnia | Podłoga z dziurą, pasujący kawałek |
| 4 | „Piramida liczbowa” | średnia | Piramida z pustymi polami |
| 5 | Zegar: przekładnia, sama mała wskazówka, odpowiedzi słowami, zgadywanie czasu wyprawy | średnia | Wskazówki chodzą razem; pytanie przed wyprawą |
| 6 | Ciągi liczbowe i figury rosnące | mała | Nowe „co dalej” |
| 7 | Obrazkowe sudoku | średnia | Kratka z ikonami |
| 8 | „Dwa mosty” | duża | Stworki i dwa mosty z ukrytą regułą |
| 9 | „Waga” i „Znaki” | średnia | Szalki, pola na + i − |
| 10 | Zegar: dokręcanie czasu trwania, plan dnia | średnia | Zegar zamiast wyboru odpowiedzi, dzień na osi |

Dlaczego tak: krok 1 jest mały i niezależny, więc daje efekt od razu i pozwala wejść w kod. Kroki 2–4 zamykają to, co rodzic wskazał jako najsłabsze, i największą lukę z Alfika. Zegar (5) jest niezależny od logiki; stoi w środku, bo do tego czasu będzie już obserwacja dziecka w Górach. Kroki 6–10 dokładają odmiany.

## 3. Ustalenia wspólne dla zagadek Sowy (powstają w kroku 2)

### Pliki

- `src/puzzles/<nazwa>.js` — generator bez DOM: `gen(lvl)`, `check(q, state)`, `solution(q)`.
- `src/puzzles/<nazwa>-ui.js` — ekran: `play(q)` zwraca `Promise<{ ok, checks }>`.
- `src/puzzle-ui.js` — części wspólne:
  - `placer(root, { onChange })`: układanie na dwa dotknięcia między `.piece[data-k]` a `.slot[data-i]`; `aria-pressed` na wybranym elemencie.
  - `numPad(host, { max })`: cyfry 0–9 i ⌫ (`[data-d]`), wartość dwucyfrowa.
  - `runPuzzle({ skill, kind, maxChecks, check, onFail, reveal, note, ans })`: wspólna obsługa przycisku `#checkBtn`, licznik prób, `record`, `save`, `hurt`, `left(run)`, zaczep testowy.
- `src/logic-room.js` — rejestr rodzajów i wybór zagadki.

### Zasada prób (wszystkie zagadki do układania)

- Przycisk „Sprawdź” (`#checkBtn`) działa, gdy wszystko jest ułożone.
- Nieudane sprawdzenie 1 i 2: gra pokazuje, **co** się nie zgadza (czerwona wskazówka, czerwone pole), bez kary. Dziecko poprawia.
- Nieudane sprawdzenie 3: `hurt()`, gra układa rozwiązanie i pokazuje je 3 s.
- Statystyki: `record(skill, ok, ms, opis)`, gdzie `ok` znaczy „rozwiązane bez nieudanego sprawdzenia”; liczba sprawdzeń trafia do opisu.
- Wyjątki od liczby prób są opisane przy zagadce („Dwa mosty”, „Waga”).

### Nagroda

Dziś Sowa daje do 4 zł (2 zł za zagadkę). Po zmianie: 4 zł za rozwiązanie bez nieudanego sprawdzenia, 2 zł za rozwiązanie z poprawkami, 0 zł po pokazaniu rozwiązania. Suma na wyprawę się nie zmienia.

### Wybór zagadki

- Nowe pole profilu `logicSeen: string[]` (ostatnio grane rodzaje). Losuj spośród rodzajów, których nie ma w `logicSeen`; gdy wszystkie były, wyczyść listę, zostawiając ostatni, żeby ten sam rodzaj nie wypadł dwa razy z rzędu.
- `normalizeProfile`: przepuść tylko znane nazwy rodzajów, najwyżej tyle, ile jest rodzajów minus jeden.
- Zaczep testowy: `window.__LW_TEST.logic = "<rodzaj>"` wymusza rodzaj. Po zbudowaniu zadania `window.__LW_TEST.q = { kind, ans }`, gdzie `ans` to rozwiązanie w postaci, którą test potrafi wpisać (opisane przy każdej zagadce).

### Testy wspólne

- `tests/puzzles.test.mjs`: dla każdego generatora 1500 losowań na poziom: dokładnie jedno rozwiązanie (przegląd zupełny), `solution(q)` przechodzi `check`, zakres liczb zgodny z poziomem.
- `tests/helpers.mjs`: `quizRoom` rozpoznaje nowe rodzaje i układa `ans` kliknięciami.
- `tests/layout.test.mjs`: nowy test na każdy ekran, który po kolei wymusza każdy rodzaj zagadki Sowy i sprawdza te same warunki co dla pokoi (bez przewijania, `#checkBtn` na ekranie, dymek nie zgnieciony). Dopisz `#checkBtn` do selektora głównego przycisku.
- `tests/expedition.test.mjs`, wiersz z `"logic.who"`: zamiast tego klucza sprawdzaj, że pokój Sowy zapisał jakąkolwiek odpowiedź z listy kluczy zagadek Sowy.
- `tests/save.test.mjs`: zapis bez `logicSeen` się wczytuje; pole przeżywa eksport i import; śmieci w polu są odrzucane.

## 4. Kroki

### Krok 1. Matematyka: trzy małe zmiany w walce

**Cel:** po błędzie dziecko widzi sposób, a rodzic rodzaj pomyłki.

**Pliki:** nowy `src/math-data.js` (bez DOM), nowy `src/explain-ui.js`, zmiany w `src/monster-room.js`, `src/styles.css`, testy.

1. **Przenieś `attackQ` do `src/math-data.js`** jako `genShield(lvl)`. Zachowanie bez zmian poza odpowiedziami.
2. **Odpowiedzi z typowych pomyłek:** `shieldOptions(q, n)` zwraca `[{ v, tag }]`, w tym poprawną (`tag: null`).

   | Zadanie | Błędne odpowiedzi, w kolejności pierwszeństwa | `tag` |
   | --- | --- | --- |
   | `a + b` | wynik ± 1 (pomyłka w doliczaniu); `a − b`, gdy `a > b` | `o 1`; `inne działanie` |
   | `a − b` | wynik ± 1; przy przejściu przez dziesiątkę `10·⌊a/10⌋ + (b mod 10 − a mod 10)`, np. 13 − 5 → 12; `a + b` | `o 1`; `bez pożyczki`; `inne działanie` |
   | `a + ? = s` | `s + a`; `s`; wynik ± 1 | `inne działanie`; `przepisana`; `o 1` |
   | `a + b − c` | `a + b`; wynik ± 1; `a + b + c` | `pół zadania`; `o 1`; `inne działanie` |

   Poziom 1: trzy odpowiedzi, poziomy 2–3: cztery. Odpowiedzi są różne i nieujemne; gdy zabraknie, dobierz wynik ± 2, ± 3. Opis w statystykach: `8 + 5 → 12 (13) o 1`.
3. **Wyjaśnienie po błędzie:** `explain(q)` w `math-data.js` zwraca model kroków, `showExplain(host, model)` w `explain-ui.js` rysuje go w `#ctl` w miejscu odpowiedzi.
   - **Dodawanie:** dwie ramki dziesiątkowe (każda 2 × 5 pól). Najpierw `a` kropek w jednym kolorze, potem `b` kropek w drugim dochodzi po jednej: dopełniają pierwszą ramkę, reszta trafia do drugiej. Podpisy: „8 + 2 = 10”, „10 + 3 = 13”. Bez przejścia przez 10: jeden podpis.
   - **Odejmowanie:** `a` kropek, `b` z nich znika od końca; przy przejściu przez 10 dwa podpisy: „13 − 3 = 10”, „10 − 2 = 8”.
   - **Brakująca liczba:** oś liczbowa 0–20 ze skokami od `a` do 10 i od 10 do `s`, podpisane „+3”, „+2”; podpis „3 + 2 = 5”. Bez przejścia przez 10: jeden skok.
   - **Trzy liczby:** dwa podpisy po kolei: „7 + 5 = 12”, „12 − 4 = 8”.
   - Zwierzak mówi to samo liczbami: „8 i 2 to 10, i jeszcze 3. Razem 13.”
   - Pod spodem przycisk „Dalej” (`#explainOk`), aktywny po zakończeniu animacji (ok. 3 s). Przy `reduced()` i w testach stan końcowy od razu. Zastępuje dzisiejsze „Dobra odpowiedź to…” i sztywne czekanie.
4. **Kropki na kartach, tylko poziom 1:** pod cyfrą mała ramka z kropkami (do 5 w pierwszym rzędzie, reszta w drugim), ten sam obraz co w wyjaśnieniu. Kropki to puste elementy z `aria-hidden`, bo testy czytają `textContent` karty jako liczbę.

**Testy:**
- `puzzles.test.mjs`: `shieldOptions` zawiera wynik, odpowiedzi są różne i nieujemne, jest ich tyle, ile trzeba; `explain` dla wszystkich par w zakresie: części sumują się do `b`, ostatni podpis kończy się wynikiem, ramka nie ma więcej niż 20 kropek.
- `expedition.test.mjs`: zła odpowiedź na tarczy pokazuje `.explain`, `#explainOk` prowadzi do następnej tury, w statystykach jest `tag`.
- `layout.test.mjs`: panel wyjaśnienia mieści się na 360×640.

**Gotowe, gdy:** po każdej złej odpowiedzi na tarczy jest animacja i przycisk „Dalej”; karty poziomu 1 mają kropki; statystyki zapisują rodzaj pomyłki.

### Krok 2. Sowa: rama zagadek i „Kto gdzie mieszka”

**Cel:** pokój Sowy to jedna zagadka do układania; znikają dwa najsłabsze quizy.

**Pliki:** `src/puzzle-ui.js`, `src/puzzles/houses.js`, `src/puzzles/houses-ui.js`, `src/logic-room.js`, `src/logic-data.js` (usuń `genWho`, `genIf`, `IFS`, `CHAINS` i cechy zwierząt), `src/save.js`, `src/stats.js`, `src/content.js` (`levelFor`), testy, `tools/screenshots.mjs` (zrzut `sowa` czeka dziś na `.clues`).

**Rama:** rozdział 3. Po tym kroku rodzaje to `houses` i `patterns` (dzisiejsze „co dalej” i „co nie pasuje” jako dwa szybkie pytania przez `askChoice`, bez zmian).

**Zagadka `houses`** (klucz `logic.houses`, „Kto gdzie mieszka”):

- Domki w rzędzie i tyle samo zwierzaków w zasobniku. Dziecko ustawia zwierzaki w domkach.
- Wskazówki to żetony z obrazkiem i krótkim zdaniem:

  | Rodzaj | Żeton | Zdanie | Od poziomu |
  | --- | --- | --- | --- |
  | `at` | 🐱 → 🏠1 | „Kot mieszka w pierwszym domku.” (pierwszy, ostatni, środkowy) | 1 |
  | `next` | 🐱 ↔ 🐶 | „Kot mieszka obok psa.” | 1 |
  | `notAt` | 🦉 ✗ brzeg | „Sowa nie mieszka na brzegu.” | 2 |
  | `notNext` | 🐱 ✗ 🐶 | „Kot nie mieszka obok psa.” | 2 |
  | `left` | 🐱 ◀ 🐶 | „Kot mieszka gdzieś na lewo od psa.” | 3 |

- Poziom 1: 3 domki, 2 wskazówki. Poziom 2: 4 domki, 3 wskazówki. Poziom 3: 4 domki, 3–4 wskazówki, w tym co najmniej jedna `left` albo `notNext`.
- Generator: wylosuj ustawienie, zbierz wszystkie prawdziwe wskazówki dozwolone na poziomie, szukaj zestawu, dla którego spośród wszystkich ustawień (najwyżej 24) pasuje dokładnie jedno i żadna wskazówka nie jest zbędna (bez niej pasują co najmniej dwa). Najwyżej jedna wskazówka `at`.
- Sprawdzenie: każdy żeton dostaje ✓ albo ✗. Zwierzak mówi: „Dwie wskazówki się zgadzają, jedna jeszcze nie.”
- Gramatyka: zdania składaj z gotowych form (mianownik i dopełniacz każdego zwierzaka w danych), nie przez doklejanie końcówek.
- Zaczep: `ans` = tablica kluczy zwierzaków w kolejności domków.

**Usunięcia:** „Kto to zrobił?” i „Jeśli… to…” znikają z gry. Klucze `logic.who` i `logic.if` zostają w `SKILLS` z dopiskiem „(dawne)”. Test czytający wskazówki „Kto to zrobił?” z `puzzles.test.mjs` znika razem z generatorem.

**Pozostałe zmiany:** zapowiedź pokoju: „Skrzyni pilnuje Mądra Sowa. Przepuści nas, jeśli rozwiążemy jej zagadkę.” README: wiersz „Logika” w tabeli „Czego się uczy” i podpis zrzutu Sowy. `docs/DEVELOPERS.md`: `src/puzzles/` w tabeli struktury.

**Gotowe, gdy:** pełne wyprawy przechodzą na trzech poziomach w obu krainach; stary zapis wczytuje się bez utraty statystyk; mediana czasu pokoju Sowy w teście ręcznym nie przekracza 3 minut.

### Krok 3. „Płytki i klocki” (`logic.tiles`)

**Cel:** pierwsze zadania przestrzenne w grze.

Dwie odmiany, rysowane siatką CSS (nie canvasem):

1. **Załataj podłogę** (poziomy 1–3). Podłoga z płytek ma dziurę narysowaną jako jedna pusta plama **bez linii siatki**. Pytanie: „Ile płytek brakuje?”. Dziecko wpisuje liczbę (`numPad`) i sprawdza. Po sprawdzeniu płytki wlatują w dziurę i są liczone na głos. Za mało: zostaje widoczna luka. Za dużo: nadmiar leży obok. Dziecko widzi błąd, zamiast o nim przeczytać.
   - Poziom 1: podłoga 5×4 albo 6×4, dziura prostokątna, 4–9 płytek.
   - Poziom 2: dziura w kształcie L albo T (suma dwóch prostokątów), 6–12 płytek.
   - Poziom 3: podłoga w szachownicę, pytanie „Ile brakuje ciemnych płytek?”.
   - Dziura nie dotyka brzegu podłogi, więc każdy jej rząd i kolumnę da się odczytać z sąsiednich płytek.
2. **Który kawałek pasuje?** (poziomy 2–3). Kwadrat albo prostokąt z kratek rozcięty na dwie części; jedna jest pokazana, do wyboru 3–4 kawałki. Wybrany kawałek wsuwa się na miejsce: pasuje albo nachodzi i zostawia luki (podświetlone).
   - Poziom 2: kawałki w dobrym ułożeniu; błędne różnią się jedną kratką albo są odbiciem.
   - Poziom 3: właściwy kawałek jest obrócony o 90° albo 180°.

Poziom 1 losuje tylko odmianę 1, poziomy 2–3 obie.

**Testy generatora:** odpowiedź równa liczbie pól dziury; dziura spójna i wewnątrz podłogi; w odmianie 2 dokładnie jeden kawałek (z dozwolonymi obrotami) dopełnia kształt.

**Zaczep:** `ans` = liczba albo identyfikator kawałka.

**Odłożone:** budowla z klocków w trzech wymiarach (ukryte klocki). To inna umiejętność i dużo rysowania.

### Krok 4. „Piramida liczbowa” (`math.pyramid`)

**Cel:** liczenie połączone z wnioskowaniem; ćwiczy brakujący składnik.

- Każde pole to suma dwóch pól pod nim. Część pól jest dana, resztę dziecko wpisuje (dotknij pole, wpisz liczbę na `numPad`).
- Poziom 1: 3 rzędy (6 pól), 3 dane. W połowie zadań dany jest cały dolny rząd (samo dodawanie), w połowie jedno pole wymaga odejmowania. Liczby do 20.
- Poziom 2: 3 rzędy, 3 dane rozmieszczone tak, że potrzebne są 1–2 odejmowania. Liczby do 20.
- Poziom 3: 4 rzędy (10 pól), 4 dane. Liczby do 30.
- Generator: wylosuj dolny rząd, policz piramidę, wybierz pola dane. Przyjmij zadanie tylko wtedy, gdy da się je rozwiązać **krok po kroku**: w każdym kroku istnieje trójka (pole i dwa pod nim) z dokładnie jednym brakiem. Odrzuć układy wymagające dzielenia albo zgadywania (np. dane tylko szczyt i dwa skrajne pola dołu). Wszystkie wartości co najmniej 1.
- Sprawdzenie: trójki, które się nie sumują, robią się czerwone; zwierzak mówi jedną z nich: „3 i 4 to nie 8”.
- Zaczep: `ans` = lista `{ i, v }` dla pustych pól.

**Testy generatora:** rozwiązanie jedyne; rozwiązywalne propagacją; zakres liczb według poziomu.

### Krok 5. Zegar: cztery małe zmiany

**Pliki:** `src/time-data.js`, `src/time-rooms.js`, `src/chest-room.js`, `src/expedition.js` albo nowy `src/trip-guess.js`, `src/save.js`, `src/stats.js`, testy.

1. **Zegar z przekładnią.** W `setClock` zamiast trzech przycisków cztery: „◀ godzina” (`#tBack60`), „◀ pół” (`#tBack30`), „pół ▶” (`#tFwd30`), „godzina ▶” (`#tFwd60`). Stan to liczba minut. Obie wskazówki ruszają się razem: duża zatacza pół albo całe koło, mała płynnie idzie za nią (rysunek dogania stan w ok. 350 ms; przy `reduced()` i w testach od razu). Start 2–4 godziny od celu. Po nieudanym sprawdzeniu zwierzak nazywa to, co jest na zegarze: „Jest wpół do piątej, a ma być czwarta.” `cur()` w zaczepie dalej zwraca `{ h, m }`.
2. **Sama mała wskazówka** (`time.hour`, tylko poziom 1). `drawClock(c, h, m, { minute: false })`. Wskazówka stoi na godzinie, trochę za nią, w połowie albo tuż przed następną (0, 10, 30, 50 minut). Odpowiedzi słowami: „trzecia”, „trochę po trzeciej”, „wpół do czwartej”, „prawie czwarta”. Trzy odpowiedzi: dobra, ten sam zwrot z sąsiednią godziną, inny zwrot z tą samą godziną. Potrzebna tablica miejscownika („po pierwszej … po dwunastej”).
3. **Odpowiedzi słowami.** Poziom 1: napis to słowa („wpół do czwartej”). Poziom 2: słowa i mniejszym drukiem zapis 3:30. Poziom 3: zapis cyfrowy jak dziś. Klucz odpowiedzi `a` zostaje cyfrowy, żeby testy się nie zmieniały. Polecenie ustawiania: „Ustaw zegar na trzecią” / „na wpół do czwartej” (potrzebna tablica biernika: pierwszą … dwunastą).
4. **Zadania w wieży.** Poziom 1: sama mała wskazówka, ustawianie, odczytywanie albo „o której się skończy”. Poziomy 2–3: jak dziś. Zawsze trzy zadania.
5. **Zgadnij, ile potrwa wyprawa** (`time.guess`).
   - Po wyborze krainy, przed pierwszym pokojem: „Jak myślisz, ile potrwa ta wyprawa?” i przyciski „2 minuty”, „10 minut”, „godzinę” (poziomy 2–3 także „pół godziny”). To nie jest pokój: nie zmienia indeksów pokoi ani rozkładu run.
   - Przy skrzyni osobna karta nad przyciskiem powrotu (nie doklejaj do dymka, bo się nie zmieści): „Myślałaś, że 2 minuty. Wyprawa trwała 11 minut.” albo „Tak jak myślałaś: około 10 minut!”. Pod spodem dzisiejsze zdanie o piosenkach i nowe: „Godzina to tyle, co 5 takich wypraw.” (gdy wyprawa trwała co najmniej 3 minuty). Forma według płci bohatera (`gw`).
   - Trafienie = wybrana odpowiedź najbliższa prawdziwemu czasowi w skali logarytmicznej.
   - Nowe pole profilu `guessStreak` (liczba trafień z rzędu, 0–99). Pytaj, gdy `guessStreak < 3` albo co piątą wyprawę; inaczej pomiń, żeby nie męczyć stałym pytaniem.
   - Przerwana wyprawa niczego nie zapisuje.
   - `tests/helpers.mjs`: `go()` odpowiada na pytanie, jeśli się pojawi.

**Testy:** formy słowne godzin (mianownik, dopełniacz, miejscownik, biernik) dla 1–12; jedna dobra odpowiedź i brak powtórek w `genHourOnly`; przekładnia: po `n` krokach stan zgadza się z celem, wskazówka godzinowa dla 3:30 leży między 3 a 4; zdanie przy skrzyni dla trafienia, za krótko i za długo, obu płci; `guessStreak` w zapisie; karta przy skrzyni mieści się na 360×640.

### Krok 6. Ciągi liczbowe i figury rosnące

Rodzaj `patterns` dalej zadaje dwa szybkie pytania przez `askChoice`.

- **Ciąg liczbowy** (`math.count`, „Liczenie co 2, co 5…”): cztery liczby i pytajnik. Poziom 1: co 1 i co 2 w górę, co 1 w dół, do 20. Poziom 2: co 2, co 5, co 10 w górę, co 2 w dół, do 50. Poziom 3: co 3, co 4 w górę, co 3 i co 5 w dół, do 60. Błędne odpowiedzi: ostatnia + 1, ostatnia + inny skok, sama ostatnia.
- **Figura rosnąca** (`logic.grow`, „Rosnące figury”): trzy figury z kwadratów rysowane siatką CSS, pytanie „Z ilu kwadratów będzie następna?”. Poziom 2: wzrost stały (rząd: 1, 2, 3; litera L: 1, 3, 5; krzyżyk: 5, 9, 13). Poziom 3: schodki (1, 3, 6, 10) i kwadrat (1, 4, 9, 16). Po odpowiedzi gra rysuje czwartą figurę.
- Skład pary: poziom 1: „co nie pasuje” albo obrazkowe „co dalej”, do tego ciąg liczbowy. Poziom 2: ciąg liczbowy i figura rosnąca. Poziom 3: figura rosnąca i ciąg liczbowy.

**Testy generatora:** odpowiedź kontynuuje regułę; odpowiedzi różne; zakres według poziomu.

### Krok 7. Obrazkowe sudoku (`logic.sudoku`)

- Poziom 1: kratka 3×3, trzy ikony, 3 puste pola. Poziom 2: 4×4 bez kwadratów, 6–7 pustych. Poziom 3: 4×4 z kwadratami 2×2, 8 pustych.
- Dotknij puste pole, potem ikonę z palety. Dotknięcie pola wpisanego przez dziecko je czyści.
- Powtórki w rzędzie, kolumnie albo kwadracie podświetlają się **dopiero po „Sprawdź”**, nie w trakcie; inaczej dziecko wstawia ikony na ślepo, aż zniknie czerwień.
- Generator: wylosuj pełną kratkę, usuwaj pola, dopóki zadanie ma jedno rozwiązanie **i** da się je rozwiązać samymi pewnymi ruchami (zawsze istnieje puste pole z jednym kandydatem).
- Ikony z zestawów w `THEMES`.
- Zaczep: `ans` = lista `{ r, c, v }`.

### Krok 8. „Dwa mosty” (`logic.bridges`)

**Cel:** odkrywanie reguły próbami. Bez czytania.

- Stworki rysowane w CSS różnią się cechami: kolor (czerwony, niebieski, żółty), kształt (okrągły, kwadratowy, trójkątny), od poziomu 3 także czapka. Na ekranie 8 stworków (poziom 3: 10), bez dwóch jednakowych.
- Lewy most przepuszcza stworki spełniające ukrytą regułę, prawy pozostałe.
  - Poziom 1: jedna wartość jednej cechy („czerwone”); stworki różnią się tą cechą i jedną dodatkową.
  - Poziom 2: „wszystkie oprócz niebieskich” albo jedna wartość przy dwóch zmiennych cechach.
  - Poziom 3: dwie cechy naraz („czerwone w czapce”).
- Dotknij stworka, potem most. Przyjęty przechodzi i staje za swoim mostem (przykłady zostają widoczne). Odrzucony wraca ze znaczkiem mostu, który go nie chciał.
- Próby: trzy pomyłki są darmowe. Czwarta: `hurt()`, zwierzak zdradza regułę, reszta stworków przechodzi sama.
- Po sukcesie zwierzak nazywa regułę: „Lewy most przepuszczał tylko czerwone!”. Najpierw odkrycie, potem nazwa.
- `ok` w statystykach: najwyżej dwie pomyłki (pierwszy ruch jest zawsze zgadywaniem).
- Generator: co najmniej trzy stworki na każdy most; wśród reguł dozwolonych na poziomie dokładnie jedna zgadza się z całym podziałem.
- Zaczep: `ans` = mapa identyfikator stworka → most.

### Krok 9. „Waga” (`math.scale`) i „Znaki” (`math.signs`)

**Waga** to obraz równania.

- Na lewej szalce jednakowe przedmioty, na prawej odważnik z liczbą. Pytanie: „Ile waży jedno jabłko?”.
- Poziom 1: dwa jednakowe (A + A = 4…12) albo przedmiot i znany odważnik (A + 3 = 9). Poziom 2: trzy albo cztery jednakowe, wynik do 20. Poziom 3: dwie wagi: A + A = 10 i A + B = 12, pytanie o B.
- Dziecko wpisuje liczbę i naciska „Zważ”. Belka przechyla się w stronę cięższej szalki; zwierzak liczy: „Trzy jabłka po 3 to 9. Za mało.” Dochodzi się rozumowaniem albo porządnym próbowaniem.
- Próby: cztery ważenia bez kary, piąte nieudane kosztuje serduszko i pokazuje wynik. `ok`: najwyżej dwa ważenia.

**Znaki:** `a □ b □ c = wynik`. Dotknięcie pola przełącza +, − i puste.

- Poziom 1: dwa pola, liczby do 10. Poziom 2: dwa pola, do 20. Poziom 3: trzy pola.
- Generator: dokładnie jedno ustawienie znaków daje wynik; w rozwiązaniu żaden wynik pośredni nie jest ujemny.
- Zasada prób standardowa. Po nieudanym sprawdzeniu gra pokazuje, ile wychodzi z ustawionych znaków: „5 + 3 − 2 to 6, a ma być 4”.

### Krok 10. Zegar: dokręcanie czasu i plan dnia

Przed tym krokiem zapytaj rodzica o obserwacje z Gór (trzy pytania z karty „Mechanika zagadek”); mogą zmienić zakres.

1. **„O której się skończy” na zegarze.** Zamiast wyboru odpowiedzi dziecko dokręca zegar z przekładnią od godziny startu o czas trwania. Pod zegarem pasek z odcinkami po pół godziny wypełnia się w trakcie. Poziom 1: godzina. Poziom 2: 1–3 godziny. Poziom 3: także połówki. Klucz `time.elapsed` bez zmian.
2. **Plan dnia** (`time.day`). Trzy (poziom 1) albo cztery wydarzenia dnia, każde z obrazkiem, zegarem i ikoną pory (rano, południe, wieczór, noc). Dziecko ustawia je na osi od rana do nocy na dwa dotknięcia. Ikona pory rozstrzyga, czy 7 to rano, czy wieczór. Poziom 1: pełne godziny, poziomy 2–3: także połówki. Losowany jako jedno z zadań kamienia czasu.

## 5. Po każdym kroku

1. `npm test` przechodzi w całości; każda nowa rzecz ma test.
2. Przegląd kodu: bezpieczeństwo (HTML tylko przez `esc`), błędy (`left(run)` po każdym `await`, stany po wyjściu z wyprawy), wydajność, cztery rozmiary ekranu.
3. Wersja w `package.json`: krok 1 to 0.5.0, każdy następny podnosi drugą liczbę.
4. Jeśli zmienił się wygląd: `npm run screenshots`; zaktualizuj tabelę „Czego się uczy” w README i tabelę struktury w `docs/DEVELOPERS.md`.
5. Zatwierdź razem z `dist/` i wypchnij na `main`.
6. Opublikuj `dist/index.html` pod dotychczasowym adresem gry, bez zmiany uprawnień strony.
7. W dokumencie z planem: oznacz krok jako zrobiony w karcie „Mechanika zagadek”; popraw stany w karcie „Podstawa programowa” (po kroku 3: figury i orientacja; po kroku 6: 5.1.4 liczenie co 2, co 5).
8. Raport dla rodzica: co się zmieniło i na co patrzeć, gdy dziecko gra.

## 6. Poza tym planem

- Zadania z treścią (osobny pokój, osobna decyzja).
- Rośliny rosnące w prawdziwym czasie: tylko razem z limitem czasu z Etapu 3, liczone w czasie aktywnej gry.
- Gra strategiczna z Sową (kamyki).
- Budowla z klocków w trzech wymiarach.
- Dobór zagadek pod dziecko i powtarzanie działań, na których się myli: Etap 3, korzysta ze statystyk zbieranych przez ten plan.
- Przegląd zadań konkursu Bóbr dla klas 1–3 (strona nie otworzyła się przy przeglądzie).
