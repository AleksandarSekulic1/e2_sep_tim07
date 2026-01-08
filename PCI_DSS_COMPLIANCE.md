Test provere maskiranja broja kartice:
docker compose logs bank-service --tail 100 | Select-String -Pattern "PAN|mask|card"
Test provere maskiranja sifre:
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT merchant_id, merchant_password, is_locked, failed_auth_attempts FROM merchants;"
Test provere da li ima CVV:
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT * FROM transactions LIMIT 1;"
Test za proveru sesije:
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "SELECT session_token, transaction_id, merchant_id, amount, currency, payment_method, status, expires_at, is_used FROM payment_sessions ORDER BY created_at DESC LIMIT 5;"