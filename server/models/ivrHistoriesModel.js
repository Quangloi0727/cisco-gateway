const ObjectID = require("mongodb").ObjectID;
const fetch = require("node-fetch");
var xml2js = require("xml2js");

/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

/**
 * Tạo lịch sử bấm ivr của khách hàng
 * target - IVR_1, IVR_2, IVR_3: vào câu hỏi 1, 2, ,3
 */
exports.create = async (db, dbMssql, body) => {
  try {
    let { RouterCallKey, code, target, ternalID, RouterCallKeyDay, PhoneNumber, CallGUID,CallGUIDCustomize } = body;

    let _insert = {
      RouterCallKey,
      code,
      ternalID,
      CallGUID,
      CallGUIDCustomize,
      RouterCallKeyDay,
      PhoneNumber,
      is_deleted: false,
      created_at: (Date.now() / 1000) | 0,
    }

    if(target){
      _insert.target = target;
    }

    const doc = await db.collection(IVR_HISTORIES_COLLECTION).insertOne(_insert);
    // insertedCount: 1, insertedId: 5e6ce37d6b261d103030ca39

    return doc;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API show report lịch sử click IVR của khách hàng
 */
exports.reportMonth2Date = async (db, dbMssql, _query) => {
  try {
    let { startDate, endDate, ternalID } = _query;
    let agg = aggQuery(startDate, endDate, ternalID);

    const doc = await db
      .collection(IVR_HISTORIES_COLLECTION)
      .aggregate(agg)
      .toArray();

    return doc;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * query, group aggregate IVR History
 * @param {Date} startDate ngày bắt đầu
 * @param {Date} endDate ngày kết thúc
 * @param {String} ternalID id của ternal
 *
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-12
 * *** Dev: hainv
 * *** Lý do: họp team với BHS && Kplus yêu cầu tính theo công thức
 * 1. update cách tính NonTransferred:
 *
 * NonTransferred = Inbound Call - Asks for transfer
 * 2. bỏ TotalAgent
 *
 */
function aggQuery(startDate, endDate, ternalID) {
  let agg = [];
  let query = { ternalID: { $in: ternalID } };

  query.created_at = {
    $gte: startDate,
    $lte: endDate,
  };

  // query
  agg.push({ $match: query });

  // add field created_at_convert
  agg.push({
    $addFields: {
      created_at_convert: {
        $convert: {
          input: { $multiply: ["$created_at", 1000] },
          to: "date",
          onError: "Error",
          onNull: 0,
        },
      },
      // trong trường hợp lệch dữ liệu có thể do lúc lưu dữ liệu đang để timestamp, nếu cần có thể add thêm timezone vào.
      // created_at_convert: {
      //   $convert: {
      //     input: { $add: [{$multiply: [ "$created_at", 1000 ]}, 7*60*60*1000] },
      //     to: "date",
      //     onError: "Error",
      //     onNull: NumberDecimal("0"),
      //   },
      // },
    },
  });

  // add field dateMonth, dateMonthYear
  agg.push({
    $project: {
      _id: 1,
      RouterCallKey: 1,
      code: 1,
      ternalID: 1,
      RouterCallKeyDay: 1,
      PhoneNumber: 1,
      is_deleted: 1,
      created_at: 1,
      created_at_convert: 1,
      dateMonth: {
        $concat: [
          {
            $toString: {
              $cond: [
                { $lte: [{ $dayOfMonth: "$created_at_convert" }, 9] },
                {
                  $concat: [
                    "0",
                    { $toString: { $dayOfMonth: "$created_at_convert" } },
                  ],
                },
                { $toString: { $dayOfMonth: "$created_at_convert" } },
              ],
            },
          },
          "-",
          {
            $toString: {
              $cond: [
                { $lte: [{ $month: "$created_at_convert" }, 9] },
                {
                  $concat: [
                    "0",
                    { $toString: { $month: "$created_at_convert" } },
                  ],
                },
                { $toString: { $month: "$created_at_convert" } },
              ],
            },
          },
        ],
      },
      dateMonthYear: {
        $concat: [
          {
            $toString: { $hour: "$created_at_convert" },
          },
          "-",
          {
            $toString: { $dayOfMonth: "$created_at_convert" },
          },
          "-",
          {
            $toString: { $month: "$created_at_convert" },
          },
          "-",
          {
            $toString: { $year: "$created_at_convert" },
          },
        ],
      },
    },
  });

  // group by field dateMonth
  agg.push({
    $group: {
      _id: "$dateMonth",
      created_at_convert: { $first: "$created_at_convert" },
      // ReceivedCallsInfo: {
      //   $push: {
      //     RouterCallKey: "$RouterCallKey",
      //     RouterCallKeyDay: "$RouterCallKeyDay",
      //     PhoneNumber: "$PhoneNumber",
      //     code: "$code",
      //     dateMonthYear: "$dateMonthYear",
      //   },
      // },
      AsksForTransfer: {
        $sum: {
          $switch: {
            branches: [
              { case: { $eq: ["$code", "0"] }, then: 1 },
              { case: { $eq: ["$code", "1"] }, then: 1 },
              { case: { $eq: ["$code", "310"] }, then: 1 },
              { case: { $eq: ["$code", "320"] }, then: 1 },
              { case: { $eq: ["$code", "30"] }, then: 1 },
              { case: { $eq: ["$code", "4"] }, then: 1 },
            ],
            default: 0,
          },
        },
      },
      // TotalAgent: {
      //   $sum: {
      //     $switch: {
      //       branches: [
      //         { case: { $eq: ["$code", "0"] }, then: 1 },
      //         { case: { $eq: ["$code", "1"] }, then: 1 },
      //         { case: { $eq: ["$code", "310"] }, then: 1 },
      //         { case: { $eq: ["$code", "320"] }, then: 1 },
      //         { case: { $eq: ["$code", "30"] }, then: 1 },
      //         { case: { $eq: ["$code", "4"] }, then: 1 },
      //       ],
      //       default: 0,
      //     },
      //   },
      // },

      // NonTransferred: {
      //   $sum: {
      //     $switch: {
      //       branches: [
      //         { case: { $eq: ["$code", "2"] }, then: 1 },
      //       ],
      //       default: 0,
      //     },
      //   },
      // },
      ...genKeySumAgg("0"),
      ...genKeySumAgg("1"),
      ...genKeySumAgg("2"),
      ...genKeySumAgg("3"),
      ...genKeySumAgg("31"),
      ...genKeySumAgg("310"),
      ...genKeySumAgg("32"),
      ...genKeySumAgg("320"),
      ...genKeySumAgg("30"),
      ...genKeySumAgg("4"),
    },
  });

  // sort
  agg.push({
    $sort: {
      created_at_convert: 1,
    },
  });

  return agg;
}

/**
 * Query Tính tổng số lần bấm phím IVR
 * @param {string} value phím bấm IVR
 */
function genKeySumAgg(value) {
  let obj = {};
  obj[`key-${value}`] = {
    $sum: {
      $switch: {
        branches: [{ case: { $eq: ["$code", value] }, then: 1 }],
        default: 0,
      },
    },
  };
  return obj;
}
