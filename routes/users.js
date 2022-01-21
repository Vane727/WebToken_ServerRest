const express = require("express");
const router = express.Router();

const { v4: uuidv4 } = require("uuid");
const mysql = require("mysql");
const pool = mysql.createPool({ //creazione pool di connessioni
  connectionLimint: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "database",
});

//libreria per la trasmissione delle informazioni tramite json (RFC 7519)
const jwt = require("jsonwebtoken");   
//genera webtoken segreto da archiviare in un file .env     				
//require('crypto').randomBytes(64).toString('hex');

const dotenv = require("dotenv");   //libreria per caricare le variabili d'ambiente dai file .env
// get config vars
dotenv.config();
// access config var (token segreto)
process.env.TOKEN_SECRET;   							

//var privateKey = fs.readFileSync('private.key');


function generateAccessToken(firstName) { //genera un webtoken valido per 30 min
  return jwt.sign(firstName,process.env.TOKEN_SECRET, { expiresIn: "1800s" }); 
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); //Unauthorized

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err);

    if (err) return res.sendStatus(403); //forbidden
    req.user = user;
    next();
  });
}

//login e creazione del webtoken
router.get("/login", (req, res) => {
  console.log(req.body.firstName);   

  pool.query(
		`\
			SELECT id 
			FROM users 
			WHERE firstName=? AND password=?
		`,
		[req.body.firstName, req.body.password],
    (err, row) => {
      if (err) {				// Controlla se c'è un errore nel DB
        res.status(500).send(err);
        throw err;					// blocca il server se c'è un errore nella query
      }
      if (row.length > 0) {			// Controlla se esiste un utente con quei requisiti
      //se la password è corretta
        const token = generateAccessToken({ firstName: row.id });
        res.status(201).json({
          success: 1,
          message: "Login successfully",
          token: token,
        });
      } else {			// altrimenti gli dice di no
        res.status(403).json({
          success: 0,
          message: "Username o password errati",
        });
      }
    }
  );

  //Sign asynchronously
  // var jsontoken = jwt.sign({ foo: 'bar' }, privateKey, { algorithm: 'RS256' }, function(err, token) {
  //     console.log(token);
  // });

  /*  const token = generateAccessToken({ firstName: req.body.firstName });
  
   console.log(secret);//process.env.TOKEN_SECRET
    res.status(201).json({
        success:1,
        message:'login successfully',
        token: token
    });
    */
});

//richiesta di autenticazione per visualizzare il contenuto del db
router.get("/getData/testAuth", authenticateToken, (req, res) => {
  pool.query(
    `\
			SELECT * \
			FROM users`,
    (err, row, fie) => {
      if (err) {
        res.status(500).send(err);
        throw err;
      }

      console.log(row);
      res.send(row);
    }
  );
});

//.post per le post request
router.post("/", (req, res) => {
  var values = [[req.body.firstName, req.body.lastName, req.body.password]];
  pool.query(
    "INSERT INTO users (firstName,lastName,password) VALUES ?",
    [values],
    (err, row, fie) => {

      console.log(`POST: ${req.url} \tremote:${req.ip}: `);
      if (err) {
        res.status(500).send(err);  //Internal Server Error
				console.log(err)
        throw err;
      }  
			
      console.log("Numero di record inseriti: " + row.affectedRows);  
      console.log(row);
      res.send(row);
			                               

      /*res.send({
        'id':row.insertId,                                         
        'firstName':row.firstName,
        message:`user aggiunto al database`
    })*/
    }
  );

 
});

//.get per estrarre i dati dell'utente tramite ID
router.get("/cerca/:id", (req, res) => {  
  var id = req.params.id;
  pool.query(
    `\
			SELECT * \
			FROM users \
			WHERE id=?`,
    [id],
    (err, row, fie) => {
     
      if (err) {
        res.status(500).send(err);
        throw err;
      }
      if(row.length==0)res.send("Utente non trovato");
			

      console.log(row);
      res.send(row[0]);
      //res.send(row.map(r=>r.id));
    }
  );
});

//delete requests - elimina utente tramite ID
router.delete("/delete/:id", (req, res) => {               
  
  let id = req.params.id;
  pool.query(`DELETE FROM users WHERE id=?`, [id], (err, row, fie) => {
    console.log(`POST: ${req.url} \tremote:${req.ip}: `);
    if (err) {
      res.status(500).send(err);
      throw err;
    }
    //se sono stati modificati dei record allora l'utente è stato eliminato
    if(row.affectedRows>0) {res.send(`utente eliminato dal database`);} 
    //altrimenti:
    else {res.send(`utente non trovato`);}
    console.log(row);
  });
});

//patch requests
router.patch("/:id", (req, res) => {
  //  authenticateToken,

  var post = [req.body.firstName, req.body.lastName, req.body.password];
  var id = req.params.id;
  pool.query(
    "UPDATE users SET firstName=?,lastName=?,password=? WHERE id=?",  
    [req.body.firstName, req.body.lastName, req.body.password,id],
    (err, row, fie) => {
      console.log(`POST: ${req.url} \tremote:${req.ip}: `);
      if (err) {
        res.status(500).send(err);
        throw err;
      }

      res.send(row);
      //res.send(row.map(r=>r.id));
      console.log("changed " + row.changedRows + " rows");
      res.send({
        message: `user aggiornato:` + row.firstName,
      });
    }
  );

  /*
    const {id}=req.params; 
    const {firstName,lastName}=req.body;

    const user =users.find((user)=>user.id==id);
   if(firstName){user.firstName=firstName};
   if(lastName){user.lastName=lastName};
  // if(id){}

  res.send(`user ${users.id} aggiornato `);
  */
});

//vengono esportate le route create in modo che possano essere importate in altri file
module.exports = router;
