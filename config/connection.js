const mongoose = require('mongoose')

module.exports = {
	connect: () => {
		mongoose
			.connect(process.env.DB_HOST, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(data => {
				console.log(`Mongodb connected with server: ${data.connection.host}`)
			})
			.catch(error => {
				console.error('Error connecting to MongoDB:', error)
			})
	},
}