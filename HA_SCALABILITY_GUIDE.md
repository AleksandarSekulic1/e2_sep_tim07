1. Očisti sve staro (da test bude validan):
docker-compose -f docker-compose-ha.yml down -v

2. Pokreni skalirani sistem (3 instance Core servisa):
docker-compose -f docker-compose-ha.yml up -d --scale core-service=3
(Sačekaj oko 60 sekundi da se svi Java servisi i baze podignu pre testiranja).

3. KOMANDE ZA TESTIRANJE
Otvori dva terminala (jedan za praćenje, drugi za kucanje komandi) i Web Browser.

TEST 1: Skaliranje (Load Balancing)
Cilj: Da vidiš da se IP adrese (Upstream) menjaju (12, 17, 18...).
Terminal 1 (pokreni ovo i gledaj):
docker logs -f nginx-lb
Browser: Otvori https://localhost/api/core/actuator/health i uradi Hard Refresh (CTRL + F5) 10 puta brzo.

Potvrda: U terminalu 1 gledaj kraj redova. Moraš videti različite IP adrese (npr. Upstream: 172.18.0.12, pa 172.18.0.15).

TEST 2: Visoka dostupnost (Failover)
Cilj: Da ugasiš jedan server, a da sajt i dalje radi.
Terminal 2 (kucaj ovo):
docker stop docker-core-service-1
Browser: Odmah osveži stranicu Web Shop-a ili health link.
Potvrda: Stranica se učitava bez greške (200 OK). Nginx je prebacio na preostale 2 instance.

TEST 3: Replikacija Baze (Data HA)
Cilj: Upišeš u glavnu bazu -> Pojavi se u rezervnoj.
Terminal 2 (Upiši podatak u Primarnu bazu):
docker exec -it psp-core-db-primary psql -U postgres -d psp_core_db -c "CREATE TABLE IF NOT EXISTS test_ha (info text); INSERT INTO test_ha (info) VALUES ('REPLIKACIJA RADI');"
Terminal 2 (Pročitaj iz Replike):
docker exec -it psp-core-db-replica psql -U postgres -d psp_core_db -c "SELECT * FROM test_ha;"
Potvrda: Moraš videti ispis: REPLIKACIJA RADI.