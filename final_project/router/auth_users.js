const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => users.some(u => u.username === username);

const authenticatedUser = (username, password) =>
  users.some(u => u.username === username && u.password === password);

// Login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }
  const accessToken = jwt.sign({ data: password }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: "Inicio de sesión exitoso" });
});

// Agregar o modificar reseña
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Libro no encontrado" });
  if (!review) return res.status(400).json({ message: "Falta el parámetro review" });
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `Reseña del libro ${isbn} agregada/actualizada`,
    reviews: books[isbn].reviews
  });
});

// Eliminar reseña
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  if (!books[isbn]) return res.status(404).json({ message: "Libro no encontrado" });
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: "No tienes una reseña en este libro" });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({ message: `Reseña del libro ${isbn} eliminada`, reviews: books[isbn].reviews });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
