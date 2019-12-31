const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authenticate = require('../authenticate');

const cors = require('./cors');
const Menues = require('../models/menues');

const menuRouter = express.Router();

menuRouter.use(bodyParser.json());
menuRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors,(req,res,next) => {
    Menues.find(req.query)
	.populate('comments.author')
    .then((menues) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(menues);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Menues.create(req.body)
    .then((menu) => {
        console.log('Menu Created ', menu);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(menu);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /menues');
})
.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {

    Menues.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

menuRouter.route('/:menuId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Menues.findById(req.params.menuId)
	.populate('comments.author')
    .then((menu) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(menu);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /menues/'+ req.params.menuId);
})
.put(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    Menues.findByIdAndUpdate(req.params.menuId, {
        $set: req.body
    }, { new: true })
    .then((menu) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(menu);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {

    Menues.findByIdAndRemove(req.params.menuId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});
menuRouter.route('/:menuId/comments')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Menues.findById(req.params.menuId)
	.populate('comments.author')
    .then((menu) => {
        if (menu != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(menu.comments);
        }
        else {
            err = new Error('Menu ' + req.params.menuId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Menues.findById(req.params.menuId)
    .then((menu) => {
        if (menu != null) {
			req.body.author = req.user._id;
            menu.comments.push(req.body);
            menu.save()
            .then((menu) => {
				Menues.findById(menu._id)
				.populate('comments.author')
				.then((menu)=>{
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(menu); })               
            }, (err) => next(err));
        }
        else {
            err = new Error('Menu ' + req.params.menuId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /menues/'
        + req.params.menuId + '/comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    Menues.findById(req.params.menuId)
    .then((menu) => {
        if (menu != null) {
            for (var i = (menu.comments.length -1); i >= 0; i--) {
                menu.comments.id(menu.comments[i]._id).remove();
            }
            menu.save()
            .then((menu) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(menu);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Menu ' + req.params.menuId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

menuRouter.route('/:menuId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get((req,res,next) => {
    Menues.findById(req.params.menuId)
    .populate('comments.author')    
    .then((menu) => {
        if (menu != null && menu.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(menu.comments.id(req.params.commentId));
        }
        else if (menu == null) {
            err = new Error('Menu ' + req.params.menuId + ' not found');
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
.post( cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /menues/'+ req.params.menuId
        + '/comments/' + req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Menues.findById(req.params.menuId)
    .then((menu) => {
        if (menu != null && menu.comments.id(req.params.commentId) != null) {
            if (req.body.rating) {
                menu.comments.id(req.params.commentId).rating = req.body.rating;
            }
            if (req.body.comment) {
                menu.comments.id(req.params.commentId).comment = req.body.comment;                
            }
            menu.save()
            .then((menu) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(menu);                
            }, (err) => next(err));
        }
        else if (menu == null) {
            err = new Error('Dish ' + req.params.menuId + ' not found');
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
.delete(cors.corsWithOptions, authenticate.verifyUser,authenticate.verifyAdmin, (req, res, next) => {
    Menues.findById(req.params.menuId)
    .then((menu) => {
        if (menu != null && menu.comments.id(req.params.commentId) != null) {
            menu.comments.id(req.params.commentId).remove();
            menu.save()
            .then((menu) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(menu);                
            }, (err) => next(err));
        }
        else if (menu == null) {
            err = new Error('Menu ' + req.params.menuId + ' not found');
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


module.exports = menuRouter;