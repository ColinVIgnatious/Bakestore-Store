const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
	productname: {
		type: String,
		required: [true, 'Please enter product name'],
		trim: true,
	},
	description: {
		type: String,
		required: [true, 'Please enter product description'],
	},
	productCategory: {
		type: mongoose.Schema.ObjectId,
		ref: 'Category',
		required: [true, 'Please enter product category'],
	},
	mrp: {
		type: Number,
		required: [true, 'Please enter product MRP'],
		min: 0,
	},
	price: {
		type: Number,
		required: [true, 'Please enter product price'],
		min: 0,
	},
	stock: {
		type: Number,
		required: [true, 'Please enter product stock'],
		maxlength: [4, 'Stock cannot exceed limit'],
		default: 1,
		min: 0,
	},
	images: [{ type: String, required: true }],
	avgRating: {
		type: Number,
		default: 4.3,
	},
	numOfReviews: {
		type: Number,
		default: 12,
	},
	reviews: [
		{
			user: {
				type: mongoose.Schema.ObjectId,
				ref: 'User',
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			rating: {
				type: Number,
				min: 1,
				max: 5,
				required: true,
			},
			comment: {
				type: String,
			},
		},
	],
	status: {
		type: String,
		enum: ['Listed', 'Delisted', 'draft'],
		required: true,
        default:'Listed'
	}
	
});



module.exports = mongoose.model('Product', productSchema, 'products')