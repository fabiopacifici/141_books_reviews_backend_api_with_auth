# API Node/Express

Questo progetto è il server API backend per l'applicazione di una libreria. È costruito utilizzando Node.js e Express.js.  
Il frontend è costruito utilizzando React.js e Vite.js. Il progetto è un'applicazione di libreria che consente agli utenti di registrarsi, accedere e gestire i propri libri.

## Autenticazione passo dopo passo con Passport e strategia locale

Durante questa guida implementeremo l'autenticazione utilizzando Passport e la strategia locale.  
Implementeremo anche un modulo di registrazione e accesso utilizzando React Context API per gestire lo stato di autenticazione.

Indice:

- [API Node/Express](#api-nodeexpress)
  - [Autenticazione passo dopo passo con Passport e strategia locale](#autenticazione-passo-dopo-passo-con-passport-e-strategia-locale)
  - [1. Preparazione del database: Creazione della tabella Users](#1-preparazione-del-database-creazione-della-tabella-users)
  - [2. Installazione delle dipendenze del backend](#2-installazione-delle-dipendenze-del-backend)
  - [3. Configurazione di Passport.js](#3-configurazione-di-passportjs)
    - [Passo 1: Creare passport-config.js nella cartella del backend](#passo-1-creare-passport-configjs-nella-cartella-del-backend)
    - [Passo 2: Configurare la strategia locale e la logica di serializzazione](#passo-2-configurare-la-strategia-locale-e-la-logica-di-serializzazione)
      - [0. Creare una funzione di inizializzazione](#0-creare-una-funzione-di-inizializzazione)
      - [1. Implementare la strategia di login](#1-implementare-la-strategia-di-login)
      - [2. Implementare la strategia di registrazione](#2-implementare-la-strategia-di-registrazione)
      - [3. Serializzare e deserializzare l'utente](#3-serializzare-e-deserializzare-lutente)
      - [Codice finale per passport-config.js](#codice-finale-per-passport-configjs)
  - [4. Configurazione di Express Session e middleware di Passport](#4-configurazione-di-express-session-e-middleware-di-passport)
    - [Passo 1: Importare e inizializzare session e passport in server.js](#passo-1-importare-e-inizializzare-session-e-passport-in-serverjs)
    - [Passo 2: Aggiungere il middleware all'app Express](#passo-2-aggiungere-il-middleware-allapp-express)
  - [5. Implementazione degli endpoint di autenticazione \[BACKEND API\]](#5-implementazione-degli-endpoint-di-autenticazione-backend-api)
    - [Passo 1: Aggiungere la route /register al backend](#passo-1-aggiungere-la-route-register-al-backend)
    - [Passo 2: Aggiungere l'endpoint /login](#passo-2-aggiungere-lendpoint-login)
  - [6. FRONTEND: React Context per l'autenticazione](#6-frontend-react-context-per-lautenticazione)
    - [Passo 1: Creazione del contesto Auth](#passo-1-creazione-del-contesto-auth)
    - [Passo 2: Implementazione dei moduli di login e registrazione](#passo-2-implementazione-dei-moduli-di-login-e-registrazione)
      - [1. Utilizzare AuthContext nel modulo di login](#1-utilizzare-authcontext-nel-modulo-di-login)
      - [2. Implementare il modulo di registrazione](#2-implementare-il-modulo-di-registrazione)
    - [Mantenere l'utente connesso con localStorage](#mantenere-lutente-connesso-con-localstorage)
    - [Modifiche alla pagina Admin](#modifiche-alla-pagina-admin)
    - [Aggiornare l'header](#aggiornare-lheader)

---

## 1. Preparazione del database: Creazione della tabella Users

La prima cosa da fare è aggiornare lo schema del database per includere una tabella `users` per l'autenticazione. Questa tabella memorizzerà in modo sicuro le credenziali degli utenti.  
Prima di implementare l'autenticazione, è necessario avere una tabella `users` nel proprio database MySQL.

**SQL:**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Spiegazione:  
Questa tabella memorizzerà in modo sicuro le credenziali degli utenti. Le password saranno hashate prima di essere memorizzate.

## 2. Installazione delle dipendenze del backend

Per implementare l'autenticazione, dobbiamo installare alcuni pacchetti. Inizieremo installando passport e passport-local per gestire il processo di autenticazione utilizzando la strategia locale di Passport, che consente di autenticare gli utenti con un nome utente e una password.

<https://www.passportjs.org/concepts/authentication/password/>

Per implementare correttamente un flusso di autenticazione, dobbiamo anche gestire la sessione utente sul server e passare al client l'ID della sessione come cookie. Per questo utilizzeremo express-session.

Il flusso di registrazione e login è un'implementazione delicata; per garantire la sicurezza, dobbiamo proteggere la password e memorizzare un hash della password invece della password stessa. Per questo utilizzeremo bcrypt.

In una sezione successiva implementeremo anche un caricamento di file per l'immagine di copertina del libro. Per questo utilizzeremo multer.

Installare i pacchetti richiesti nella cartella backend_api:

```bash
npm install passport passport-local express-session bcrypt multer
```

Spiegazione:

- passport e passport-local gestiscono l'autenticazione.
- express-session gestisce le sessioni utente.
- bcrypt hash delle password.
- multer gestisce il caricamento dei file.

## 3. Configurazione di Passport.js

Per iniziare, dobbiamo prima configurare Passport.js in base alla strategia che abbiamo scelto (strategia locale).  
Creare un nuovo file per la configurazione di Passport.

### Passo 1: Creare passport-config.js nella cartella del backend

```js
// filepath: backend_api/auth/passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const connection = require('./database/db.js');

```

Bcrypt: <https://en.wikipedia.org/wiki/Bcrypt>

Ora che abbiamo importato i moduli necessari, possiamo iniziare a configurare la nostra strategia locale.

### Passo 2: Configurare la strategia locale e la logica di serializzazione

Sempre nel file passport-config.js, configureremo la strategia locale e la logica di serializzazione.  
Per configurare correttamente Passport, dobbiamo implementare due strategie:

- Una per il login
- Una per la registrazione

Dovremo anche:

- serializzare e
- deserializzare l'utente.

Questo è il modo in cui Passport gestirà la sessione. In altre parole:

> serializzare memorizzerà l'ID dell'utente nella sessione e deserializzare recupererà l'utente dal database utilizzando l'ID memorizzato nella sessione.

Per mantenere il nostro codice pulito, avvolgeremo tutto in una funzione che chiameremo nel nostro file server.js.

#### 0. Creare una funzione di inizializzazione

Creiamo prima la nostra funzione ed esportiamola.

```js
function initialize(passport) {
  // strategia passport per il login

  // strategia passport per la registrazione

  // serializzare l'utente

  // deserializzare l'utente
}

module.exports = initialize;
```

#### 1. Implementare la strategia di login

Nello stesso file, implementeremo la strategia di login.  
La strategia di login verrà utilizzata per autenticare l'utente quando tenta di accedere. Utilizzeremo la strategia `passport-local` per questo.  
Il seguente codice andrà all'interno della funzione initialize che abbiamo appena creato.

```js
// strategia passport per il login
 passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(email, password, done) {
    // Verifica se l'email esiste nel database
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
      // Gestione errore DB
      if (err) return done(err);
      // Verifica se l'email è già registrata
      if (results.length === 0) return done(null, false, { message: 'Nessun utente trovato' });
      // Prendi l'utente dai risultati
      const user = results[0];
      // Confronta la password con la password hashata nel database
      // utilizzando il metodo bcrypt.compare()
      bcrypt.compare(password, user.password, function(err, isMatch) {
        // Gestione errore hash
        if (err) return done(err);
        // Verifica se la password è corretta
        // Se la password è corretta, restituisci l'oggetto utente
        // Se la password è errata, restituisci false al callback done
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password errata' });
        }
      });
    });
  }));

```

Il codice sopra utilizza il middleware `passport.use()` per definire una nuova strategia per il login.  
Il metodo use accetta tre argomenti:

- il nome della strategia (in questo caso, 'login'),
- una nuova istanza di `LocalStrategy` e una funzione di callback che contiene la logica per la strategia.

Il costruttore `LocalStrategy` accetta un oggetto con le seguenti proprietà:

- `usernameField`: il nome del campo che verrà utilizzato come nome utente (in questo caso, email).
- `passwordField`: il nome del campo che verrà utilizzato come password.
  
La funzione di callback accetta tre argomenti:

- `email`: l'email fornita dall'utente,
- `password`: la password fornita dall'utente e
- `done`: una funzione di callback che verrà chiamata quando il processo di autenticazione è completo.

All'interno della funzione di callback eseguiamo i seguenti passaggi:

- Verifica se l'email esiste nel database eseguendo una query sul database.
- Se l'email non esiste, chiamiamo il callback `done` con `null` e `false` per indicare che l'autenticazione è fallita. Il primo valore `null` indica che non c'è stato alcun errore, e il secondo valore `false` indica che l'autenticazione è fallita.
- Se l'email esiste, prendiamo l'utente dai risultati e confrontiamo la password con la password hashata nel database utilizzando il metodo `bcrypt.compare()`.
- Se la password è corretta, chiamiamo il callback `done` con `null` e l'oggetto utente per indicare che l'autenticazione è riuscita.

#### 2. Implementare la strategia di registrazione

Nello stesso file, implementeremo la strategia di registrazione. Il seguente codice va nella stessa funzione che abbiamo creato prima, subito sotto la strategia di login.

```js
 // Strategia di registrazione
  passport.use('register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function(req, email, password, done) {

    // Verifica se l'email è già registrata
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
      // Gestione errore DB
      if (err) return done(err);
      // Verifica se l'email è già registrata
      if (results.length > 0) return done(null, false, { message: 'Email già registrata' });

      // Hash della password prima di memorizzarla
      bcrypt.hash(password, 10, function(err, hashedPassword) {
        // Gestione errore hash
        if (err) return done(err);

        // Crea un nuovo oggetto utente
        const newUser = {
          username: req.body.username,
          email: email,
          password: hashedPassword
        };

        // Inserisci il nuovo utente nel database
        connection.query('INSERT INTO users SET ?', newUser, function(err, result) {
          if (err) return done(err);
          newUser.id = result.insertId;
          // Restituisci il nuovo oggetto utente
          // al callback done
          return done(null, newUser);
        });
      });
    });
  }));

```

La strategia di registrazione sopra è simile alla strategia di login, ma include anche alcuni passaggi extra:

- Verifica se l'email è già registrata.
- Hash della password prima di memorizzarla nel database.
- Inserisce il nuovo utente nel database.
- Restituisce il nuovo oggetto utente dopo una registrazione riuscita.

Ecco come funziona:  
Come per la strategia di login, utilizziamo il metodo `passport.use()` per definire una nuova strategia per la registrazione. Il metodo `use` accetta due argomenti:

- il nome della strategia (in questo caso, 'register'),
- una nuova istanza di `LocalStrategy` e una funzione di callback che contiene la logica per la strategia.

Il costruttore `LocalStrategy` accetta un oggetto con le seguenti proprietà:

- `usernameField`: il nome del campo che verrà utilizzato come nome utente (in questo caso, email).
- `passwordField`: il nome del campo che verrà utilizzato come password.
- `passReqToCallback`: un booleano che indica se passare l'oggetto richiesta alla funzione di callback.

All'interno della funzione di callback eseguiamo i seguenti passaggi:

- Verifica se l'email è già registrata eseguendo una query sul database.
- Se l'email è già registrata, chiamiamo il callback `done` con `null` e `false` per indicare che la registrazione è fallita. Il primo valore `null` indica che non c'è stato alcun errore, e il secondo valore `false` indica che l'autenticazione è fallita.
- Se l'email non è registrata, hashiamo la password utilizzando `bcrypt.hash()` e la memorizziamo nel database.
- Creiamo un nuovo oggetto utente con il nome utente, l'email e la password hashata.
- Dopo aver creato il nuovo utente, lo inseriamo nel database e restituiamo il nuovo oggetto utente al callback done.

#### 3. Serializzare e deserializzare l'utente

Ora è il momento di serializzare e deserializzare l'utente. Questo è il modo in cui Passport gestirà la sessione. In altre parole:

> "serializzare memorizzerà l'ID dell'utente nella sessione e deserializzare recupererà l'utente dal database utilizzando l'ID memorizzato nella sessione.

```js
// Serializzare l'utente
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

```

Nel codice sopra utilizziamo il metodo `passport.serializeUser()` per definire come serializzare l'utente. Il metodo `serializeUser` accetta un argomento:

- una funzione di callback che accetta l'oggetto utente e un callback done.

La funzione di callback chiama il callback done con due argomenti:

- `null`: indica che non c'è stato alcun errore.
- `user.id`: l'ID dell'utente da memorizzare nella sessione.

```js
// Deserializzare l'utente
passport.deserializeUser(function(id, done) {
  connection.query('SELECT * FROM users WHERE id = ?', [id], function(err, results) {
    if (err) return done(err);
    done(null, results[0]);
  });
});
```

Il metodo deserializzare l'utente è simile al metodo serializzare l'utente, ma recupera l'utente dal database utilizzando l'ID memorizzato nella sessione. Il metodo `deserializeUser` accetta un argomento:

- una funzione di callback che accetta l'ID dell'utente e un callback done.

La funzione di callback chiama il callback done con due argomenti:

- `null`: indica che non c'è stato alcun errore.
- `results[0]`: l'oggetto utente recuperato dal database.

---

#### Codice finale per passport-config.js

**Ecco il codice completo per il file passport-config.js:**

```javascript

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const connection = require('./database/db.js');

// Inizializzare Passport.js
function initialize(passport) {
  // Strategia di login
  passport.use('login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function(email, password, done) {
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
      if (err) return done(err);
      if (results.length === 0) return done(null, false, { message: 'Nessun utente trovato' });

      const user = results[0];
      bcrypt.compare(password, user.password, function(err, isMatch) {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password errata' });
        }
      });
    });
  }));

  // Strategia di registrazione
  passport.use('register', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function(req, email, password, done) {
    connection.query('SELECT * FROM users WHERE email = ?', [email], function(err, results) {
      if (err) return done(err);
      if (results.length > 0) return done(null, false, { message: 'Email già registrata' });

      bcrypt.hash(password, 10, function(err, hashedPassword) {
        if (err) return done(err);

        const newUser = {
          username: req.body.username,
          email: email,
          password: hashedPassword
        };

        connection.query('INSERT INTO users SET ?', newUser, function(err, result) {
          if (err) return done(err);
          newUser.id = result.insertId;
          return done(null, newUser);
        });
      });
    });
  }));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    connection.query('SELECT * FROM users WHERE id = ?', [id], function(err, results) {
      if (err) return done(err);
      done(null, results[0]);
    });
  });
}

module.exports = initialize;
```

Spiegazione:

- Due strategie separate: una per il login e una per la registrazione
- La strategia di login verifica le credenziali esistenti
- La strategia di registrazione crea nuovi utenti dopo la validazione
- Entrambe utilizzano bcrypt per la sicurezza delle password
- Gestione delle sessioni tramite serializzazione/deserializzazione

## 4. Configurazione di Express Session e middleware di Passport

### Passo 1: Importare e inizializzare session e passport in server.js

Ora che abbiamo configurato Passport, dobbiamo configurare express-session e inizializzare Passport nel nostro file `server.js`.

```javascript
  const session = require('express-session');
  const passport = require('passport');
  const initializePassport = require('./passport-config');
```

Nel codice sopra importiamo express-session e passport. Importiamo anche il file passport-config.js che abbiamo appena creato.

### Passo 2: Aggiungere il middleware all'app Express

```javascript
// chiama la funzione initialize che abbiamo creato nel file passport-config.js
initializePassport(passport);

// Configura il middleware express-session
app.use(session({
  secret: 'your_secret_key', // sostituisci con una chiave segreta inventata
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // imposta su true se utilizzi https
}));

// Inizializza il middleware Passport.js
app.use(passport.initialize());
// Inizializza il middleware della sessione Passport.js
app.use(passport.session());

```

Spiegazione:

Le sessioni mantengono gli utenti connessi.  
Passport utilizza le sessioni per mantenere l'autenticazione.

> **Nota BACKEND:** Assicurati che l'opzione `credentials: "include"` sia impostata nella richiesta fetch per includere i cookie nella richiesta. Questo è importante per la gestione delle sessioni. E assicurati anche che il cors sul server Backend API sia configurato correttamente, quando le credenziali sono impostate l'origine non può utilizzare `*` e dobbiamo assicurarci che le credenziali siano impostate su true.

```js
 app.use(cors({
  origin: 'http://localhost:5174', // Consenti richieste dalla tua app React
  credentials: true, // Consenti credenziali (cookie, intestazioni di autorizzazione, ecc.)
}));
```

## 5. Implementazione degli endpoint di autenticazione [BACKEND API]

Ora che tutto è configurato, possiamo implementare l'endpoint di registrazione.  
L'endpoint di registrazione verrà utilizzato per creare un nuovo utente nel database. Utilizzeremo la strategia di registrazione che abbiamo creato in precedenza per gestire il processo di registrazione.  
L'endpoint di registrazione accetterà una richiesta POST con i seguenti campi:

- username
- email
- password
- password_confirmation

### Passo 1: Aggiungere la route /register al backend

Poiché abbiamo creato la strategia di registrazione nel file passport-config.js, possiamo ora utilizzarla nel nostro file server.js quando vogliamo creare la route per registrare gli utenti.

```js

app.post('/register', passport.authenticate('register'), function(req, res) {
  res.json({ message: 'Registrazione riuscita', user: req.user });
});

```

Spiegazione:  
Nel codice sopra non vedi la logica di registrazione poiché è già gestita dalla strategia di registrazione che abbiamo creato in precedenza. Il middleware passport.authenticate('register') gestirà il processo di registrazione e chiamerà la funzione di callback se la registrazione è riuscita.  
La funzione di callback invierà una risposta JSON con un messaggio di successo e l'oggetto utente.

### Passo 2: Aggiungere l'endpoint /login

Ora possiamo definire la route di login, che verrà utilizzata per autenticare l'utente quando tenta di accedere. Utilizzeremo la strategia di login che abbiamo creato in precedenza per gestire il processo di login.

```js
app.post('/login', passport.authenticate('login'), function(req, res) {
  res.json({ message: 'Login riuscito', user: req.user });
});
```

Spiegazione:  
Nel codice sopra creiamo un endpoint post per la route `/login`. Il metodo post riceverà 3 argomenti:

- il percorso della route
- il middleware passport.authenticate('login')
- una funzione di callback che verrà chiamata se l'autenticazione è riuscita.

Con il codice sopra Passport autentica l'utente. Se l'autenticazione è riuscita, l'utente viene allegato a req.user.

> Registrazione e Login: Ora puoi registrare e accedere agli utenti utilizzando gli endpoint `/register` e `/login`.  
> L'endpoint di registrazione creerà un nuovo utente nel database e l'endpoint di login autenticherà l'utente.  
> Apri l'app React e testa i moduli di registrazione e login.

Punto di controllo:

- [x] Dovresti essere in grado di registrarti e vedere un nuovo utente nel db e un messaggio di successo
- [x] Dovresti anche essere in grado di accedere e vedere un messaggio di successo.

## 6. FRONTEND: React Context per l'autenticazione

### Passo 1: Creazione del contesto Auth

In questo passaggio creeremo AuthContext.jsx nella cartella contexts per il progetto React sul frontend.  
Per prima cosa, creiamo il file `AuthContext.jsx` nella cartella `contexts` del tuo progetto React.

> **File: src/contexts/AuthContext.jsx**

```js
import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    return fetch("http://localhost:3000/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        return data;
      });
  };

  const logout = () => {
    setUser(null);
    // Opzionalmente, chiama un endpoint /logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

Spiegazione:

Fornisce funzioni di login e logout.  
Memorizza l'utente autenticato nel contesto.

---

> **Nota:** Non dimenticare di avvolgere la tua app con il `AuthProvider` nel tuo file `App.js`.

```js
    <AuthProvide>
      // tutte le route qui
    </AuthProvide>
```

### Passo 2: Implementazione dei moduli di login e registrazione

#### 1. Utilizzare AuthContext nel modulo di login
  
```js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    login(form.email, form.password)
      .then(data => {
        if (data.user) navigate("/admin");
      });
  };

  // ...JSX esistente...
}

```

Spiegazione:  
Nel codice sopra creiamo un modulo di login che utilizza il hook `useAuth` per accedere alla funzione `login` dal contesto. La funzione `handleSubmit` chiama la funzione `login` con l'email e la password fornite dall'utente. Se il login è riuscito, reindirizza alla pagina `/admin`.

> **Nota BACKEND:** Assicurati che l'opzione `credentials: "include"` sia impostata nella richiesta fetch per includere i cookie nella richiesta. Questo è importante per la gestione delle sessioni. E assicurati anche che il cors sul server Backend API sia configurato correttamente, quando le credenziali sono impostate l'origine non può utilizzare `*` e dobbiamo assicurarci che le credenziali siano impostate su true.

```js
 app.use(cors({
  origin: '<http://localhost:5174>', // Consenti richieste dalla tua app React
  credentials: true, // Consenti credenziali (cookie, intestazioni di autorizzazione, ecc.)
}));
```

#### 2. Implementare il modulo di registrazione

```js
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 Importa questo
import { useAuth } from "../../contexts/AuthContext"; // 👈 Importa questo

export default function Register() {
  // 👇 Destruttura l'oggetto e prendi la funzione login
  const { login } = useAuth(); // Usa login per accedere all'utente dopo la registrazione
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        // 👇 Verifica se i dati hanno una proprietà user
        // Se la registrazione è riuscita, accedi all'utente
        if (data.user) {
          login(form.email, form.password).then(() => navigate("/admin")); // Accedi e reindirizza
        }
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card p-4" style={{ minWidth: 350 }}>
        <h2 className="text-center mb-4">Registrati</h2>
        <form onSubmit={handleSubmit}>
          {/* ...campi del modulo... */}
          <button type="submit" className="btn btn-primary w-100">Registrati</button>
        </form>
      </div>
    </div>
  );
}
```

### Mantenere l'utente connesso con localStorage

Dopo che il nostro utente è registrato e connesso, dobbiamo mantenerlo tale in modo da poter utilizzare i dati dell'utente nella nostra app. Utilizzeremo localStorage per memorizzare i dati dell'utente.

Ecco come possiamo farlo:

```js
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Verifica se l'utente è già connesso quando l'app si carica 👇
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Chiama questo al login
  const login = (userData) => {
    setUser(userData);
    // Memorizza i dati dell'utente in localStorage 👇
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // Chiama questo al logout
  const logout = () => {
    setUser(null);
    // Rimuovi i dati dell'utente da localStorage 👇
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

```

### Modifiche alla pagina Admin

Importa le dipendenze

```js
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

```

Estrai il contesto

```js

export default function Admin() {
  // 👇 Usa il hook useAuth per ottenere l'utente e la funzione logout
  const { user, logout } = useAuth();

  console.log("Utente in Admin:", user);

// 👇 Usa il hook useNavigate per navigare alla pagina di login
  const navigate = useNavigate();
  useEffect(() => {
    logout();
    navigate("/login");
  }, []);

  // resto del codice del componente...

}

```

Saluta l'utente

```jsx
 <h1>Ciao {user && user.username}</h1>
```

---

### Aggiornare l'header

```jsx

import { NavLink } from "react-router-dom"
// 👇 importa il hook personalizzato useAuth
import { useAuth } from "../contexts/AuthContext"

export default function Header() {
// 👇 destruttura i valori del contesto prendi user e logout
  const { user, logout } = useAuth()


  return (
    <header>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="nav navbar-nav w-100" >
          <NavLink className="nav-link" to="/">Home</NavLink>


          <div className="ms-auto d-flex gap-2">

            {/* 👇 Se non c'è utente mostra login e registrazione */}
            {

              !user && (
                <>
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                  <NavLink className="nav-link" to="/register">Register</NavLink>
                </>
              )
            }

            {/* 👇 Se c'è un utente mostra i link admin e logout */}
            {user && <NavLink className="nav-link" to="/admin">Admin</NavLink>}
            {user && <button className="nav-link" onClick={logout}>Logout</button>}
          </div>

        </div>
      </nav>

    </header>
  )
}

```
