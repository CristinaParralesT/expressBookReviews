const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Registro de usuario
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ message: "El usuario ya existe" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "Usuario registrado exitosamente. Ya puedes iniciar sesión" });
});

// Endpoint interno que entrega los datos (la fuente para Axios)
public_users.get("/books-data", (req, res) => {
  res.status(200).json(books);
});

// Todos los libros (async/await con Axios)
public_users.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los libros" });
  }
});

// Por ISBN (promesas con Axios)
public_users.get("/isbn/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  axios.get(`${BASE_URL}/books-data`)
    .then(response => {
      const book = response.data[isbn];
      if (book) return res.status(200).json(book);
      return res.status(404).json({ message: "Libro no encontrado" });
    })
    .catch(() => res.status(500).json({ message: "Error al buscar por ISBN" }));
});

// Por autor (async/await con Axios)
public_users.get("/author/:author", async (req, res) => {
  try {
    const author = req.params.author.toLowerCase();
    const response = await axios.get(`${BASE_URL}/books-data`);
    const result = Object.keys(response.data)
      .filter(k => response.data[k].author.toLowerCase() === author)
      .map(k => ({ isbn: k, ...response.data[k] }));
    if (result.length === 0) return res.status(404).json({ message: "No hay libros de ese autor" });
    return res.status(200).json({ booksbyauthor: result });
  } catch (error) {
    return res.status(500).json({ message: "Error al buscar por autor" });
  }
});

// Por título (promesas con Axios)
public_users.get("/title/:title", (req, res) => {
  const title = req.params.title.toLowerCase();
  axios.get(`${BASE_URL}/books-data`)
    .then(response => {
      const result = Object.keys(response.data)
        .filter(k => response.data[k].title.toLowerCase() === title)
        .map(k => ({ isbn: k, ...response.data[k] }));
      if (result.length === 0) return res.status(404).json({ message: "No hay libros con ese título" });
      return res.status(200).json({ booksbytitle: result });
    })
    .catch(() => res.status(500).json({ message: "Error al buscar por título" }));
});

// Reseñas de un libro
public_users.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
