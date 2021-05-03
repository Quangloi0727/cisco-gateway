const ObjectID = require("mongodb").ObjectID;
const fetch = require("node-fetch");
var xml2js = require("xml2js");

/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

exports.getCustomerCode = async (db, dbMssql, query) => {
  try {
    let { phoneNumber } = query;

    const options = {
      method: _config.KPlus.getCustomerCode.method,
      body: soapXMLCustomerCode(phoneNumber),
      headers: { "Content-Type": "text/xml" },
    };

    return await fetch(_config.KPlus.getCustomerCode.endPointUrl, options)
      .then((res) => res.text())
      .then((res) => {
        return xml2js.parseStringPromise(res);
      }).catch(err => {
        throw new Error(err);
      });
  } catch (error) {
    throw new Error(error);
  }
};

function soapXMLCustomerCode(phoneNumber) {
  return `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body xmlns:ns1="GatewayService">
      <ns1:processMessage soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
          <ns1:methodName xsi:type="xsd:string">GetSubscriberNumber</ns1:methodName>
          <ns1:idBase xsi:type="xsd:string">Vstv</ns1:idBase>
          <ns1:inputData xsi:type="xsd:string">
              <![CDATA[<param><phonenumber>${phoneNumber}</phonenumber></param>]]>
          </ns1:inputData>
      </ns1:processMessage>
  </soap:Body>
</soap:Envelope>`;
}

exports.getExpireDate = async (db, dbMssql, query) => {
  try {
    let { smartCardNumber } = query;

    const options = {
      method: _config.KPlus.getCustomerCode.method,
      body: soapXMLExpireDate(smartCardNumber),
      headers: { "Content-Type": "text/xml" },
    };

    return await fetch(_config.KPlus.getCustomerCode.endPointUrl, options)
      .then((res) => res.text())
      .then((res) => {
        return xml2js.parseStringPromise(res);
      }).catch(err => {
        throw new Error(err);
      });
  } catch (error) {
    throw new Error(error);
  }
};


function soapXMLExpireDate(smartCardNumber) {
  return `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Header />
  <soap:Body xmlns:ns1="GatewayService">
     <ns1:processMessage soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <ns1:methodName xsi:type="xsd:string">GetExpireDate</ns1:methodName>
        <ns1:idBase xsi:type="xsd:string">Vstv</ns1:idBase>
        <ns1:inputData xsi:type="xsd:string"><![CDATA[<param><smartcardnumber>${smartCardNumber}</smartcardnumber></param>]]></ns1:inputData>
     </ns1:processMessage>
  </soap:Body>
</soap:Envelope>`;
}