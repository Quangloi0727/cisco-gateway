
/**
 * require Model
 */
const _model = require('../models/convertModel');
const _baseModel = require('../models/baseModel');
var xml2js = require("xml2js");

/**
 * require Controller
 */
const base = require('./baseController');

/**
 * require Helpers
 */

const {
    SUCCESS_200,
    ERR_400,
    ERR_404,
    ERR_500,
} = require('../helpers/constants');


/**
 * require Utils
 */
const ResError = require('../utils/resError');
const APIFeatures = require('../utils/apiFeatures');

exports.getCustomerCode = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        // let { phoneNumber } = req.query;
        _logger.log("info",`start getCustomerCode, request: ${JSON.stringify(req.query)}`);

        const doc = await _model.getCustomerCode(db, dbMssql, req.query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

        if(doc["soap:Envelope"] && doc["soap:Envelope"]["soap:Body"] && doc["soap:Envelope"]["soap:Body"][0]){
            let messageResponse = doc["soap:Envelope"]["soap:Body"][0]["ns1:processMessageResponse"];
            console.log("messageResponse", messageResponse);
            if(messageResponse && messageResponse[0] && messageResponse[0].return && messageResponse[0].return[0]){
                console.log("return", messageResponse[0].return);
                let messageResponseReturn = await xml2js.parseStringPromise(messageResponse[0].return[0]);
                let subscriberid = messageResponseReturn.message.body[0].subscriberid[0];
                let numcontract = messageResponseReturn.message.body[0].numcontract[0];
                console.log('subscriberid:', subscriberid, 'numcontract:', numcontract);
                if( !numcontract ) {
                    console.log(`getCustomerCode: numcontract not exists with subscriberid: ${subscriberid}`);
                    numcontract = -1;
                }

                if(subscriberid != "") return res.status(SUCCESS_200.code).send(`${subscriberid},${numcontract}`);
            }
        }
        _logger.log("info", `end getCustomerCode, ${JSON.stringify(req.query)}, response: ${JSON.stringify(doc)}`);
        return res.status(ERR_404.code).send(ERR_404.message);
    } catch (error) {
        _logger.log("info",JSON.stringify(error));
        next(error);
    }
}

exports.getExpireDate = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        // let { phoneNumber } = req.query;
        _logger.log("info",`start getExpireDate ${JSON.stringify(req.query)}`);
        const doc = await _model.getExpireDate(db, dbMssql, req.query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

        if(doc["soap:Envelope"] && doc["soap:Envelope"]["soap:Body"] && doc["soap:Envelope"]["soap:Body"][0]){
            let messageResponse = doc["soap:Envelope"]["soap:Body"][0]["ns1:processMessageResponse"];
            console.log("messageResponse", messageResponse);
            if(messageResponse && messageResponse[0] && messageResponse[0].return && messageResponse[0].return[0]){
                console.log("return", messageResponse[0].return);
                let messageResponseReturn = await xml2js.parseStringPromise(messageResponse[0].return[0]);
                let finabo = messageResponseReturn.message.body[0].finabo;
                if(finabo && finabo.length > 0 && finabo[0] != "") {
                    let [day, month, year] = finabo[0].split("/");
                    return res.status(SUCCESS_200.code).send({day, month, year});
                }
            }
        }
        _logger.log("info", `end getExpireDate, ${JSON.stringify(req.query)}, response: ${JSON.stringify(doc)}`);
        return res.status(ERR_404.code).send(ERR_404.message);
    } catch (error) {
        _logger.log("info",JSON.stringify(error));
        next(error);
    }
}

/**
 * Test Soap: dựa vào response
 * input: response soap success/fail
 * output: dữ liệu cần sử dụng cho API convert
 */
// logSoapResponse();

async function logSoapResponse() {
    let result = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ns1:processMessageResponse xmlns:ns1="GatewayService"><return>&lt;message type="response:GetExpireDate"&gt;&lt;body&gt;&lt;finabo&gt;15/02/2021&lt;/finabo&gt;&lt;/body&gt;&lt;/message&gt;</return></ns1:processMessageResponse></soap:Body></soap:Envelope>`
    let doc = await xml2js.parseStringPromise(result);
    // console.log(doc["soap:Envelope"]["soap:Body"]);
    let messageResponse = doc["soap:Envelope"]["soap:Body"][0]["ns1:processMessageResponse"];
    // console.log("messageResponse", messageResponse);
    if(messageResponse && messageResponse[0] && messageResponse[0].return && messageResponse[0].return[0]){
        console.log("return", messageResponse[0].return);
        let messageResponseReturn = await xml2js.parseStringPromise(messageResponse[0].return[0]);
        // console.log(messageResponseReturn.message.body[0]);
        let finabo = messageResponseReturn.message.body[0].finabo;
        if(finabo && finabo.length > 0 && finabo[0] != "") console.log({finabo: finabo[0]});
    }
}