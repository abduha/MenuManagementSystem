const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');

const Order = require('../models/order');
const Dishes = require('../models/dishes');
const User = require('../models/user');
const orderRouter = express.Router();

orderRouter.use(bodyParser.json());
orderRouter.route('/')
.get(authenticate.verifyUser,function (req, res, next) {
        Order.find({'user': req.user})
            .populate('user')
            .populate('dishes')
            .exec(function (err, orders) {
                if (err) return err;
                res.json(orders);
            });
    })
.post(authenticate.verifyUser, function (req, res, next) {

        Order.find({'user': req.user})
            .exec(function (err, orders) {
                if (err) throw err;
                req.body.user = req.user;

                if (orders.length) {
                    var orderAlreadyExist = false;
                    if (orders[0].dishes.length) {
                        for (var i = (orders[0].dishes.length - 1); i >= 0; i--) {
                            orderAlreadyExist = orders[0].dishes[i] == req.body._id;
                            if (orderAlreadyExist) break;
                        }
                    }
                    if (!orderAlreadyExist) {
                        orders[0].dishes.push(req.body._id);
                        orders[0].save(function (err, order) {
                            if (err) throw err;
                            res.json(order);
                        });
                    } else {
                        res.json(orders);
                    }

                } else {

                    Order.create({user: req.body.user}, function (err, order) {
                        if (err) throw err;
                        order.dishes.push(req.body._id);
                        order.save(function (err, order) {
                            if (err) throw err;
                            res.json(order);
                        });
                    })
                }
            });
    })
	
	
.delete(authenticate.verifyUser, (req, res, next) => {

    Order.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

orderRouter.route('/:dishId')
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Orders.findOne({user: req.user._id})
    .then((orders) => {
        if (!orders) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "orders": orders});
        }
        else {
            if (orders.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "orders": orders});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "orders": orders});
            }
        }

    }, (err) => next(err))
    .catch((err) => next(err))
})
.post(authenticate.verifyUser, (req, res, next) => {
    if(mongoose.Types.ObjectId.isValid(req.params.dishId)) {
        //Dishes.findById(mongoose.Types.ObjectId(req.params.dishId))
        Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (dish != null) {
                //console.log("dish: ", dish);
                Order.findOne({user: req.user._id})
                .then((orders) => {
                    //console.log("order: ", orders);
                    if (orders != null){
                        //orders = orders[0];

                        if (orders.dishes.indexOf(mongoose.Types.ObjectId(req.params.dishId)) === -1){
                            console.log("**1");
                            orders.dishes.push(req.params.dishId);
                            orders.save()
                            .then((orders) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(orders);
                            }, (err) => next(err))
                            .catch((err) => next(err));
                        } //Error not returned if it is already in the list.
                    }else{
                        Order.create({user: req.user._id})
                        .then((orders) => {
                            orders.dishes.push(mongoose.Types.ObjectId(req.params.dishId));
                            orders.save()
                            .then((orders) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(orders);
                            }, (err) => next(err))
                        }, (err) => next(err))
                        .catch((err) => next(err));
                    }
                }, (err) => next(err))
                .catch((err) => next(err));
            }else {
                err = new Error('Dish ' + req.params.dishId + ' is not in the database.');
                err.status = 404;
                return next(err);
            }

        }, (err) => next(err))
        .catch((err) => next(err));
    }else{
        err = new Error('Dish ' + req.params.dishId + ' is not in the database.');
        err.status = 404;
        return next(err);
    }

})
.delete(authenticate.verifyUser, function (req, res, next) {

        Order.find({'user': req.user}, function (err, orders) {
            if (err) return err;
            var order = orders ? orders[0] : null;

            if (order) {
                for (var i = (order.dishes.length - 1); i >= 0; i--) {
                    if (order.dishes[i] == req.params.dishId) {
                        order.dishes.remove(req.params.dishId);
                    }
                }
                order.save(function (err, order) {
                    if (err) throw err;
                    res.json(order);
                });
            } else {
                res.json(order);
            }

        });
    });

module.exports = orderRouter;