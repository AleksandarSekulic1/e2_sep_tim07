VISOKA DOSTUPNOST I SKALIRANJE PSP SISTEMA
==============================================

Specifikacija: "Ceo sistem je neophodno pokrenuti na minimum 2 računara ili na cloud-u.
Komunikacija HTTPS-om ili nekim drugim secure protokolom (poput gRPCs) je obavezna."

ARHITEKTURA SISTEMA:
- Docker Swarm klaster sa minimum 2 host-a (Manager + Worker)
- HTTPS terminacija na Nginx-u (TLS 1.2+, self-signed sertifikati)
- Encrypted overlay mreža između svih nodova (IPsec enkripcija)
- Database replikacija (Primary-Replica PostgreSQL)
- Load Balancing i automatski Failover

Raspored servisa po nodovima:
  Manager Node (Node 1): Baze podataka, RabbitMQ, MongoDB, Nginx LB
  Worker Node  (Node 2): Core, Bank, Card, PayPal, Crypto servisi, API Gateway, Web Shop


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
DEO B: CLOUD DEPLOY – CEO PSP SISTEM NA 2 MAŠINE (Docker Swarm)
================================================================

OPCIJA 1: PLAY WITH DOCKER (cloud, besplatno, u browseru)
==========================================================
Najlakši način za demo na cloud-u. Sajt daje besplatne Linux Docker nodove.
NAPOMENA: Play with Docker instance traje 4 sata. Pokreni neposredno pre prezentacije.

PREDUSLOV: Docker Hub nalog (besplatno na https://hub.docker.com/signup)

KORAK 1: Pokretanje Cloud Okruženja
--------------------------------------
1. Otvori https://labs.play-with-docker.com/ i uloguj se sa Docker Hub nalogom.

2. Klikni "Add New Instance" DVA PUTA (dobiješ 2 nodea: node1 = Manager, node2 = Worker).

KORAK 2: Inicijalizacija Swarm-a (na node1 – Manager)
--------------------------------------------------------
3. Na node1 (Manager) – inicijalizuj Swarm:

   docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')

   Potvrda: Ispisaće komandu za join sa tokenom. Kopiraj celu liniju:
   "docker swarm join --token SWMTKN-xxxxx... <IP>:2377"

4. Na node2 (Worker) – zalepi kopiranu komandu:

   docker swarm join --token <TOKEN> <MANAGER_IP>:2377

   Potvrda: "This node joined a swarm as a worker."

5. Na node1 (Manager) – proveri da su oba nodea tu:

   docker node ls

   Potvrda: Vidiš 2 nodea (jedan Leader/Manager, jedan Worker).

KORAK 3: Kloniranje Projekta i Build (na node1 – Manager)
------------------------------------------------------------
6. Na node1 (Manager) – kloniraj projekat:

   git clone https://github.com/<tvoj-username>/e2_sep_tim07.git
   cd e2_sep_tim07/docker

   (Zameni <tvoj-username> sa pravim GitHub username-om)

7. Na node1 (Manager) – pokreni lokalni Docker Registry:
   (Registry služi da Worker nodovi mogu da preuzmu buildovane images)

   docker service create --name registry --publish published=5000,target=5000 registry:2
   
   Potvrda: docker service ls -> vidiš registry sa 1/1 replika.

8. Na node1 (Manager) – generiši SSL sertifikate za HTTPS:

   mkdir -p ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout ssl/server.key -out ssl/server.crt \
     -subj "/C=RS/ST=Serbia/L=Belgrade/O=PSP/CN=localhost"

   Potvrda: ls ssl/ -> vidiš server.crt i server.key

KORAK 4: Build i Push Docker Images (na node1 – Manager)
-----------------------------------------------------------
9. Na node1 (Manager) – builduj sve mikroservise:

   docker build -t localhost:5000/psp-core-service:latest ../psp-services/core-service/
   docker build -t localhost:5000/psp-bank-service:latest ../psp-services/bank-service/
   docker build -t localhost:5000/psp-card-service:latest ../psp-services/card-service/
   docker build -t localhost:5000/psp-paypal-service:latest ../psp-services/paypal-service/
   docker build -t localhost:5000/psp-crypto-service:latest ../psp-services/crypto-service/
   docker build -t localhost:5000/psp-api-gateway:latest ../psp-services/api-gateway/
   docker build -t localhost:5000/psp-web-shop:latest ../web-shop/

   Potvrda: Svaki build završava sa "Successfully tagged localhost:5000/psp-xxx:latest"
   (Ovo može trajati 5-10 minuta jer se builduju Java/Maven i Angular projekti)

10. Na node1 (Manager) – pushuj images na registry:

    docker push localhost:5000/psp-core-service:latest
    docker push localhost:5000/psp-bank-service:latest
    docker push localhost:5000/psp-card-service:latest
    docker push localhost:5000/psp-paypal-service:latest
    docker push localhost:5000/psp-crypto-service:latest
    docker push localhost:5000/psp-api-gateway:latest
    docker push localhost:5000/psp-web-shop:latest

    Potvrda: Svaki push završava bez greške.

KORAK 5: Deploy Celog PSP Sistema na Swarm (na node1 – Manager)
-----------------------------------------------------------------
11. Na node1 (Manager) – deployuj stack:

    REGISTRY=localhost:5000 docker stack deploy -c docker-compose-swarm.yml psp

    Potvrda: Vidiš ispis "Creating service psp_core-service", "psp_bank-service" itd.
    za svaki servis.

12. Sačekaj 60-90 sekundi da se svi Java servisi podignu, zatim proveri:

    docker stack services psp

    Potvrda: Svi servisi imaju REPLICAS kolonu sa brojem (npr. 2/2, 1/1).
    Ako neki servis pokazuje 0/2, čekaj još malo ili proveri logove:
    docker service logs psp_core-service --tail 50

KORAK 6: Proveri Raspored Servisa po Nodovima
------------------------------------------------
13. Na node1 (Manager) – vidi gde se šta izvršava:

    docker stack ps psp --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}"

    Potvrda: MORAŠ videti servise raspoređene na OBA nodea.
    Baze i infrastruktura (psp-core-db-primary, rabbitmq, nginx-lb) su na Manager-u.
    Aplikacioni servisi (core-service, bank-service, api-gateway...) su na Worker-u.

14. (Opciono) Proveri HTTPS (ako imaš pristup portu 443):

    curl -sk https://localhost/health

    Potvrda: Odgovor "healthy"


OPCIJA 1 – TESTOVI (Play with Docker)
========================================

TEST 1: Multi-Host Distribucija
Cilj: Da dokažeš da servisi rade na 2 različita hosta.
Na node1 (Manager):
docker stack ps psp --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}"
Potvrda: U koloni NODE moraš videti I node1 I node2.

TEST 2: HTTPS / TLS Enkripcija
Cilj: Da dokažeš da je komunikacija enkriptovana.
Na node1:
curl -svk https://localhost/health 2>&1 | grep -E "SSL|TLS|subject"
Potvrda: Vidiš "SSL connection using TLSv1.2" ili "TLSv1.3".

TEST 3: Encrypted Overlay Mreža
Cilj: Da dokažeš da je interna komunikacija između nodova enkriptovana.
Na node1:
docker network inspect psp_psp-overlay --format "Encrypted: {{index .Options \"encrypted\"}}"
Potvrda: Ispis "Encrypted: true"

TEST 4: Skaliranje (Dinamičko)
Cilj: Da skaliraš servis na više replika kroz Swarm.
Na node1:
docker service scale psp_core-service=4
docker service ps psp_core-service
Potvrda: Vidiš 4 instance core-service raspoređene na oba nodea.
(Vrati nazad: docker service scale psp_core-service=2)

TEST 5: Visoka Dostupnost (Failover)
Cilj: Da ugasiš Worker nod, a sistem nastavi da radi.
Na node1 (Manager):
docker node update --availability drain <worker-node-name>
docker stack ps psp
Potvrda: Svi servisi sa Worker-a su se preselili na Manager. Sistem radi.
(Vrati nazad: docker node update --availability active <worker-node-name>)

TEST 6: Replikacija Baze (Data HA)
Cilj: Upišeš u primarnu bazu na Manager-u -> Pojavi se u repliki.
Na node1 (Manager):
docker exec $(docker ps -qf "name=psp_psp-core-db-primary") psql -U postgres -d psp_core_db -c "CREATE TABLE IF NOT EXISTS test_cloud (info text); INSERT INTO test_cloud (info) VALUES ('CLOUD REPLIKACIJA RADI');"
docker exec $(docker ps -qf "name=psp_psp-core-db-replica") psql -U postgres -d psp_core_db -c "SELECT * FROM test_cloud;"
Potvrda: Moraš videti ispis: CLOUD REPLIKACIJA RADI.


OPCIJA 2: DVA RAČUNARA (Lokalna Mreža ili Cloud VMs)
======================================================
Za deploy na 2 prava računara (npr. 2 laptopa, AWS EC2, DigitalOcean, Azure VM).

PREDUSLOVI:
  - Docker instaliran na OBA računara (https://docs.docker.com/engine/install/)
  - Oba računara na istoj mreži (ili cloud VMs u istom VPC-u)
  - Portovi otvoreni između računara: 2377 (Swarm), 7946 (discovery), 4789 (overlay)
  - Portovi otvoreni na Manager-u: 80, 443 (HTTP/HTTPS), 5000 (Registry)

KORAK 1: Inicijalizacija Swarm-a (Računar 1 – Manager)
---------------------------------------------------------
1. Na Računar 1 (Manager) – odredi svoju IP adresu:

   Linux:   hostname -I | awk '{print $1}'
   Windows: ipconfig (uzmi IPv4 adresu LAN adaptera)
   Mac:     ifconfig | grep "inet " | grep -v 127.0.0.1

   Zapamti ovu IP adresu – to je MANAGER_IP.

2. Na Računar 1 (Manager) – inicijalizuj Swarm:

   docker swarm init --advertise-addr <MANAGER_IP>

   Primer: docker swarm init --advertise-addr 192.168.1.100

   Potvrda: Ispisaće join komandu sa tokenom. KOPIRAJ JE.

KORAK 2: Prikljuci Worker (Računar 2 – Worker)
-------------------------------------------------
3. Na Računar 2 (Worker) – zalepi kopiranu join komandu:

   docker swarm join --token <TOKEN> <MANAGER_IP>:2377

   Primer: docker swarm join --token SWMTKN-1-3pu6hszj... 192.168.1.100:2377

   Potvrda: "This node joined a swarm as a worker."

4. Na Računar 1 (Manager) – proveri da su oba tu:

   docker node ls

   Potvrda: Vidiš 2 nodea – Manager (Leader) i Worker (Ready).

KORAK 3: Priprema na Manager-u (Računar 1)
---------------------------------------------
5. Na Računar 1 (Manager) – kloniraj projekat (ako nije):

   cd docker    (uđi u docker folder projekta)

6. Pokreni lokalni Docker Registry:

   docker service create --name registry --publish published=5000,target=5000 registry:2

7. Generiši SSL sertifikate:

   mkdir -p ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout ssl/server.key -out ssl/server.crt \
     -subj "/C=RS/ST=Serbia/L=Belgrade/O=PSP/CN=localhost"

   ILI koristi gotovu skriptu:
   bash generate-certificates.sh

KORAK 4: Build, Push i Deploy (Računar 1)
--------------------------------------------
8. Pokreni automatizovanu deploy skriptu (PREPORUČENO):

   bash deploy-cloud.sh init       (ako nisi vec inicijalizovao Swarm)
   bash deploy-cloud.sh deploy     (build + push + deploy)

   ILI ručno (ako skripta ne radi):

   docker build -t localhost:5000/psp-core-service:latest ../psp-services/core-service/
   docker build -t localhost:5000/psp-bank-service:latest ../psp-services/bank-service/
   docker build -t localhost:5000/psp-card-service:latest ../psp-services/card-service/
   docker build -t localhost:5000/psp-paypal-service:latest ../psp-services/paypal-service/
   docker build -t localhost:5000/psp-crypto-service:latest ../psp-services/crypto-service/
   docker build -t localhost:5000/psp-api-gateway:latest ../psp-services/api-gateway/
   docker build -t localhost:5000/psp-web-shop:latest ../web-shop/

   docker push localhost:5000/psp-core-service:latest
   docker push localhost:5000/psp-bank-service:latest
   docker push localhost:5000/psp-card-service:latest
   docker push localhost:5000/psp-paypal-service:latest
   docker push localhost:5000/psp-crypto-service:latest
   docker push localhost:5000/psp-api-gateway:latest
   docker push localhost:5000/psp-web-shop:latest

   REGISTRY=localhost:5000 docker stack deploy -c docker-compose-swarm.yml psp

9. Sačekaj 60-90 sekundi, zatim proveri:

   docker stack services psp
   docker stack ps psp --format "table {{.Name}}\t{{.Node}}\t{{.CurrentState}}"

   Potvrda: Servisi su raspoređeni na OBA nodea i svi imaju "Running" status.

KORAK 5: Pristup Aplikaciji
------------------------------
10. Web Shop (Browser):
    https://<MANAGER_IP>

11. API Health Check:
    curl -sk https://<MANAGER_IP>/health

12. API Endpoint:
    https://<MANAGER_IP>/api/

NAPOMENA: Koristi -k flag za curl ili prihvati self-signed sertifikat u browseru.


OPCIJA 2 – TESTOVI (2 Računara)
==================================
Koristi iste testove kao za Opciju 1 (TEST 1 do TEST 6 gore).
Svi se pokreću na Računar 1 (Manager).

Dodatni test za mrežnu izolaciju:
Na Računar 2 (Worker) isključi mrežu na 10 sekundi, pa je vrati.
Na Računar 1 proverim: docker node ls (Worker bi trebao da se vrati u Ready).
docker stack ps psp (servisi se ponovo rasporede automatski).


OPCIJA 3: JEDAN RAČUNAR – SWARM (za odbranu lokalno, ako nema 2 mašine)
==========================================================================
Ako nemaš pristup cloud-u ili drugom računaru:

1. Inicijalizuj Swarm na svom računaru:
   docker swarm init

2. Pokreni deploy skriptu:
   bash deploy-cloud.sh deploy

3. ILI koristi HA konfiguraciju sa DEO A:
   docker-compose -f docker-compose-ha.yml up -d --scale core-service=3

4. Koristi testove iz DEO A (Load Balancing, Failover, Replikacija).

Na odbrani objasni: "Swarm je konfigurisan za multi-host deployment
(docker-compose-swarm.yml), sa encrypted overlay mrežom između nodova
i HTTPS terminacijom. Na jednom hostu demonstriram HA funkcionalnost
koja je identična onoj na cloud-u."


================================================================
DEO C: KORISNE KOMANDE I TROUBLESHOOTING
================================================================

UPRAVLJANJE STACK-OM:
  docker stack services psp              - Lista svih servisa
  docker stack ps psp                    - Gde se koji servis izvršava
  docker service logs psp_core-service   - Logovi core servisa
  docker service logs psp_nginx-lb       - Logovi Nginx-a (vidiš HTTPS)
  docker service scale psp_core-service=4 - Skaliraj core na 4 replike
  docker stack rm psp                    - Zaustavi i obriši sve

UPRAVLJANJE SWARM-OM:
  docker node ls                          - Lista nodova
  docker node inspect <node> --pretty     - Detalji o nodu
  docker swarm leave --force              - Napusti Swarm (na svakom nodu)

PROVERA HTTPS:
  curl -svk https://localhost/health 2>&1 | grep -E "SSL|TLS"
  openssl s_client -connect localhost:443 -tls1_2

PROVERA OVERLAY MREŽE:
  docker network inspect psp_psp-overlay
  docker network inspect psp_psp-overlay --format "Encrypted: {{index .Options \"encrypted\"}}"

TROUBLESHOOTING:
  Ako servis ne startuje (0/1 replika):
    docker service logs psp_<servis-name> --tail 100
  
  Ako Worker ne vuče images:
    Na Worker-u dodaj Manager IP u insecure-registries:
    echo '{"insecure-registries":["<MANAGER_IP>:5000"]}' | sudo tee /etc/docker/daemon.json
    sudo systemctl restart docker
    (Pa ponovo: docker swarm join ...)

  Ako se baza ne replicira:
    docker service logs psp_psp-core-db-replica --tail 50
    (Proveri da init-replication.sh postoji i da primary baza radi)

DEPLOY SKRIPTA (automatizovano):
  bash deploy-cloud.sh init              - Inicijalizuj Swarm (Manager)
  bash deploy-cloud.sh join <IP> <TOKEN> - Pridruži se (Worker)
  bash deploy-cloud.sh deploy            - Build + Push + Deploy sve
  bash deploy-cloud.sh status            - Status sistema
  bash deploy-cloud.sh test              - Pokreni sve testove
  bash deploy-cloud.sh scale <svc> <n>   - Skaliraj servis
  bash deploy-cloud.sh teardown          - Ukloni sve


