'use strict'

// IMPORTS
var bcrypt = require("bcrypt-nodejs");
var User = require('../models/user')
var jwt = require("../services/jwt")
var path = require("path")
var fs = require('fs')

function ejemplo(req, res) {
    res.status(200).send({ message: 'hola'})
}

function registrar(req, res) {
    var user = new User();
    var params = req.body;

    if (params.nombre && params.usuario && params.password) {
        user.nombre = params.nombre;
        user.usuario = params.usuario;
        user.email = params.email;
        user.rol = 'ROLE_USUARIO';
        user.image = null;

        User.find({
            $or: [
                { usuario: user.usuario },
                { email: user.email }
            ]
        }).exec((err, usuarios) => {
            if (err) return res.status(500).send({ message: 'Error en la peticion de usuarios' })

            if (usuarios && usuarios.length >= 1) {
                return res.status(500).send({ message: 'El usuario ya existe' })
            } else {
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, usuarioGuardado) => {
                        if (err) return res.status(500).send({ message: 'Error al guardar el Usuario' })

                        if (usuarioGuardado) {
                            res.status(200).send({ user: usuarioGuardado })
                        } else {
                            res.status(404).send({ message: 'no se ha podido registrar el usuario' })
                        }
                    })
                })
            }
        })

    } else {
        res.status(200).send({
            message: 'Rellene todos los datos necesarios'
        })
    }
}

function login(req, res) {
    var params = req.body;

    User.findOne({email: params.email}, (err, user)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'})
        
        if(user){
            bcrypt.compare(params.password, user.password, (err, check)=>{
                if(check){
                    if(params.gettoken){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    }else{
                        user.password = undefined;
                        return res.status(200).send({ user })
                    }
                }else{
                    return res.status(404).send({message: 'el usuario no se a podido identificar'})
                }
            })
        }else{
            return res.status(404).send({message: 'el usuario no se a podido logear'})
        }
    })
}

function editarUsuario(req, res) {
    var userId = req.params.idUsuario;
    var params = req.body

    // BORRAR LA PROPIEDAD DE PASSWORD PARA NO SER EDITADA
    delete params.password
    console.log(req.user.sub);
    
    if(userId != req.user.sub){
        return res.status(500).send({ message: 'no tiene los permisos para actulizar este usuario' })
    }

    User.findByIdAndUpdate(userId, params, { new: true }, (err, usuarioActualizado)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion' })
        if(!usuarioActualizado) return res.status(404).send({ message: 'No se a podido actualizar los datos del Usuario' })

        return res.status(200).send({ usuario: usuarioActualizado })
    })
}

function getUsers(req, res) {
    User.find((err, usuarios)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion de Usuarios' })
        if(!usuarios) return res.status(404).send({ message: 'Error en la consulta de Usuarios' })
        return res.status(200).send({ usuarios })
    })
    // OPCION ALTERNA PARA FIND
    // User.find().exec((err, usuarios)=>{

    // })
}

function getUser(req, res) {
    var userId = req.params.idUsuario;
    // User.find({ _id: userId }, (err, usuario)=>{})
    // User.findOne({ _id: userId }, (err, usuario)=>{})
    User.findById(userId, (err, usuario)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion del Usuario' })
        if(!usuario) return res.status(404).send({ message: 'Error en la obtencion del Usuario' })
        return res.status(200).send({ usuario })
    })
}

function deleteUser(req, res) {
    var userId = req.params.id;

    if(userId != req.user.sub){
        return res.status(500).send({ message: 'Usted no tiene el permiso de eliminar este Usuario' })
    }

    // User.findById(userId, (err, usuarioEliminado)=>{
    //     usuarioEliminado.remove((err, eliminado)=>{})
    // })
    User.findByIdAndDelete(userId, (err, usuarioEliminado)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion de eliminar el Usuario' })
        if(!usuarioEliminado) return res.status(404).send({ message: 'Error al eliminar el Usuario' })
        return res.status(200).send({ usuario: usuarioEliminado })
    })
}

function subirImagen(req, res) {
    var userId = req.params.id;

    if(req.files){
        var file_path = req.files.image.path
        console.log(file_path);

        var file_split = file_path.split('\\');
        console.log(file_split);

        // src\uploads\users\nombre.png <---- Nombre Archivo
        var file_name = file_split[3]    
        console.log(file_name);

        // Split Eliminar punto "imagen.png"
        var ext_split = file_name.split('\.')
        console.log(ext_split);

        // [nombre, png] <-- Obtener Extension
        var file_ext = ext_split[1]
        console.log(file_ext)

        // Pasar texto a minusculas
        var file_ext_Lower = file_ext.toLowerCase();
        console.log(file_ext_Lower);

        if(file_ext_Lower == 'png' || file_ext_Lower == 'jpg' || file_ext_Lower == 'jpeg' || file_ext_Lower == 'gif'){
            User.findByIdAndUpdate(userId, { image: file_name }, { new: true }, (err, usuarioActualizado)=>{
                if(err) return res.status(500).send({ message: 'No se a podido actualizar la imagen del Usuario' })
                if(!usuarioActualizado) return res.status(404).send({ message: 'Error en los datos del Usuario' })
                return res.status(200).send({ usuarioImagen: usuarioActualizado })
            })
        }else{
            return removeFilesOfUploads(res, file_path, 'Extension no Valida')
        }    
    
    }
}
//                            res, 'C:\Users\Desktop, 'Error extension no valida'
function removeFilesOfUploads(res, file_path, mensaje) {
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({ message: mensaje })
    })
}


function obtenerImagen(req, res) {
    var nombreImagen = req.params.image;
    var path_file = `./src/uploads/users/${nombreImagen}`
                    // './src/uploads/users/' + nombreImagen

    fs.exists(path_file, (exists)=>{
        if(exists){
            res.sendFile(path.resolve(path_file))
        }else{
            res.status(404).send({message: 'no existe la imagen'})
        }
    })
}



module.exports = {
    registrar,
    login,
    ejemplo,
    editarUsuario,
    getUser,
    getUsers,
    deleteUser,
    subirImagen,
    obtenerImagen
}