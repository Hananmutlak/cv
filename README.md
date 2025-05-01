
# API för hantering av arbetslivserfarenheter

Detta repo innehåller ett enkelt REST API byggt med Express. API:et är skapat för att hantera arbetslivserfarenheter och yrkeserfarenheter.

## Installation och uppsättning

### Förutsättningar
- Node.js 
- MySQL-databas
- npm

### Installationssteg
1. Klona repot:
```bash
git clone https://github.com/Hananmutlak/cv.git
### Installera de nödvändiga paketen
-npm install
### Skapa en .env-fil
-DB_HOST=databasvärd
-DB_USER=databas-användare
-DB_PASSWORD=databas-lösenord
-DB_NAME=databas-namn
-PORT=valfritt-portnummer

### Kör skriptet för att skapa databastabellen
-node install.js
### Databasstruktur
-Tabellnamn: workexperience
| Fält         | Typ          | Beskrivning                        |
|--------------|--------------|------------------------------------|
| id           | int(11)      | Unikt ID (automatisk ökning)       |
| companyname  | varchar(255) | Företagsnamn                       |
| jobtitle     | varchar(255) | Jobbtitel                          |
| location     | varchar(255) | Geografisk plats                   |
| startdate    | date         | Startdatum                         |
| enddate      | date         | Slutdatum (valfritt)               |
| description  | text         | Jobbeskrivning (valfritt)          |
### Använda API

GET	/api/work	Hämta alla arbetslivserfarenheter
GET	/api/work/:id	Hämta en specifik erfarenhet baserat på ID
POST	/api/work	Lägg till en ny arbetslivserfarenhet
PUT	/api/work/:id	Uppdatera en befintlig arbetslivserfarenhet
DELETE	/api/work/:id	Ta bort en arbetslivserfarenhet


