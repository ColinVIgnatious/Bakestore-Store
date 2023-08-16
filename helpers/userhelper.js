

const usermodel = require("../models/userModel");
const bcrypt = require("bcrypt");
module.exports.addUser = async (data, callback) => {
	console.log(data)
    let mail = data.email.trim().toLowerCase()
	let { password } = data
	const count = await usermodel.countDocuments({ email : mail })

	if (count > 0) callback("USER_ALREADY_EXISTS")
	else {

		data.password = await bcrypt.hash(password, 10)
        usermodel.create(data)
			.then(() => {
				callback("DONE")
			})
			.catch(() => {
				callback("FAILED")
			})
	}
}
module.exports.checkUser = async (data, callback) => {
    console.log(data)
	let email=data.email
	const count = await usermodel.findOne({ email })
		if(count)
		{
			let pass=await bcrypt.compare(data.password,count.password)
			if(pass)
			callback(true)
			else
			callback(false)
		}

}