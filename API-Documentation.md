# API Dokumentacija - KoZnaZna Platform

## Pregled arhitekture

KoZnaZna platforma koristi mikroservisnu arhitekturu sa tri glavna servisa:

- **API Gateway** (Port 8000) - Centralna tačka za autentifikaciju i rutiranje
- **Organization Service** (Port 8001) - Upravljanje organizacijama i članovima
- **Quiz Service** (Port 8002) - Upravljanje kvizovima, timovima i ligama

## 🚪 API Gateway (Port 8000)

API Gateway je glavna tačka ulaska u sistem. Svi zahtevi prolaze kroz njega i prosleđuju se odgovarajućim servisima.

### 🔐 Autentifikacija

#### `POST /api/auth/register`
Registracija novog korisnika
```json
{
  "name": "Pera Perić",
  "email": "pera@example.com", 
  "password": "password123",
  "password_confirmation": "password123"
}
```

#### `POST /api/auth/login`
Prijava korisnika
```json
{
  "email": "pera@example.com",
  "password": "password123"
}
```

#### `GET /api/auth/me`
Dobijanje podataka trenutno ulogovanog korisnika
*Zahteva: Bearer token*

#### `POST /api/auth/logout`
Odjava korisnika
*Zahteva: Bearer token*

---

### 👥 Upravljanje korisnicima (SUPER_ADMIN)

#### `GET /api/manage/users`
Lista svih korisnika

#### `POST /api/manage/users`
Kreiranje novog korisnika
```json
{
  "name": "Novo Ime",
  "email": "novo@example.com",
  "password": "password123",
  "role": "USER"
}
```

#### `GET /api/manage/users/{id}`
Detalji korisnika

#### `PUT /api/manage/users/{id}`
Ažuriranje korisnika
```json
{
  "name": "Ažurirano Ime",
  "email": "azurirano@example.com",
  "role": "SUPER_ADMIN"
}
```

#### `DELETE /api/manage/users/{id}`
Brisanje korisnika

---

### 🏢 Organizacije

#### `GET /api/organizations`
Lista svih organizacija (javno dostupno)

#### `GET /api/organizations/{id}`
Detalji organizacije (javno dostupno)

#### `POST /api/manage/organizations` *(SUPER_ADMIN)*
Kreiranje nove organizacije

#### `PUT /api/organizations/{id}` *(SUPER_ADMIN/ORG_ADMIN)*
Ažuriranje organizacije

#### `DELETE /api/manage/organizations/{id}` *(SUPER_ADMIN)*
Brisanje organizacije

#### `GET /api/organizations/{id}/members`
Lista članova organizacije

#### `POST /api/organizations/{id}/members` *(SUPER_ADMIN/ORG_ADMIN)*
Dodavanje člana u organizaciju

#### `DELETE /api/organizations/{id}/members/{userId}` *(SUPER_ADMIN/ORG_ADMIN)*
Uklanjanje člana iz organizacije

---

### 🎯 Kvizovi

#### `GET /api/quizzes`
Lista svih kvizova (javno dostupno)

#### `GET /api/quizzes/{id}`
Detalji kviza (javno dostupno)

#### `GET /api/organizations/{orgId}/quizzes`
Kvizovi po organizaciji (javno dostupno)

#### `POST /api/quizzes` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Kreiranje novog kviza

#### `PUT /api/quizzes/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Ažuriranje kviza

#### `DELETE /api/quizzes/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Brisanje kviza

---

### 👥 Timovi

#### `GET /api/orgs/{orgId}/teams` *(Autentifikovani korisnici)*
Lista timova po organizaciji

#### `POST /api/teams` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Kreiranje novog tima

#### `GET /api/teams/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Detalji tima

#### `PUT /api/teams/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Ažuriranje tima

#### `DELETE /api/teams/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Brisanje tima

---

### 🏆 Lige

#### `GET /api/leagues`
Lista svih liga (javno dostupno)

#### `GET /api/leagues/{id}`
Detalji lige (javno dostupno)

#### `GET /api/leagues/{leagueId}/table`
Tabela lige (javno dostupno)

#### `GET /api/organizations/{orgId}/leagues`
Lige po organizaciji (javno dostupno)

#### `POST /api/leagues` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Kreiranje nove lige

#### `PUT /api/leagues/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Ažuriranje lige

#### `DELETE /api/leagues/{id}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Brisanje lige

#### `POST /api/leagues/{leagueId}/teams` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Dodavanje tima u ligu

#### `DELETE /api/leagues/{leagueId}/teams/{teamId}` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Uklanjanje tima iz lige

#### `POST /api/leagues/{leagueId}/rounds` *(SUPER_ADMIN/ORG_ADMIN/ORG_MEMBER)*
Unos rezultata kola

---

### 🔧 Debug rute

#### `GET /api/_debug/org-health`
Zdravlje Organization servisa

#### `GET /api/_debug/quiz-health`
Zdravlje Quiz servisa

#### `GET /api/_debug/team-health`
Zdravlje Team funkcionalnosti

#### `GET /api/_debug/league-health`
Zdravlje League funkcionalnosti

---

## 🏢 Organization Service (Port 8001)

*Napomena: Ove rute su dostupne samo kroz API Gateway sa X-Internal-Auth headerom*

### Internal API rute (`/api/internal/`)

#### `GET /api/health`
Zdravlje servisa

#### `GET /api/internal/organizations`
Lista organizacija

#### `POST /api/internal/organizations`
Kreiranje organizacije

#### `GET /api/internal/organizations/{id}`
Detalji organizacije

#### `PUT /api/internal/organizations/{id}`
Ažuriranje organizacije

#### `DELETE /api/internal/organizations/{id}`
Brisanje organizacije

#### `POST /api/internal/organizations/{id}/members`
Dodavanje člana

#### `GET /api/internal/organizations/{id}/members`
Lista članova

#### `DELETE /api/internal/organizations/{id}/members/{userId}`
Uklanjanje člana

---

## 🎯 Quiz Service (Port 8002)

*Napomena: Ove rute su dostupne samo kroz API Gateway sa X-Internal-Auth headerom*

### Internal API rute (`/api/internal/`)

#### `GET /api/health`
Zdravlje servisa

### Kvizovi

#### `POST /api/internal/quizzes`
Kreiranje kviza

#### `GET /api/internal/quizzes/{id}`
Detalji kviza

#### `GET /api/internal/orgs/{orgId}/quizzes`
Kvizovi po organizaciji

#### `GET /api/internal/quizzes`
Lista kvizova

#### `PUT /api/internal/quizzes/{id}`
Ažuriranje kviza

#### `DELETE /api/internal/quizzes/{id}`
Brisanje kviza

### Timovi

#### `POST /api/internal/teams`
Kreiranje tima

#### `GET /api/internal/teams/{id}`
Detalji tima

#### `GET /api/internal/orgs/{orgId}/teams`
Timovi po organizaciji

#### `PUT /api/internal/teams/{id}`
Ažuriranje tima

#### `DELETE /api/internal/teams/{id}`
Brisanje tima

### Registracija timova za kvizove

#### `POST /api/internal/teams/{teamId}/apply-quiz`
Prijava tima za kviz

#### `POST /api/internal/teams/{teamId}/approve-quiz`
Odobravanje prijave

#### `POST /api/internal/teams/{teamId}/reject-quiz`
Odbijanje prijave

#### `POST /api/internal/teams/{teamId}/register-quiz`
Registracija tima za kviz

#### `POST /api/internal/teams/{teamId}/unregister-quiz`
Odjava tima sa kviza

#### `GET /api/internal/quizzes/{quizId}/teams`
Timovi na kvizu

### Lige

#### `GET /api/internal/leagues`
Lista liga

#### `GET /api/internal/orgs/{orgId}/leagues`
Lige po organizaciji

#### `POST /api/internal/leagues`
Kreiranje lige

#### `GET /api/internal/leagues/{id}`
Detalji lige

#### `PUT /api/internal/leagues/{id}`
Ažuriranje lige

#### `DELETE /api/internal/leagues/{id}`
Brisanje lige

#### `POST /api/internal/leagues/{leagueId}/teams`
Dodavanje tima u ligu

#### `DELETE /api/internal/leagues/{leagueId}/teams/{teamId}`
Uklanjanje tima iz lige

#### `POST /api/internal/leagues/{leagueId}/rounds`
Unos rezultata kola

#### `GET /api/internal/leagues/{leagueId}/table`
Tabela lige

---

## 🔐 Sistemi autentifikacije

### Bearer Token (Frontend ↔ API Gateway)
- Frontend šalje `Authorization: Bearer {token}` header
- API Gateway validira token preko Laravel Sanctum

### Internal Authentication (Gateway ↔ Services)
- API Gateway šalje `X-Internal-Auth: {secret}` header
- Services validiraju preko `internal.only` middleware

### User Context Forwarding
- API Gateway prosleđuje `X-User-Id: {userId}` header
- Services koriste za authorization i logging

---

## 📝 Tipovi korisnika

- **SUPER_ADMIN** - Potpuna kontrola sistema
- **ORG_ADMIN** - Administracija organizacije
- **ORG_MEMBER** - Član organizacije sa ograničenim pravima  
- **USER** - Osnovni korisnik

---

## 🌐 CORS i Development

- Frontend: `http://localhost:5174`
- API Gateway: `http://localhost:8000` 
- CORS podešen za development environment

---

*Dokumentacija kreirana za KoZnaZna Platform - Master rad 2025*