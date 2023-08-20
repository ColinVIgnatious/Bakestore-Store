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
	bannerurl: {
		type: String,
       
	},
	isActive: {
		type: Boolean,
		default: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	  }
})

module.exports = mongoose.model('Banner', bannerSchema, 'banners')