const express = require('express');
let router = express.Router();
let convertController = require('../controllers/convertController');
// Get Subscriber Number
router
    .route('/')
    .get(convertController.getCustomerCode)

// Get expire date: ngày hết hạn của thẻ
router
    .route('/expire-date')
    .get(convertController.getExpireDate)

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
// router
//     .route('/:id([0-9a-f]{24})')
    // .get(convertController.getByIDIntro)

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/