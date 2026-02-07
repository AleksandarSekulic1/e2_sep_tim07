
Test provere maskiranja broja kartice (PAN se nikad ne loguje ceo, prikazuje se samo prvih 6 i poslednjih 4 cifre):
docker compose logs bank-service --tail 100 | Select-String -Pattern "PAN|mask|card"
Potvrda: U logovima se vidi maskiran PAN (npr. 411111******1111), nikad pun broj.

Test provere da li ima CVV u bazi (CVV se ne sme čuvati nigde, polje je @Transient):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT * FROM transactions LIMIT 1;"
Potvrda: U tabeli transactions nema kolone za CVV. CVV se koristi samo za validaciju i odmah odbacuje.

Test provere hashovanja lozinke (merchant password se čuva kao SHA-256 hash sa salt-om, nikad plaintext):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT merchant_id, merchant_password, is_locked, failed_auth_attempts FROM merchants;"
Potvrda: U koloni merchant_password se vidi hash (dug string), ne plaintext lozinka.

Test provere AES-256-GCM enkripcije osetljivih podataka (koristi se EncryptionService za podatke at rest):
docker compose logs core-service --tail 200 | Select-String -Pattern "encrypt|decrypt|AES|GCM"
Potvrda: U logovima se vide zapisi o enkripciji/dekripciji. Konfiguracija: pci.encryption.algorithm=AES/GCM/NoPadding.

Test provere da se osetljivi podaci ne loguju (SensitiveDataSanitizer briše CVV pattern i maskira PAN u logovima):
docker compose logs core-service --tail 200 | Select-String -Pattern "\b\d{13,19}\b"
Potvrda: Nema punog broja kartice u logovima. SensitiveDataSanitizer maskira sve PAN-ove i briše CVV-like paterne.

Test provere HTTPS komunikacije (TLS 1.2+ je obavezan, HTTP se redirectuje na HTTPS):
curl -vk https://localhost/health 2>&1 | Select-String -Pattern "TLS|SSL|subject"
Potvrda: Vidi se TLSv1.2 ili TLSv1.3 u ispisu. Sertifikat koristi 4096-bit RSA.

Test provere HTTP->HTTPS redirecta:
curl -v http://localhost/api/core/actuator/health 2>&1 | Select-String -Pattern "301|Location|https"
Potvrda: HTTP zahtev vraca 301 redirect na HTTPS.

Test provere HSTS headera (Strict-Transport-Security):
curl -skI https://localhost/health | Select-String -Pattern "Strict-Transport|X-Frame|X-Content|X-XSS|Content-Security"
Potvrda: Vidis HSTS (max-age=31536000), X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff, X-XSS-Protection: 1; mode=block, Content-Security-Policy.

Test provere RBAC kontrole pristupa (admin endpointi zahtevaju ROLE_ADMIN, merchant endpointi ROLE_MERCHANT):
curl -sk https://localhost/api/core/admin/audit-logs
Potvrda: Vraca 401 Unauthorized ili 403 Forbidden bez tokena. Admin endpointi su zasticeni.

Test provere JWT autentikacije (pristup bez tokena je odbijen):
curl -sk https://localhost/api/core/transactions
Potvrda: Vraca 401 Unauthorized. Potreban je Bearer JWT token.

Test provere merchant autentikacije (X-Merchant-Id i X-Merchant-Password headeri):
curl -sk -H "X-Merchant-Id: nepostojeci" -H "X-Merchant-Password: pogresna" https://localhost/api/core/transactions
Potvrda: Vraca 401. Nevalidni kredencijali su odbijeni, failed_auth_attempts raste.

Test provere zakljucavanja naloga posle 6 neuspesnih pokusaja (account lockout na 30 minuta):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT merchant_id, is_locked, failed_auth_attempts, locked_until FROM merchants;"
Potvrda: Posle 6 pogresnih pokusaja is_locked=true i locked_until pokazuje vreme do kada je zakljucan (30 min).

Test provere Luhn validacije PAN broja (nevazeci broj kartice se odbija):
docker compose logs bank-service --tail 100 | Select-String -Pattern "Luhn|invalid|validation"
Potvrda: Nevazeci PAN (ne prolazi Luhn) se odbija sa odgovarajucom greskom.

Test provere validacije datuma isteka kartice (MM/YY format, provereno da nije istekla):
docker compose logs bank-service --tail 100 | Select-String -Pattern "expir|MM/YY|invalid"
Potvrda: Istekla kartica se odbija. Format mora biti MM/YY.


Test za proveru sesije (payment sesija traje 15 min, jednokratna, sa unique tokenom od 64 karaktera):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT session_token, transaction_id, merchant_id, amount, currency, payment_method, status, expires_at, is_used FROM payment_sessions ORDER BY created_at DESC LIMIT 5;"
Potvrda: Sesije imaju status (ACTIVE/USED/EXPIRED/CANCELLED/BLOCKED), expires_at (15 min od kreiranja), is_used flag (jednokratna upotreba).

Test provere audit logova (svaki pristup i akcija se loguje sa: ko, sta, kada, odakle, IP adresa):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT action_type, actor, outcome, ip_address, timestamp, resource_type, http_method, endpoint FROM audit_logs ORDER BY timestamp DESC LIMIT 10;"
Potvrda: Svaka akcija ima action_type, actor (ko), outcome (SUCCESS/FAILURE), ip_address, timestamp, endpoint. Pokriva: login, logout, card_data_access, transaction_create, merchant_auth, security_event.

Test provere brute-force detekcije po IP adresi (blokira posle 5 neuspelih pokusaja sa iste IP adrese u 15 min):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT ip_address, action_type, outcome, COUNT(*) FROM audit_logs WHERE outcome='FAILURE' GROUP BY ip_address, action_type, outcome ORDER BY COUNT(*) DESC LIMIT 5;"
Potvrda: Sistem detektuje visestruke neuspesne pokusaje sa iste IP adrese i blokira pristup.

Test provere blokiranja payment sesije posle 5 neuspelih pokusaja placanja:
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT session_token, status, failed_attempts FROM payment_sessions WHERE failed_attempts > 0 ORDER BY failed_attempts DESC LIMIT 5;"
Potvrda: Posle 5 neuspelih pokusaja placanja, sesija dobija status BLOCKED.

Test provere AOP audit aspekta (automatsko logovanje svih poziva kontrolera i servisa sa trajanjem):
docker compose logs core-service --tail 200 | Select-String -Pattern "AuditAspect|audit|duration"
Potvrda: Svaki poziv kontrolera/servisa se automatski loguje sa argumentima (maskirani PAN-ovi) i trajanjem izvrsavanja.

Test provere retencije audit logova (podesen retention od 365 dana):
docker compose logs core-service --tail 200 | Select-String -Pattern "retention|audit.retention"
Potvrda: audit.retention-days=365 u konfiguraciji.