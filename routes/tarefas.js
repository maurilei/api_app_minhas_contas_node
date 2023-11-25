const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool;
const jwt = require("jsonwebtoken");
const login = require("../middleware/login");
require("dotenv/config");

//buscando todas ok
router.post("/listar", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    conn.query("SELECT * FROM tarefa", (error, resultado, fields) => {
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

//insere dados ok
router.post("/cadastrar", login.logintoken, (req, res, next) => {
  mysql.getConnection((err, conn) => {
    if (err) {
      return res.status(500).send({ error: "Erro" });
    }
    conn.query(
      `INSERT INTO tarefa (cliente, marca, modelo, defeito, servicoexecutado, status, valor, datatarefa, usuario) VALUES (? ,?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.cliente,
        req.body.marca,
        req.body.modelo,
        req.body.defeito,
        req.body.servicoexecutado,
        req.body.status,
        req.body.valor,
        req.body.datatarefa,
        req.body.usuario
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
});

// logar ok
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
              expiresIn: "1d"
            }
          );

          mysql.getConnection((err, conn) => {
            if (err) {
              return res.status(500).send({ error: "Erro" });
            }

            conn.query(
              "SELECT * FROM token WHERE email = ?",
              [req.body.email],
              (error, results) => {
                if (results.length > 0) {
                  conn.query(
                    `UPDATE token SET hash = ? WHERE email = ?`,
                    [token, req.body.email],
                    (error, resultado, field) => {
                      conn.release();
                    }
                  );
                } else {
                  conn.query(
                    `INSERT INTO token (email, hash) VALUES (? ,?)`,
                    [req.body.email, token],
                    (error, results) => {
                      conn.release();
                    }
                  );
                }
              }
            );
          });

          return res.status(200).send({ token });
        }

        return res.status(401).send({ mensagem: "Falha na Autenticação0" });
      });
    });
  });
});

// logar com token
router.post("/login-token", (req, res, next) => {
  mysql.getConnection((err, conn) => {
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
          //return console.log(email)
          //return res.status(200).send({email: results[0]})

          const token = jwt.sign(
            {
              id: results[0].id,
              email: email
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1d"
            }
          );

          //console.log(token)

          conn.query(
            `UPDATE token SET hash = ? WHERE email = ?`,
            [token, email],
            (error, resultado, field) => {
              conn.release();
            }
          );
          return res.status(200).send({ token });
          //next();
        } else {
          return res.status(401).send({ erro: "Unauthorized" });
        }
        return;
      }
    );
    return;
  });
});

//buscando pelo id ok
router.post("/buscarid", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    conn.query(
      "SELECT * FROM tarefa WHERE id = ? ",
      [req.body.id],
      (error, resultado, fields) => {
        conn.release();

        if (resultado.length === 0) {
          return res.status(404).send({ error: "Não Encontrada esta Tarefa" });
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
router.post("/atualizar", login.logintoken, (req, res, next) => {
  // return console.log(req.body.id);
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: error });
    }
    conn.query(
      `UPDATE tarefa SET cliente = ?, marca = ?, modelo = ?, defeito = ?,  servicoexecutado = ?, status = ?, valor = ?,  datatarefa = ?, usuario = ? WHERE id = ?`,
      [
        req.body.cliente,
        req.body.marca,
        req.body.modelo,
        req.body.defeito,
        req.body.servicoexecutado,
        req.body.status,
        req.body.valor,
        req.body.datatarefa,
        req.body.usuario,
        req.body.id
      ],
      (error, resultado, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: "Erro" });
        }
        //console.log(resultado);
        const response = {
          mensagem: "Editada Com Sucesso"
        };
        return res.status(200).send(response);
      }
    );
  });
});

//apaga dados
router.post("/apagar", login.logintoken, (req, res, next) => {
  //return console.log(req.body.id);
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: "Erro" });
    }
    conn.query(
      `DELETE FROM tarefa WHERE id = ?`,
      [req.body.id],
      (error, resultado, field) => {
        conn.release();
        // return console.log(resultado);
        if (resultado.affectedRows === 0) {
          return res.status(404).send({ error: "Não Encontrado" });
        }
        if (error) {
          return res.status(500).send({ error: "Erro" });
        }

        const response = {
          mensagem: "Apagada Com Sucesso"
        };
        return res.status(200).send(response);
      }
    );
  });
});

//buscando pelo mes
//router.get('/:id_conta', (req, res, next) => {
router.post("/listardia", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    conn.query(
      "SELECT * FROM tarefa WHERE datatarefa = ? ORDER BY status DESC",
      [req.body.datatarefa],
      // ["07/12/2022"],
      (error, resultado, fields) => {
        conn.release();
        //return console.log(resultado.length);
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

//Marcar como Concluida
router.patch("/status", login.logintoken, (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) {
      return res.status(500).send({ error: "Erro" });
    }
    conn.query(
      `UPDATE tarefa SET status = ? WHERE id = ?`,
      [
        req.body.status,
        req.body.id
        //req.header.id
      ],
      (error, resultado, field) => {
        conn.release();
        if (error) {
          return res.status(500).send({ error: "Erro" });
        }
        const response = {
          mensagem: "Editada Com Sucesso"
        };
        return res.status(202).send(response);
      }
    );
  });
});

module.exports = router;
