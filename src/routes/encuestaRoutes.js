'use strict'

var express = require('express')
var EncuestaController = require('../controllers/encuestaController')
var md_auth = require('../middlewares/authenticated')

// Rutas
var api = express.Router();
api.post('/encuesta', md_auth.ensureAuth, EncuestaController.addEncuestas)
api.put('/opinion/:idEncuesta', md_auth.ensureAuth, EncuestaController.opinionFinalUsuario)
api.post('/comentar/:encuestaId', md_auth.ensureAuth, EncuestaController.comentarEncuesta)
api.put('/editarComentario/:idEncuesta/:idComentario', md_auth.ensureAuth, EncuestaController.editarComentario)
api.get('/encuestas', md_auth.ensureAuth, EncuestaController.getEncuestas)
api.get('/encuesta/:id', md_auth.ensureAuth, EncuestaController.getEncuesta)
api.get('/coments/:id', md_auth.ensureAuth, EncuestaController.getCometarios)

module.exports = api;