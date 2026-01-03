# 💳 PSP - Payment Service Provider 

Ovaj projekat predstavlja implementaciju sistema pružaoca usluga plaćanja (PSP) koji omogućava sigurnu transakciju između WebShop-a (Rent-A-Car agencije) i bankarskog servisa (Acquirer).

### 👥 Članovi tima:
* **Aleksandar Sekulić**
* **Mihajlo Bogdanović**

---

## 🚀 Pregled Sistema
Sistem je zasnovan na **mikroservisnoj arhitekturi** i omogućava kompletan tok plaćanja platnim karticama (Visa, Mastercard) uz poštovanje strogih bezbednosnih protokola.

### Ključne komponente:
* **API Gateway (Port 8080):** Centralna tačka ulaza koja upravlja rutiranjem i CORS polisama.
* **Core Service (Port 8081):** Jezgro sistema koje upravlja transakcijama, čuva podatke u PostgreSQL bazi i komunicira sa bankom.
* **Bank Service (Port 8082):** Simulacija bankarskog sistema (Acquirer) koja vrši validaciju kartica i rezervaciju sredstava.
* **Angular Frontend (Port 4200):** Korisnički interfejs za pregled istorije transakcija i formu za siguran unos podataka o kartici.

---

## 🛠️ Tehničke Funkcionalnosti (Implementirano prema specifikaciji)

### 1. Inicijalizacija i Audit Trail
* **Inicijalizacija:** Prihvatanje podataka od WebShop-a (Merchant ID, Password, Amount, Currency).
* **Praćenje:** Generisanje jedinstvenog **STAN** (System Trace Audit Number) i timestamp-a za svaku transakciju radi revizije.

### 2. Bezbednost i Validacija (Tačka 4.a)
* **Luhn Check:** Algoritamska provera ispravnosti broja kartice (PAN).
* **MM/YY & CVV:** Validacija roka važenja i trocifrenog sigurnosnog koda.
* **Anti-Fraud Lock:** Implementiran mehanizam koji dozvoljava samo jedan pokušaj plaćanja po formi, sprečavajući duple naplate.
* **Limit Sredstava:** Simulirana provera raspoloživosti novca na računu kupca (limit 20.000 RSD).

### 3. Webhook i Odgovor Banke (Tačka 5 i 6)
* **Asinhrono Ažuriranje:** Banka putem Webhook-a javlja status (`PAID` ili `FAILED`) direktno Core servisu.
* **Dokaz o naplati:** Čuvanje bankarskih meta-podataka: `GLOBAL_TRANSACTION_ID` i `ACQUIRER_TIMESTAMP`.
* **Redirekcija:** Automatski povratak korisnika na WebShop nakon završene obrade.

---

## 📊 Dijagram Toka


---

## 🖥️ Pregled Interfejsa

* **Istorija Transakcija:** Pregled svih pokušaja plaćanja sa statusima u realnom vremenu.
* **Detaljni modal:** Duboki uvid u podatke dobijene od banke za svaku pojedinačnu naplatu.
* **Razlozi Odbijanja:** Jasna indikacija greške kod neuspešnih plaćanja (npr. `INVALID_CVV` ili `CARD_EXPIRED`).

---

## ⚙️ Tehnologije
* **Backend:** Java 21, Spring Boot 3.4.1, Spring Data JPA.
* **Frontend:** Angular 18+, TypeScript, HTML/CSS.
* **Baza podataka:** PostgreSQL.
* **Komunikacija:** REST API, RestTemplate.

---

## 🚀 Pokretanje Projekta

1. **Baza podataka:** Kreirati PostgreSQL bazu pod nazivom `psp_bank_db`.
2. **Backend:** Pokrenuti `api-gateway`, `core-service` i `bank-service` koristeći `./mvnw spring-boot:run`.
3. **Frontend:** Pokrenuti Angular aplikaciju komandom `npm start` ili `ng serve`.

---

**Napomena:** Za potrebe testiranja, svi računi kupaca i prodavaca se posmatraju unutar iste (Acquirer) banke, u skladu sa napomenom u specifikaciji.

---

## 🧪 Scenario za Testiranje (Demo)

Za potrebe odbrane rada, preporučuje se korišćenje sledećih scenarija kako bi se demonstrirale sve implementirane validacije:

### 1. Uspešno Plaćanje (Status: PAID)
* **Kartica:** `4556 1234 5678 9012` (Visa)
* **Datum:** `12/26` (Bilo koji budući datum)
* **CVV:** `123`
* **Iznos:** `< 20.000 RSD`
* **Očekivani ishod:** Status se menja u **PAID**, generiše se Global ID i vrši se redirekcija na Success URL.

### 2. Neuspešno Plaćanje - Pogrešan CVV (Status: FAILED)
* **CVV:** `12` (Manje od 3 cifre) ili bilo koji neispravan broj.
* **Očekivani ishod:** Poruka "Neispravan CVV", status **FAILED** u bazi uz razlog `INVALID_CVV`.

### 3. Neuspešno Plaćanje - Istekla Kartica (Status: FAILED)
* **Datum:** `01/22` (Prošlost)
* **Očekivani ishod:** Poruka "Kartica je istekla", status **FAILED** uz razlog `CARD_EXPIRED`.

### 4. Neuspešno Plaćanje - Limit Sredstava (Status: FAILED)
* **Iznos:** Uneti preko `20.000 RSD` pri inicijalizaciji.
* **Očekivani ishod:** Status **FAILED** uz razlog `INSUFFICIENT_FUNDS`.