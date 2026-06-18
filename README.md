# 💳 PSP - Payment Service Provider

This project implements a Payment Service Provider (PSP) system that enables secure transactions between a WebShop (Rent-A-Car agency) and a banking service.

### 👥 Team Members

* **Aleksandar Sekulić**
* **Mihajlo Bogdanović**

---

## 🚀 System Overview

The system is based on a **microservices architecture** and supports two asynchronous payment flows: card payments and NBS IPS QR code payments.

### Key Components

* **API Gateway (Port 8080):** Central entry point responsible for request routing and CORS policy management.
* **Core Service (Port 8081):** Handles transaction processing, generates **STAN** values, and maintains an audit trail in the database.
* **Bank Service (Port 8082):** Simulated banking system used for card validation and payment authorization.
* **Mobile mBanking App (Android):** Native mobile banking simulator used for QR code scanning and payment authorization.
* **Angular Frontend (Port 4200):** User interface featuring a polling mechanism for real-time transaction status tracking.

---

## 🛠️ Implemented Payment Methods (KT 1)

### 1. Card Payment (Card Plug-in)

* **Validation:** Luhn algorithm validation, card expiration date verification, and CVV validation.
* **Security:** Anti-fraud protection mechanism (single payment attempt per form submission).
* **Webhook Integration:** Asynchronous status updates (`PAID` / `FAILED`) after bank confirmation.

### 2. QR Code Payment (NBS IPS Standard)

* **IPS Generator:** Creates a valid NBS IPS payment string (`K:PR|V:01...`) containing merchant and payment details.
* **Polling Mechanism:** The frontend automatically checks the transaction status every 3 seconds until a final response is received.
* **Mobile Simulator:** Android application that scans the QR code, decodes the payment data, and authorizes the transaction directly through the backend.

---

## 📊 Payment Flow Diagram (QR Payment)

*Diagram to be inserted here.*

---

## 🖥️ User Interface & Audit Trail

* **Real-Time Monitoring:** Every transaction (Card or QR) is assigned a `GLOBAL_TRANSACTION_ID` and an `ACQUIRER_TIMESTAMP` as proof of payment processing.
* **Standards Compliance Validation:** The raw IPS payment string is displayed below the QR code as evidence of compliance with NBS IPS standards.

---

## ⚙️ Technologies

* **Backend:** Java 21, Spring Boot 3.4.1
* **Frontend:** Angular 18+, TypeScript
* **Mobile:** Kotlin, Android SDK (API 30+), ZXing Scanner
* **Database:** PostgreSQL

---

## 🚀 Running the Project

1. **Backend:** Start all services located in the `psp-services` directory.
2. **Frontend:** Run the Angular application from the `web-shop` directory using `npm start`.
3. **Mobile:** Open `mobile-bank-app` in Android Studio, configure the local IP address in `MainActivity.kt`, and deploy the application to a physical Android device.

---

## 🧪 Test Scenario (QR Payment Demo)

1. Initiate a QR payment from the WebShop.
2. Launch **MobileBankSim** on a mobile device.
3. Scan the QR code displayed on the computer screen.
4. **Expected Result:** The mobile application displays **"Payment Successful!"**, and the WebShop automatically refreshes to show a successful transaction status.
