/**
 * require Model
 */
const _model = require("../models/ivrProgressModel");
const _baseModel = require("../models/baseModel");
var xml2js = require("xml2js");
// var dayjs = require("dayjs");
var moment = require("moment");

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
  FIELD_IVR_PROGRESS,
} = require("../helpers/constants");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

/**
 * API lưu lịch sử nghe IVR của khách hàng
 * - IVR_S: Vào IVR START
 * - IVR_1, IVR_2, IVR_3: vào câu hỏi 1, 2, ,3
 * - IVR_E: Vào IVR END
 */
exports.create = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let body = req.body;
    // console.log(body);
    let keyRequires = FIELD_IVR_PROGRESS.require;
    // let keyCheckEXISTS = FIELD_IVR_PROGRESS.checkExists;
    _logger.log("info", "create progress, body IVR " + JSON.stringify(body));

    if (!body)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    for (let index = 0; index < keyRequires.length; index++) {
      const element = keyRequires[index];

      if (body[element] === undefined || body[element] === null) {
        return next(
          new ResError(
            ERR_400.code,
            `${ERR_400.message_detail.missingKey} ${FIELD_IVR_PROGRESS.getName[element]}`
          ),
          req,
          res,
          next
        );
      }
    }

    if (req.body.CallGUID) {
      // lưu thông tin CallGUID hoàn chỉnh để tiện cho query (giá trị lấy 12 ký tự từ kí tự số 12)
      body.CallGUIDCustomize = req.body.CallGUID.substring(11, 23);
    } else {
      body.CallGUIDCustomize = null
      body.CallGUID = null
    }

    _logger.log("info", "start progress, create IVR " + JSON.stringify(body));
    const doc = await _model.create(db, dbMssql, body);
    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    _logger.log("info", "end progress, create IVR " + doc.insertedId);

    return res.status(SUCCESS_200.code).json({ _id: doc.insertedId });
  } catch (error) {
    next(error);
  }
};

/**
 *  API show report lịch sử click IVR của khách hàng
 * @param {Date} startDate ngày bắt đầu
 * @param {Date} endDate ngày kết thúc
 * @param {String} ternalID id của ternal
 * 
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-12
 * *** Dev: hainv
 * *** Lý do: họp team với BHS && Kplus yêu cầu tính theo công thức
 * 1. ReceivedCalls
 * 
 * = Các cuộc vào ACD (tức là giống cột ReceivedCalls trong report Incoming Call Trends)
 * 
 * 2. Thêm dòng Inbound Calls
 * 
 * Inbound Calls = TCDIVR + TCDACD
 */
exports.reportMonth2Date = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let { startDate, endDate, ternalID } = req.query;
    let { TCDIVR, TCDACD } = req.body;

    if (!startDate || !endDate || !ternalID || ternalID === 'undefined')
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);
    startDate = moment(startDate, "YYYY-MM-DD HH:mm:ss", true);
    endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss", true);
    ternalID = ternalID.split(",");

    // console.log(startDate.isValid());
    if (startDate.isValid() === false || endDate.isValid() === false)
      return next(
        new ResError(ERR_400.code, ERR_400.message_detail.inValid),
        req,
        res,
        next
      );

    if (ternalID.length == 0)
      return next(
        new ResError(ERR_400.code, `ternalID ${ERR_400.message_detail.isRequired}`),
        req,
        res,
        next
      );
    if (startDate > endDate)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    startDate = startDate.unix(); // seconds
    endDate = endDate.unix(); // seconds

    const doc = await _model.reportMonth2Date(db, dbMssql, {
      startDate,
      endDate,
      ternalID,
    });

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

    return res
      .status(SUCCESS_200.code)
      .json(handleDataReportMonth2Date(startDate, endDate, doc, TCDIVR, TCDACD));
  } catch (error) {
    next(error);
  }
};


function handleDataReportMonth2Date(startDate, endDate, data, TCDIVR, TCDACD) {
  let result = [];
  // Khởi tạo header fix cứng của bảng
  let header = ["EXTRACT", "MENU", "MTD"];

  let startDay = moment(startDate * 1000);
  let endDay = moment(endDate * 1000);
  let days = genDays(startDay, endDay);
  //   let rowTotalAgent = initRow('Total', item.extract, item.menu, data, days);
  let listRows = [
    { id: 'InboundCalls', extract: 'Inbound Calls', menu: '' },
    { id: 'ReceivedCalls', extract: 'Received calls', menu: 'RECEIVED CALLS' },
    { id: 'AsksForTransfer', extract: 'Asks for transfer', menu: '' },
    { id: 'NonTransferred', extract: 'Non transferred', menu: '' },
    { id: 'key-0', extract: 'Phím 0', menu: 'PROSPECT' },
    { id: 'key-1', extract: 'Phím 1', menu: 'RENEWAL CHANNELS INFORMATION' },
    { id: 'key-2', extract: 'Phím 2', menu: 'SUBSCRIPTION INFORMATION' },
    { id: 'key-3', extract: 'Phím 3', menu: 'TECHNICAL SUPPORT' },
    { id: 'key-31', extract: 'Phím 3.1', menu: 'RENEW BUT CAN’T WATCH' },
    { id: 'key-310', extract: 'Phím 3.1.0', menu: 'AGENT 3.1.0' },
    { id: 'key-32', extract: 'Phím 3.2', menu: 'LOST SIGNAL DUE TO BAD WEATHER' },
    { id: 'key-320', extract: 'Phím 3.2.0', menu: 'AGENT 3.2.0' },
    { id: 'key-30', extract: 'Phím 3.0', menu: 'AGENT 3.0' },
    { id: 'key-4', extract: 'Phím 4', menu: 'AGENT OTT SERVICES' },
    // {id: 'TotalAgent', extract: '', menu: 'TOTAL AGENT'},
  ]
  header = [...header, ...days];

  listRows.forEach(item => {
    result.push(initRow(item.id, item.extract, item.menu, data, TCDIVR, TCDACD, days))
  });

  return {
    header: header,
    data: result,
  };
}

function genDays(startDate, endDate) {
  const days = [];
  while (endDate >= startDate) {
    days.push(startDate.format("DD-MM"));
    startDate.add(1, "days");
  }
  return days;
}

function initRow(id, extract, menu, data, TCDIVR, TCDACD, days) {
  let result = { id, extract, menu };
  let mtd = 0;

  // item = 01/11 (ngày 1 tháng 11)
  days.forEach((item, index) => {
    let valueFound = data.find(i => i._id === item);

    let countIVR = 0;
    let countACD = 0;
    // TCDIVR đang để format là DD/MM nhưng item đang format là DD-MM nên cần đổi lại format thì mới mapping được

    // a Minh YC bỏ cuộc IVR
    // if(['ReceivedCalls', 'NonTransferred'].includes(id)){
    //     // countIVR = TCDIVR[item.replace('-', '/')] || 0;
    // }

    if (['InboundCalls', 'NonTransferred'].includes(id)) {
      countIVR = TCDIVR[item.replace('-', '/')] || 0;
      countACD = TCDACD[item.replace('-', '/')] || 0;
    }

    if (['ReceivedCalls'].includes(id)) {
      countACD = TCDACD[item.replace('-', '/')] || 0;
    }


    if (valueFound) {
      if (['NonTransferred'].includes(id)) {
        result[item] = countIVR + countACD - valueFound['AsksForTransfer'];
      } else
        result[item] = (valueFound[id] || 0) + countIVR + countACD;
    }
    else {
      result[item] = countIVR + countACD;
    }
    mtd += result[item];
  });

  result.mtd = mtd;

  return result;
}