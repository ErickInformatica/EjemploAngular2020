'use strict'

var Encuesta = require('../models/encuesta')

function getEncuesta(req, res) {
    var encuestaId = req.params.id;
    Encuesta.findById(encuestaId, (err, encuesta)=>{
        if(err) return res.status(500).send({message: 'error en la encuesta'})
        if(!encuesta) return res.status(400).send({message: 'error al listar la encuesta'})
        return res.status(200).send({encuesta})
    })
}

function getEncuestas(req, res) {
    Encuesta.find().exec((err, encuestas)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion de Encuesta' })
        if(!encuestas) return res.sta(404).send({ message: 'Error al obtener las Encuestas'})

        return res.status(200).send({ encuestas })
    })
    
}

function addEncuestas(req, res) {
    var encuesta = new Encuesta();
    var params = req.body;

    if(params.titulo && params.descripcion){
        encuesta.titulo = params.titulo;
        encuesta.descripcion = params.descripcion;
        encuesta.opinion = {
            si: 0,
            no: 0,
            talvez: 0,
            usuariosOpinados: [] 
        }
        encuesta.user = req.user.sub
        encuesta.save((err, encuestaGuardada)=>{
            if(err) return res.status(500).send({ message: 'Error en la peticion de Encuesta' })
            if(!encuestaGuardada) return res.sta(404).send({ message: 'Error al agregar la Encuesta'})

            return res.status(200).send({ encuesta: encuestaGuardada })
        })

    }else{
        res.status(200).send({
            message: 'Rellene todos los datos necesarios'
        })
    }


}

function tipoOpinion(req, res, voto="") {
       var encuestaId = req.params.idEncuesta;
       var opinionUsuario = true;
                        // opinion.si o no o talvez
       var votoFinal = `opinion.${voto}`

       Encuesta.findById(encuestaId, (err, encuestaEncontrada)=>{
           if(err) return res.status(500).send({message: 'Error en la peticion de Encuesta'})
           if(!encuestaEncontrada) return res.status(404).send({message: 'Error al listar la Encuesta'})

           for(let x = 0; x < encuestaEncontrada.opinion.usuariosOpinados.length; x++){
               if(encuestaEncontrada.opinion.usuariosOpinados[x] === req.user.sub){
                    opinionUsuario =false;
                    return res.status(500).send({ message: "El usuario ya opino en esta encuesta" })
               }
           } // Termina For
           

           if(opinionUsuario === true){                 // { $inc: { "opinion.si" : 1 } }
               Encuesta.findByIdAndUpdate(encuestaId, { $inc: { [votoFinal]: 1 } }, { new: true }, (err, actualizado)=>{
                   if(err) return res.statu(500).send({message: 'Error en la peticion de la Opinion'})
                   if(!actualizado) return res.status(404).send({message: 'Error al Opinar en la Encuesta'})

                   actualizado.opinion.usuariosOpinados.push(req.user.sub)
                   actualizado.save()
                   return res.status(200).send({ opinion: actualizado })
               })
           }



       })

}

function opinionFinalUsuario(req, res) {
    var opinion = req.body.opinion.toLowerCase();
    if(opinion == "si" || opinion == "no" || opinion == "talvez"){
        tipoOpinion(req, res, opinion)
    }else{
        res.status(400).send({message: "Solo puede utilizar Si, No o Talvez"})
    }
}

function comentarEncuesta(req, res) {
    var encuestaId = req.params.encuestaId;
    var params = req.body;

    Encuesta.findByIdAndUpdate(encuestaId, { $push: { listaComentarios: { comentario: params.comentario, comentarioUsuario: req.user.sub } } }, {new: true},(err, comentario)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion del comentario' })
        if(!comentario) return res.status(404).send({ message: 'Error al guardar el Comentario' })
        return res.status(200).send({ comentario })
    })
}

function editarComentario(req, res) {
    var encuestaId = req.params.idEncuesta;
    var comentarioId = req.params.idComentario;
    var params = req.body;
    
    Encuesta.findOneAndUpdate({ _id: encuestaId, "listaComentarios._id": comentarioId }, { "listaComentarios.$.comentario": params.comentario }, { new: true }, (err, comentarioEditado)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion de la Encuesta' })
        if(!comentarioEditado) return res.status(404).send({message: 'Error al editar el Comentario de la Encuesta'})
        return res.status(200).send({ comentario: comentarioEditado })
    })
}

function getCometarios(req, res){
    var encuestaId = req.params.id;

    Encuesta.findById( encuestaId ).populate('listaComentarios.comentarioUsuario').exec((err, comentarios)=>{
        if(err) return res.status(500).send({message: 'error en la peticion de comentarios'})
        if(!comentarios) return res.status(404).send({message: 'error a listar los comentarios'})
        return res.status(200).send({comentarios: comentarios.listaComentarios})
    })
}

module.exports = {
    addEncuestas,
    opinionFinalUsuario,
    comentarEncuesta,
    editarComentario,
    getEncuestas,
    getEncuesta,
    getCometarios
}