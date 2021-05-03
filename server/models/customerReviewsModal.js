var moment = require("moment");
const { lowerCaseFirstLetter } = require("../helpers/functions");
exports.customerReviews = async (db, dbMssql, _query) => {
  try {
    let { startDate, endDate, ternalID, CallGUIDCustomize } = _query;

    startDate = moment(startDate, "YYYY-MM-DD HH:mm:ss").startOf('d')._d;
    endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss").endOf('d')._d;

    let agg = aggQuery(startDate, endDate, ternalID, CallGUIDCustomize);
    
    const doc = await db
      .collection(IVR_HISTORIES_COLLECTION)
      .aggregate(agg)
      .toArray();

    return doc;
  } catch (error) {
    throw new Error(error);
  }
};


function aggQuery(startDate, endDate, ternalID, CallGUIDCustomize) {
  let agg = [];
  let query = { CallGUIDCustomize: { $in: CallGUIDCustomize } };
  query.created_at_convert = {
    $gte: startDate,
    $lte: endDate,
  };
  query.ternalID = ternalID
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
    },
  });
  // query
  agg.push({ $match: query });
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
      CallGUIDCustomize: 1,
      CallGUID: 1
    }
  });

  return agg;
}