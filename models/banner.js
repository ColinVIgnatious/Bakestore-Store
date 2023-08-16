const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    bannername: {
		type: String,
		required: true,
	},
	images: {
		type: String,
		required: true,
	},
	link: {
		type: String,
       
	},
	isActive: {
		type: Boolean,
		default: true,
	},
})

module.exports = mongoose.model('Banner', bannerSchema, 'banners')