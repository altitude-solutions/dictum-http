/**
 *
 * @title:             Estacion de servicio
 *
 * @author:            Javier Contreras
 * @email:             javier.contreras@altitudesolutions.org
 *
 * @description:       This code will handle http requests from clients at Service Station for LPL
 *
 **/


const express = require('express');
const app = express();

const Sequelize = require('sequelize');
const Op = Sequelize.Op

// ===============================================
// Middlewares
// ===============================================
const { verifyToken } = require('../middlewares/authentication');
const { VentaDeCombustible } = require('../Models/VentaDeCombustibles');

app.post('/ventaCombustible', verifyToken, (req, res) => {
    let body = req.body;
    let user = req.user;

    // ===============================================
    // Validator to see the latest value
    // select * from venta_de_combustible where movil=${movil} and fechaYHora=(select max(fechaYHora) from venta_de_combustible where movil=${movil});
    // ===============================================
    if (user.permisos.includes('es_escribir')) {
        if (body.movil == 'Bidon') {
            VentaDeCombustible.create(body)
                .then(saved => {
                    res.json({
                        message: 'Guardado',
                        saved: true
                    });
                }).catch(err => {
                    res.status(500).json({
                        err
                    });
                });
        } else {
            VentaDeCombustible.max('fechaYHora', {
                where: {
                    movil: body.movil
                }
            }).then(maxValue => {
                if (!maxValue) {
                    VentaDeCombustible.create(body)
                        .then(saved => {
                            res.json({
                                message: 'Guardado',
                                saved: true
                            });
                        }).catch(err => {
                            res.status(500).json({
                                err
                            });
                        });
                } else {
                    VentaDeCombustible.findOne({
                        where: {
                            movil: body.movil,
                            fechaYHora: maxValue
                        }
                    }).then(lastReg => {
                        if (Number(body.kilometraje) <= Number(lastReg.toJSON().kilometraje)) {
                            res.json({
                                message: `El kilometraje no puede ser menor al kilometraje del anterior registro (${lastReg.toJSON().kilometraje}Km)`,
                                saved: false
                            });
                        } else {
                            VentaDeCombustible.create(body)
                                .then(saved => {
                                    res.json({
                                        message: 'Guardado',
                                        saved: true
                                    });
                                }).catch(err => {
                                    res.status(500).json({
                                        err
                                    });
                                });
                        }
                    }).catch(err => {
                        res.status(500).json({
                            err
                        });
                    });
                }
            }).catch(err => {
                res.status(500).json({
                    err
                });
            });
        }
    } else {
        return res.status(403).json({
            err: {
                message: 'Acceso denegado'
            }
        });
    }
});


app.get('/ventaCombustible', verifyToken, (req, res) => {
    let offset = Number(req.query.from) || 0;
    let limit = Number(req.query.to) || 1000;
    let user = req.user;
    let initialDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours() - 24, new Date().getMinutes(), 0, 0).getTime()
    let where = {
        fechaYHora: {
            [Op.gte]: initialDate
        }
    };
    if (user.permisos.includes('es_leer')) {
        VentaDeCombustible.findAndCountAll({
            offset,
            limit,
            where
        }).then(reply => {
            res.json({
                ventas: reply.rows,
                count: reply.count
            })
        }).catch(err => {
            res.status(500).json({
                err
            });
        });
    } else {
        res.status(403).json({
            err: {
                message: 'Acceso denegado'
            }
        });
    }
});

app.get('/ventaCombustible/:id', verifyToken, (req, res) => {
    let user = req.user;
    res.status(501).json({});
});

app.put('/ventaCombustible/:id', verifyToken, (req, res) => {
    let user = req.user;
    res.status(501).json({});
});

app.delete('/ventaCombustible/:id', verifyToken, (req, res) => {
    let user = req.user;
    res.status(501).json({});
});


module.exports = app;