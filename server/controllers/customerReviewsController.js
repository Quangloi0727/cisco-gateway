/**
 * require Model
 */
const _model = require("../models/customerReviewsModal");

/**
 * require Controller
 */
const base = require("./baseController");

/**
 * require Helpers
 */

const {
  SUCCESS_200,
  ERR_400,
  ERR_404,
  ERR_500,
  CUSTOMER_REVIEWS,
} = require("../helpers/constants");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

/**
 * API lấy thông tin trả lời đánh giá của khách hàng
 */
exports.customerReviews = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let body = req.body;
    // console.log(body);
    let keyRequires = CUSTOMER_REVIEWS.require;
    let keyCheckEXISTS = CUSTOMER_REVIEWS.checkExists;
    _logger.log("info", "body customerReviews " + JSON.stringify(body));

    if (!body)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    for (let index = 0; index < keyRequires.length; index++) {
      const element = keyRequires[index];

      if (body[element] === undefined || body[element] === null) {
        return next(
          new ResError(
            ERR_400.code,
            `${ERR_400.message_detail.missingKey} ${CUSTOMER_REVIEWS.getName[element]}`
          ),
          req,
          res,
          next
        );
      }
    }

    _logger.log("info", "start, get customerReviews " + JSON.stringify(body));
    const doc = await _model.customerReviews(db, dbMssql, body);
    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    _logger.log("info", "end, get customerReviews " + JSON.stringify(doc));

    return res.status(SUCCESS_200.code).json({ result: doc });
  } catch (error) {
    next(error);
  }
};


