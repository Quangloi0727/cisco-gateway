const express = require('express');
let router = express.Router();
let _controller = require('../controllers/customerReviewsController');

router
    .route('/')
    .post(_controller.customerReviews);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/