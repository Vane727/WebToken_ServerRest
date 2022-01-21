const express=require('express');
const app=express();//viene eseguito express 
const port =3000;
const bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());//estrae dati dal json

const usersRoutes=require('./routes/users.js');//importa users.js
app.use('/users', usersRoutes); //users è un "filtro": vengono accettate solo le request che iniziano con quel percorso e inoltrate al file users.js
                            

//.get per le incoming request
app.get('/',(req, res) =>{ 

    res.send("Hello"); //200 status "ok"
  
});

//.get per le incoming request
app.get('/status',(req, res) =>{ 
    //res.status(200);   
    res.send(`Server in ascolto sulla porta ${port}`);
  
});



app.listen(port,()=>console.log(`Server running on port: http://localhost${port}`));