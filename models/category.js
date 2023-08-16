const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
	productCategory: {
		type: String,
		required: [true, 'Please Enter Category name'],
		unique: [true, 'Please Enter diff Category name'],
	},
	catdescription: {
		type: String,
        required:true,
	},
	images: [{ type: String, required: true }],

	
})
module.exports = mongoose.model('Category', categorySchema, 'categories')