VISOKA DOSTUPNOST I SKALIRANJE PSP SISTEMA
==============================================

Zahtev iz specifikacije:
- "PSP treba da ima arhitekturu koja podržava visoku dostupnost"
- "High-availability arhitektura podržava jednostavno skaliranje sistema"
- "Ceo sistem je neophodno pokrenuti na minimum 2 računara ili na cloud-u"
- "Komunikacija HTTPS-om ili nekim drugim secure protokolom je obavezna"

Šta je implementirano:
- Nginx Load Balancer sa HTTPS (TLS 1.2+) terminacijom
- Skaliranje servisa (više instanci core, bank, card servisa)
- Failover (pad jedne instance ne ruši sistem)
- PostgreSQL Primary-Replica replikacija baze
- Docker Swarm multi-host deployment (2 računara)
- IPsec šifrovana overlay mreža između računara
- Swarm mutual TLS za management traffic

Fajlovi:
- docker/docker-compose-ha.yml        (HA na jednom hostu, za lokalni dev/test)
- docker/docker-compose-swarm.yml     (multi-host na 2 računara, za produkciju)
- docker/nginx-ha.conf                (Nginx za lokalni HA)
- docker/nginx-swarm.conf             (Nginx za Swarm multi-host)
- docker/deploy-ha.sh                 (skripta za lokalni HA)
- docker/deploy-swarm.sh              (skripta za multi-host deploy)

================================================================
DEO A: LOKALNI HA TEST (1 računar, docker-compose)
================================================================

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

================================================================
DEO B: MULTI-HOST (2 računara, Docker Swarm)
================================================================

Potrebna su 2 računara (ili 2 VM-a u cloud-u). Prvi je Manager, drugi je Worker.
Docker mora biti instaliran na oba računara.

1. Očisti sve staro (da test bude validan) – na Manager računaru:
docker stack rm psp

2. Pokreni multi-host sistem (2 računara):

Manager (Računar 1):
cd docker/
bash deploy-swarm.sh init
(Skripta će ispisati TOKEN i komandu za Worker.)

Worker (Računar 2):
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

Manager (Računar 1):
bash deploy-swarm.sh deploy
(Sačekaj oko 60 sekundi da se svi Java servisi i baze podignu pre testiranja.)

3. KOMANDE ZA TESTIRANJE
Otvori dva terminala (jedan za praćenje, drugi za kucanje komandi) i Web Browser.

TEST 1: Multi-host raspodela
Cilj: Da vidiš da se servisi izvršavaju na oba računara.
Terminal 1 (Manager):
docker node ls
docker stack ps psp --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}"

Potvrda: U listi moraš videti da su DB servisi na Manager node-u, a microservices na Worker node-u.

TEST 2: Skaliranje (Load Balancing)
Cilj: Da vidiš da se zahtevi raspoređuju na više replika.
Terminal 1 (Manager):
docker service logs psp_core-service -f
Browser: Otvori https://<MANAGER_IP>/api/core/actuator/health i uradi Hard Refresh (CTRL + F5) 10 puta brzo.

Potvrda: U logovima se pojavljuju zahtevi na više replika (različiti task IDs).

TEST 3: Visoka dostupnost (Failover)
Cilj: Da ugasiš jednu instancu, a da sistem i dalje radi.
Terminal 2 (Manager):
docker service scale psp_core-service=1
Browser: Odmah osveži health link.

Potvrda: Stranica se učitava bez greške (200 OK). Nginx prebacuje na preostalu instancu.

TEST 4: Replikacija Baze (Data HA)
Cilj: Upišeš u glavnu bazu -> Pojavi se u rezervnoj (na drugom računaru).
Terminal 2 (Manager) – upis u Primarnu bazu:
docker exec $(docker ps -q -f name=psp_psp-core-db-primary) psql -U postgres -d psp_core_db -c "CREATE TABLE IF NOT EXISTS test_ha (info text); INSERT INTO test_ha (info) VALUES ('REPLIKACIJA RADI');"
Terminal 2 (Worker) – čitanje iz Replike:
docker exec $(docker ps -q -f name=psp_psp-core-db-replica) psql -U postgres -d psp_core_db -c "SELECT * FROM test_ha;"
Potvrda: Moraš videti ispis: REPLIKACIJA RADI.

================================================================
BEZBEDNOST KOMUNIKACIJE - Šta pokriva svaki sloj
================================================================

Korisnik -> Nginx                    = HTTPS (TLS 1.2/1.3)
Nginx -> Microservices (inter-node)  = IPsec encrypted overlay
Microservice -> Database             = IPsec encrypted overlay
Microservice -> RabbitMQ             = IPsec encrypted overlay
Swarm management traffic             = Mutual TLS (built-in)
DB Primary -> Replica                = IPsec encrypted overlay