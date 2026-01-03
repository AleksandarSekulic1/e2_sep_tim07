# 💳 PSP - Payment Service Provider 

Ovaj projekat predstavlja implementaciju sistema pružaoca usluga plaćanja (PSP) koji omogućava sigurnu transakciju između WebShop-a (Rent-A-Car agencije) i bankarskog servisa.

### 👥 Članovi tima:
* **Aleksandar Sekulić**
* **Mihajlo Bogdanović**

---

## 🚀 Pregled Sistema
Sistem je zasnovan na **mikroservisnoj arhitekturi** i podržava dva asinhrona toka plaćanja: platnim karticama i NBS IPS QR kodom.

### Ključne komponente:
* **API Gateway (Port 8080):** Centralna tačka ulaza koja upravlja rutiranjem i CORS polisama.
* **Core Service (Port 8081):** Upravlja transakcijama, generiše **STAN** i čuva audit trail u bazi.
* **Bank Service (Port 8082):** Simulacija bankarskog sistema za validaciju kartica.
* **Mobile mBanking App (Android):** Izvorni simulator mobilnog bankarstva za skeniranje QR kodova.
* **Angular Frontend (Port 4200):** Korisnički interfejs sa polling mehanizmom za praćenje statusa transakcija.

---

## 🛠️ Implementirane Metode Plaćanja (KT 1)

### 1. Plaćanje Platnim Karticama (Card Plug-in)
* **Validacija:** Luhn check, provera datuma isteka i CVV koda.
* **Bezbednost:** Anti-fraud mehanizam (jedan pokušaj po formi).
* **Webhook:** Asinhrono ažuriranje statusa (`PAID`/`FAILED`) nakon potvrde iz banke.

### 2. Plaćanje QR Kodom (NBS IPS Standard)
* **IPS Generator:** Kreiranje validnog NBS stringa (`K:PR|V:01...`) sa podacima prodavca i iznosom.
* **Polling Mehanizam:** Frontend automatski proverava status transakcije svake 3 sekunde dok ne dobije potvrdu.
* **Mobile Simulator:** Android aplikacija koja skenira kod, dekodira podatke i autorizuje uplatu direktno na backendu.

---

## 📊 Dijagram Toka (QR Plaćanje)



---

## 🖥️ Pregled Interfejsa i Audit Trail
* **Real-time Monitoring:** Svaka transakcija (Card ili QR) dobija `GLOBAL_TRANSACTION_ID` i `ACQUIRER_TIMESTAMP` kao dokaz o naplati.
* **Validacija Standarda:** Prikaz sirovog IPS stringa ispod QR koda kao dokaz usklađenosti sa NBS standardima.

---

## ⚙️ Tehnologije
* **Backend:** Java 21, Spring Boot 3.4.1.
* **Frontend:** Angular 18+, TypeScript.
* **Mobile:** Kotlin, Android SDK (API 30+), ZXing skener.
* **Baza podataka:** PostgreSQL.

---

## 🚀 Pokretanje Projekta

1. **Backend:** Pokrenuti servise u `psp-services` folderu.
2. **Frontend:** Pokrenuti Angular iz `web-shop` foldera (`npm start`).
3. **Mobile:** Otvoriti `mobile-bank-app` u Android Studiju, podesiti lokalnu IP adresu u `MainActivity.kt` i pokrenuti na fizičkom uređaju.

---

## 🧪 Scenario za Testiranje (QR Demo)

1. Inicijalizovati QR plaćanje na WebShop-u.
2. Pokrenuti **MobileBankSim** na telefonu.
3. Skenirati kod sa ekrana računara.
4. **Očekivani ishod:** Mobilna aplikacija ispisuje "Plaćeno!", a WebShop se automatski osvežava i prikazuje uspeh transakcije.