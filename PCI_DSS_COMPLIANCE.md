
Test provere maskiranja broja kartice (PAN se nikad ne loguje ceo, prikazuje se samo prvih 6 i poslednjih 4 cifre):
docker compose logs bank-service --tail 100 | Select-String -Pattern "PAN|mask|card"
Potvrda: U logovima se vidi maskiran PAN (npr. 411111******1111), nikad pun broj.

Test provere da li ima CVV u bazi (CVV se ne sme čuvati nigde, polje je @Transient):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT * FROM transactions LIMIT 1;"
Potvrda: U tabeli transactions nema kolone za CVV. CVV se koristi samo za validaciju i odmah odbacuje.

Test provere hashovanja lozinke (merchant password se čuva kao SHA-256 hash sa salt-om, nikad plaintext):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT merchant_id, merchant_password, is_locked, failed_auth_attempts FROM merchants;"
Potvrda: U koloni merchant_password se vidi hash (dug string), ne plaintext lozinka.

Test provere HTTPS komunikacije (TLS 1.2+ je obavezan, HTTP se redirectuje na HTTPS):
curl.exe -vk https://localhost/health
curl.exe -vk --tlsv1.2 https://localhost/health
Potvrda: TLS 1.2 poziv prolazi (minimum). U -v ispisu vidi se subject sertifikata.

Test provere HTTP->HTTPS redirecta:
curl.exe -v http://localhost/api/core/test 2>&1 | Select-String -Pattern "301|Location|https"
Potvrda: HTTP zahtev vraca 301 redirect na HTTPS.



