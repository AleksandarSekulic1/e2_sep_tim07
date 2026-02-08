VISOKA DOSTUPNOST I SKALIRANJE PSP SISTEMA
==============================================
================================================================
DEO A: LOKALNI HA TEST (1 računar, docker-compose)
================================================================

1. Očisti sve staro (da test bude validan):
docker-compose -f docker-compose-ha.yml down -v

2. Pokreni skalirani sistem (3 instance Core servisa):
a)docker compose -f docker-compose-ha.yml up -d 
b)docker-compose -f docker-compose-ha.yml up -d --scale core-service=3
(Sačekaj oko 60 sekundi da se svi Java servisi i baze podignu pre testiranja).

3. KOMANDE ZA TESTIRANJE
Otvori dva terminala (jedan za praćenje, drugi za kucanje komandi) i Web Browser.

TEST 1: Skaliranje (Load Balancing)
Cilj: Da vidiš da se IP adrese (Upstream) menjaju (12, 17, 18...).
Terminal 1 (pokreni ovo i gledaj):
docker logs -f nginx-lb
Browser: Otvori https://localhost/api/core/test i uradi Hard Refresh (CTRL + F5) 10 puta brzo.

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
DEO B: MULTI-HOST (2 nodea, Docker Swarm)
================================================================

Specifikacija: "Ceo sistem je neophodno pokrenuti na minimum 2 računara ili na cloud-u"

OPCIJA 1: PLAY WITH DOCKER (cloud, besplatno, u browseru)
----------------------------------------------------------
Najlakši način za demo. Sajt daje besplatne Linux Docker nodove.

1. Otvori https://labs.play-with-docker.com/ i uloguj se sa Docker Hub nalogom.
   (Ako nemaš nalog, napravi besplatno na https://hub.docker.com/signup)

2. Klikni "Add New Instance" DVA PUTA (dobiješ 2 nodea: node1 = Manager, node2 = Worker).

3. Na node1 (Manager) – inicijalizuj Swarm:
docker swarm init
   (Ispisaće komandu za join sa tokenom. Kopiraj celu "docker swarm join --token ..." liniju.)

4. Na node2 (Worker) – zalepi kopiranu komandu:
docker swarm join --token <TOKEN> <MANAGER_IP>:2377

5. Na node1 (Manager) – proveri da su oba nodea tu:
docker node ls
   Potvrda: Vidiš 2 nodea (jedan Leader, jedan Worker).

6. Na node1 (Manager) – pokreni test servise:
docker network create --driver overlay --opt encrypted=true psp-overlay
docker service create --name test-web --replicas 4 --network psp-overlay -p 80:80 nginx:alpine
docker service ps test-web
   Potvrda: Vidiš da su taskovi raspoređeni na OBA nodea (node1 i node2).

7. Na node1 – testiraj failover:
docker node update --availability drain node2
docker service ps test-web
   Potvrda: Svi taskovi su se preselili na node1 (sistem radi i posle pada jednog nodea).
docker node update --availability active node2

NAPOMENA: Play with Docker instance traje 4 sata. Za odbranu, pokreni neposredno pre prezentacije.


OPCIJA 2: JEDAN RAČUNAR – SWARM + HA (za odbranu lokalno)
-----------------------------------------------------------
Ako nemaš cloud pristup, pokreni Swarm na jednom računaru i demonstriraj
skaliranje, failover i load balancing kroz DEO A komande.

1. Inicijalizuj Swarm na svom računaru:
docker swarm init

2. Pokreni HA sistem sa replikama:
docker-compose -f docker-compose-ha.yml up -d --scale core-service=3

3. Koristi testove iz DEO A (Load Balancing, Failover, Replikacija).

Na odbrani objasni: "Swarm je konfigurisan za multi-host deployment
(docker-compose-swarm.yml), sa encrypted overlay mrežom između nodova.
Na jednom hostu demonstriram HA funkcionalnost koja je identična."


