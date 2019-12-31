const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');

const cors = require('./cors');
const Employees = require('../models/employees');


const employeeRouter = express.Router();

employeeRouter.use(bodyParser.json());

employeeRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Employees.find(req.query)
    .then((employees) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(employees);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Employees.create(req.body)
    .then((employee) => {
        console.log('employee Created ', employee);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(employee);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /employees');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Employees.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

employeeRouter.route('/:employeeId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {

    Employees.findById(req.params.employeeId)
    .then((employee) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(employee);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {

    res.statusCode = 403;
    res.end('POST operation not supported on /employees/'+ req.params.employeeId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Employees.findByIdAndUpdate(req.params.employeeId, {
        $set: req.body
    }, { new: true })
    .then((employee) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(employee);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Employees.findByIdAndRemove(req.params.employeeId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});
employeeRouter.route('/:employeeId/comments')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(employee.comments);
        }
        else {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null) {
            employee.comments.push(req.body);
            employee.save()
            .then((employee) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);                
            }, (err) => next(err));
        }
        else {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /employees/'
        + req.params.employeeId + '/comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {

    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null) {
            for (var i = (employee.comments.length -1); i >= 0; i--) {
                employee.comments.id(employee.comments[i]._id).remove();
            }
            employee.save()
            .then((employee) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);                
            }, (err) => next(err));
        }
        else {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});



employeeRouter.route('/:employeeId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null && employee.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(employee.comments.id(req.params.commentId));
        }
        else if (employee == null) {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {

    res.statusCode = 403;
    res.end('POST operation not supported on /employees/'+ req.params.employeeId
        + '/comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {



    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null && employee.comments.id(req.params.commentId) != null) {
            if (req.body.rating) {
                employee.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                employee.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            employee.save()
            .then((employee) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);                
            }, (err) => next(err));
        }
        else if (employee == null) {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {

    Employees.findById(req.params.employeeId)
    .then((employee) => {
        if (employee != null && employee.comments.id(req.params.commentId) != null) {
            employee.comments.id(req.params.commentId).remove();
            employee.save()
            .then((employee) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(employee);                
            }, (err) => next(err));
        }
        else if (employee == null) {
            err = new Error('employee ' + req.params.employeeId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = employeeRouter;