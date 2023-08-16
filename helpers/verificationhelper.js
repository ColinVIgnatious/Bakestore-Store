const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

module.exports.sendotp = (phonenumber, callback) => {
  client.verify.v2
    .services(process.env.VERIFYSID)
    .verifications.create({ to: phonenumber, channel: "whatsapp" })
    .then((verification) => callback(verification.status))
    .catch((verification) => callback(verification.status));

};
module.exports.verifyotp = (phonenumber, otpCode, callback) => {
  client.verify.v2
    .services(process.env.VERIFYSID)
    .verificationChecks.create({ to: phonenumber, code: otpCode })
    .then((verification_check) => callback(verification_check.status))
    .catch((verification_check) => callback(verification_check.status));
};