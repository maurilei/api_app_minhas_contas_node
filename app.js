const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv/config");

const rotaTarefas = require("./routes/tarefas");
const rotaUsuarios = require("./routes/usuarios");
const rotaContas = require("./routes/contas");

//para ver o codigo de retorno ex. 200
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false })); //apenas dados simples
app.use(bodyParser.json()); //somente jsonm de entrada de dados

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Header",
    "Origin, X-Requested-Whith, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).send({});
  }
  next();
});

// rota
app.use("/tarefas", rotaTarefas);
app.use("/usuarios", rotaUsuarios);
app.use("/contas", rotaContas);

//quando nao encontra a rota
app.use((req, res, next) => {
  const erro = new Error("Não Encontrado");
  erro.status = 404;
  next(erro);
});

//erro ou alguma excessão
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  return res.send({
    erro: {
      mensagem: error.message
    }
  });
});

module.exports = app;
