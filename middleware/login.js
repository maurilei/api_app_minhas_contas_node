const jwt = require("jsonwebtoken");
const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;

exports.obrigatorio = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.usuario = decode;
    // console.log("DECODE", decode);
    next();
  } catch (error) {
    return res.status(401).send({ mensagem: "Falha na Autenticação" });
  }
};

exports.opcional = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.usuario = decode;
    console.log(decode);
    next();
  } catch (error) {
    next();
    //console.log("Erro Token");
  }
};

exports.logintoken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.usuario = decode;

    next();
  } catch (error) {
    return res.status(401).send({ erro: "Unauthorized" });
  }
};

exports.comToken = async (req, res, next) => {
  return mysql.getConnection((err, conn) => {
    const token = req.headers.authorization.split(" ")[1];
    if (err) {
      return res.status(500).send({ error: "Erro" });
    }
    conn.query(
      "SELECT * FROM token WHERE hash = ?",
      [token],
      (error, results) => {
        if (results.length > 0) {
          const email = results[0].email;
       
          next();
        } else {
          res.status(401).send({ erro: "Unauthorized" });
          //return;
        }
        //console.log("aqui");
        // return;
      }
    );
    //return res.status(404).send({ erro: "NOT FOUND" });
    console.log("aqui2");
  });
  //return;
  console.log("aqui3");
  //res.status(404).send({ erro: "Not Found" });
};
