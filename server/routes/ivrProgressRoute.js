const express = require('express');
let router = express.Router();
let _controller = require('../controllers/ivrProgressController');

router
    .route('/')
    .post(_controller.create);

router
    .route('/report-month-2-Date')
    .post(_controller.reportMonth2Date);

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
// router
//     .route('/:id([0-9a-f]{24})')
    // .get(_controller.getByIDIntro)

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/