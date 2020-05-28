'use strict'

var express = require("express")
var UserController = require("../controllers/userController")
var md_auth = require("../middlewares/authenticated")

// SUBIR IMAGEN
var multiparty = require('connect-multiparty')
var md_subir = multiparty({ uploadDir: './src/uploads/users' })


//RUTAS
var api = express.Router()
api.post('/registrar', UserController.registrar)
api.post('/login', UserController.login)
api.get('/ejemplo', md_auth.ensureAuth ,UserController.ejemplo)
api.put('/editar-usuario/:idUsuario', md_auth.ensureAuth, UserController.editarUsuario)
api.get('/usuarios', md_auth.ensureAuth, UserController.getUsers)
api.get('/usuario/:idUsuario', md_auth.ensureAuth, UserController.getUser)
api.delete('/eliminar-usuario/:id', md_auth.ensureAuth, UserController.deleteUser)
api.post('/subir-imagen-usuario/:id', [ md_auth.ensureAuth, md_subir ], UserController.subirImagen)
api.get('/obtener-imagen/:image', UserController.obtenerImagen)


module.exports = api;