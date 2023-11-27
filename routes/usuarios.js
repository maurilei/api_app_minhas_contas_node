const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const login = require("../middleware/login");
require("dotenv/config");

//buscando todos
router.post("/listar", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    conn.query("SELECT * FROM usuarios", (error, resultado, fields) => {
      conn.release();

      if (resultado.length === 0) {
        return res.status(404).send({ error: "Não Encontrado" });
      }

      if (error) {
        return res.status(500).send({ error: "Erro" });
      }
      let dados = JSON.stringify(resultado);
      return res.status(200).send(dados);
    });
  });
});

//insere dados
router.post("/cadastrar", login.logintoken, (req, res, next) => {
  mysql.getConnection((err, conn) => {
    if (err) {
      return res.status(500).send({ error: "Erro" });
    }

    conn.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [req.body.email],
      (error, results) => {
        if (error) {
          return res.status(500).send({ error: "Erro" });
        }
        if (results.length > 0) {
          return res.status(409).send({ mensagem: "E-Mail já cadastrado" });
        } else {
          bcrypt.hash(req.body.senha, 10, (errBcrypt, hash) => {
            if (errBcrypt) {
              return res.status(500).send({ error: errBcrypt });
            }
            conn.query(
              `INSERT INTO usuarios (nome, telefone, email, admin, senha) VALUES (? ,?, ?, ?, ?)`,
              [
                req.body.nome,
                req.body.telefone,
                req.body.email,
                req.body.admin,
                hash,
              ],
              (error, results) => {
                conn.release();
                if (error) {
                  // return res.status(500).send({ error: error });
                  return res.status(500).send({ error: "Erro" });
                }
                const response = {
                  mensagem: "Salvo Com Sucesso"
                };
                return res.status(202).send(response);
              }
            );
          });
        }
      }
    );
  });
});

// logar
router.post("/login", (req, res, next) => {
  //console.log('LOGIN')
  mysql.getConnection((error, conn) => {
    // return console.log(req.body.email)
    if (error) {
      return res.status(500).send({ error: "Erro" });
    }
    const query = `SELECT * FROM usuarios WHERE email = ?`;
    conn.query(query, [req.body.email], (error, results, fiels) => {
      conn.release();
      //return console.log(results[0].senha)
      if (error) {
        return res.status(500).send({ error: "Erro" });
      }
      if (results.length < 1) {
        return res.status(401).send({ mensagem: "Falha na Autenticação" });
      }

      /* bcrypt.compare(req.body.senha, results[0].senha, function(err, result) {
                return console.log(result)
            });*/

      bcrypt.compare(req.body.senha, results[0].senha, (err, result) => {
        //return console.log(result)
        if (err) {
          return res.status(401).send({ mensagem: "Falha na Autenticação" });
        }
        if (result) {
          const token = jwt.sign(
            {
              id: results[0].id,
              email: results[0].email
            },
            process.env.JWT_KEY,
            {
              expiresIn: "7d"
              //expiresIn: "60"
            }
          );

          // let dados = JSON.stringify(results);
          //console.log(results[0].email);
          let dados = {
            id: results[0].id,
            nome: results[0].nome,
            email: results[0].email,
            telefone: results[0].telefone,
            nivel: results[0].nivel
          };
          return res.status(200).send({ token, dados });
          return res.status(200).send({ token, results });
        }

        return res.status(401).send({ mensagem: "Falha na Autenticação0" });
      });
    });
  });
});

// logar com token
router.post("/login-token", login.logintoken, (req, res, next) => {
  // return console.log(req.body.email);
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: "Erro" });
    }
    const query = `SELECT * FROM usuarios WHERE email = ?`;
    conn.query(query, [req.body.email], (error, results, fiels) => {
      conn.release();
      //return console.log(results[0].senha)
      if (error) {
        return res.status(500).send({ error: "Erro" });
      }
      if (results.length < 1) {
        return res.status(401).send({ mensagem: "Falha na Autenticação" });
      }
      let dados = {
        id: results[0].id,
        nome: results[0].nome,
        email: results[0].email,
        telefone: results[0].telefone,
      };
      return res.status(200).send({ dados });

      // return res.status(200).send("OK");
    });
  });
});

//buscando pelo email
router.post("/buscarperfil", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    conn.query(
      "SELECT * FROM usuarios WHERE email = ? ",
      [req.body.email],
      (error, resultado, fields) => {
        conn.release();

        if (resultado.length === 0) {
          return res.status(404).send({ error: "Não Encontrado" });
        }

        if (error) {
          return res.status(500).send({ error: "Erro" });
        }
        let dados = JSON.stringify(resultado);
        return res.status(200).send(dados);
      }
    );
  });
});

//atualiza dados
router.patch("/atualizar", login.logintoken, (req, res, next) => {
  let pass = req.body.senha;
  // return console.log(pass);
  if (pass === undefined || pass === "" || pass === null) {
    mysql.getConnection((error, conn) => {
      if (error) {
        return res.status(500).send({ error: error });
      }
      conn.query(
        `UPDATE usuarios SET nome = ?, telefone = ?, email = ?, admin = ? WHERE id = ?`,
        [
          req.body.nome,
          req.body.telefone,
          req.body.email,
          req.body.admin,
          req.body.id
        ],
        (error, resultado, field) => {
          conn.release();
          if (error) {
            return res.status(500).send({ error: "Erro" });
          }
          const response = {
            mensagem: "Atualizado com Sucesso",
            id: req.body.id,
            nome: req.body.nome,
            email: req.body.email,
            telefone: req.body.telefone,
            admin: req.body.admin
          };
          //console.log(response);
          return res.status(200).send(response);
        }
      );
    });
  } else {
    // return console.log("OK");
    mysql.getConnection((error, conn) => {
      if (error) {
        return res.status(500).send({ error: "Erro" });
      }

      bcrypt.hash(req.body.senha, 10, (errBcrypt, hash) => {
        if (errBcrypt) {
          return res.status(500).send({ error: errBcrypt });
        }
        conn.query(
          `UPDATE usuarios SET nome = ?, telefone = ?, email = ?, senha = ?, admin = ? WHERE id = ?`,
          [
            req.body.nome,
            req.body.telefone,
            req.body.email,
            hash,
            req.body.admin,
            req.body.id
          ],
          (error, resultado, field) => {
            conn.release();
            if (error) {
              return res.status(500).send({ error: "Erro" });
            }
            const response = {
              mensagem: "Atualizado com Sucesso",
              id: req.body.id,
              nome: req.body.nome,
              email: req.body.email,
              telefone: req.body.telefone,
              admin: req.body.admin
            };
            //console.log(response);
            return res.status(200).send(response);
          }
        );
      });
    });
  }
});

//apaga dados
router.delete("/apagar", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: "Erro" });
    }
    conn.query(
      `DELETE FROM usuarios WHERE id = ?`,
      [req.body.id],
      (error, resultado, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: "Erro" });
        }
        if (resultado.affectedRows === 0) {
          return res.status(404).send({ error: "Não Encontrado" });
        }

        res.status(202).send({
          mensagem: "Apagado com Sucesso"
        });
      }
    );
  });
});

module.exports = router;
