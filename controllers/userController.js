const usermodel = require("../models/userModel");
const userhelper = require("../helpers/userhelper");
const productlist = require("../models/product");
const cartlist = require("../models/cart");
const couponlist = require("../models/coupon");
const orderlist = require("../models/order");
const categorylist = require("../models/category");
const bannerlist = require("../models/banner");
const verificationhelper = require("../helpers/verificationhelper");
const bcrypt = require("bcrypt");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const { Console } = require("console");

module.exports = {
  signin: async (req, res) => {
    try {
      res.redirect("/")
    } catch (error) {
      res.statusCode = 500;
      next(error);
    }
  },
  signup: async (req, res) => {
    try {
      res.render("users/signup");
    } catch (error) {
      console.log(error.message);
    }
  },

  signupin: async (req, res) => {
    try {
      const phone = "+91" + req.body.phonenumber;
      const otp = req.body.otp;
      verificationhelper.verifyotp(phone, otp, (status) => {
        console.log(status);
        if (status === "approved") {
          const { firstname, lastname, phonenumber, email, password } =
            req.body;
          let data = {
            firstname: firstname,
            lastname: lastname,
            phonenumber: phonenumber,
            email: email,
            password: password,
          };
          userhelper.addUser(data, (stat) => {
            console.log(stat);
            if (stat == "DONE") {
              res.redirect("/login");
            } else res.redirect("/signup");
          });
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  sendotp: async (req, res) => {
    try {
      const phone = "+91" + req.body.phonenumber;
      verificationhelper.sendotp(phone, (status) => {
        if (status === "pending") {
          res.json({ status: "OTP_SEND" });
        } else res.json({ status: "ERROR_SENDING_OTP" });
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  login: async (req, res) => {
    try {
      if (req.session.user) res.redirect("/homepage");
      else {
       
        res.render("users/signin", { error: " " });
      }
    } catch (error) {
      console.log(error.message);
    }
  },

  loginpage: async (req, res) => {
    const { email, password } = req.body;
    let data = { email: email, password: password };

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and Password required" });
    }

    try {
      const user = await usermodel.findOne({ email }).select("+password");
      if (!user) {
        return res.render("users/signin", {
          error: "Invalid Email or Password",
        });
      }
      const status = await bcrypt.compare(data.password, user.password);

      if (!status) {
        return res.render("users/signin", {
          error: "Invalid Email or Password",
        });
      }

      if (!user.isActive) {
        return res.render("users/signin", { error: "Account Blocked" });
      }

      req.session.user = user;
      res.redirect("/");
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  },

  forgotpassword: async (req, res) => {
    try {
          res.render("users/forgotpassword");
        } catch (error) {
      res.statusCode=500
      console.log(error.message);
    }
  },

  forgotpasswordpost: async (req, res) => {
    try {
        const phone = "+91" + req.body.phonenumber;
        const otp = req.body.otp;
        verificationhelper.verifyotp(phone, otp, async (status) => {
            console.log(status);
            if (status === "approved") {
                const { phonenumber, email, password } = req.body;
                const user = await usermodel.findOne({ email });                
                if (user) {
                    user.password = await bcrypt.hash(password, 10);
                    await user.save();
                    res.redirect("/");
                    
                } else {
                    res.status(404).json({ message: "User not found" });
                }
            } else {
                // Handle the scenario when OTP verification fails
                res.status(400).json({ message: "OTP verification failed" });
            }
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal server error" });
    }
},
      
  homepage: async (req, res) => {
    try {
      let products = await productlist.find();
      const category = await categorylist.find();
      const banner = await bannerlist.find();
      const productCountByCategory = await productlist.aggregate([
        {
          $group: {
            _id: "$productCategory", // Group products by category
            productCount: { $sum: 1 }, // Calculate the count of products in each group
          },
        },
      ]);
      res.render("users/homepage", {
        products: products,
        category,
        banner,
        productCountByCategory,
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  categoryproducts: async (req, res) => {
    try {
      const ITEMS_PER_PAGE = 3;
      const page = parseInt(req.query.page) || 1;
      const skipItems = (page - 1) * ITEMS_PER_PAGE;
      const totalCount = await productlist.countDocuments();
      const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
      const categoryId = req.params.categoryId;
      const products = await productlist
        .find({ productCategory: categoryId })
        .skip(skipItems)
        .limit(ITEMS_PER_PAGE);
      const category = await categorylist.find();

      // Find all products that belong to the specified category
      // const products = await productlist.find({ productCategory : categoryId });

      // You can render your products page with the 'products' data
      res.render("users/categoryproducts", {
        products,
        category,
        categoryId,
        currentPage: page,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error.message);
    }
  },

  productdetails: async (req, res) => {
    try {
      const productId = req.params.id;
      const category = await categorylist.find();
      const product = await productlist.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.render("users/productdetails", { product, category });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  shoppingcart: async (req, res) => {
    try {
      const category = await categorylist.find();
      const userId = req.session.user._id;
      const coupon = req.query;
      const cart = await cartlist
        .findOne({ user: userId })
        .populate({ path: "products.product" });
      res.render("users/shoppingcart", { cart, category, coupon });
      console.log(cart.products);
    } catch (error) {
      console.log(error.message);
    }
  },

  updatecartpost: async (req, res) => {
    const userId = req.session.user._id;
    const { productId, quantity } = req.body;
    console.log(req.body);
    try {
      let cart = await cartlist.findOne({ user: userId });

      if (cart.products.length === 0) {
        cart.products.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      } else {
        let i;
        for (i = 0; i < cart.products.length; i++) {
          if (cart.products[i].product == productId) {
            cart.products[i].quantity = Number(quantity);
            res.status(200).json({ success: true });

            break;
          }
        }

        console.log(i);
        if (i === cart.products.length) {
          cart.products.push({ product: productId, quantity });
          res.status(200).json({ success: true });
        }
      }
      cart.save();
    } catch (error) {
      console.log(error.message);
    }
  },

  removefromcart: async (req, res) => {
    try {
      const { cartId, productId } = req.params;

      // Find the cartlist document by ID
      const cart = await cartlist.findById(cartId);

      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      // Find the index of the product in the "products" array
      const productIndex = cart.products.findIndex(
        (product) => product.product.toString() === productId
      );
      console.log(productIndex);
      if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found in cart" });
      }

      // Remove the product from the "products" array
      cart.products.splice(productIndex, 1);

      // Save the updated cartlist document
      const updatedCart = await cart.save();
      res.redirect("/shoppingcart");
      // Respond with the updated cart or a success message
    } catch (error) {
      console.error("Error deleting product from cart:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  confirmorder: async (req, res) => {
    const userId = req.session.user._id;
    const { productId, quantity } = req.body;
    console.log();
    try {
      const user = await usermodel.findById(userId);
      if (user.cart.length === 0) {
        user.cart.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      }
      res.render("users/confirmorder");
    } catch (error) {
      console.log(error.message);
    }
  },

  addtocartpost: async (req, res) => {
    const userId = req.session.user._id;
    const { productId, quantity } = req.body;
    console.log(req.body);
    
    try {
      
      let cart = await cartlist.findOne({ user: userId });

      if (cart == null) {
        cart = await cartlist.create({ user: userId });
      }
      if (cart.products.length === 0) {
        cart.products.push({ product: productId, quantity });
        res.status(200).json({ success: true });
      } else {
        let i;
        for (i = 0; i < cart.products.length; i++) {
          if (cart.products[i].product == productId) {
            cart.products[i].quantity += Number(quantity);
            res.status(200).json({ success: true });

            break;
          }
        }

        console.log(i);
        if (i === cart.products.length) {
          cart.products.push({ product: productId, quantity });
          res.status(200).json({ success: true });
        }
      }
      cart.save();
    
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  },

  checkout: async (req, res) => {
    try {
      console.log(req.query);
      const category = await categorylist.find();
      const couponId = req.params.id;
      const discountAmount = req.params.discountAmount;
      const priceAfterCoupon = req.params.priceaftercoupon;
      console.log(couponId);
      const userId = req.session.user._id;
      const cart = await cartlist
        .findOne({ user: userId })
        .populate({ path: "products.product" });
      const user = await usermodel.findById(userId);
      const coupon = await couponlist.findById(couponId);

      res.render("users/checkout", { user, cart, category, coupon });
    } catch (error) {
      console.log(error.message);
    }
  },

  checkoutpost: async (req, res) => {
    const user = req.session.user;
    const { address, coupon, paymentType } = req.body;
    try {
      const cart = await cartlist
        .findOne({ user: user._id })
        .populate({
          path: "products.product",
          select: "price stock",
        })
        .select("-price");

      let updateOperations = [];
      let isAvailable = true;
      for (const item of cart.products) {
        if (item.quantity > item.product.stock) {
          isAvailable = false;
          break;
        }
        updateOperations.push({
          updateOne: {
            filter: { _id: item.product._id.toString() },
            update: { $inc: { stock: -item.quantity } },
          },
        });
      }

      if (!isAvailable)
        return res
          .status(404)
          .json({ success: false, message: "Some items are out of stock" });

      const result = await productlist.bulkWrite(updateOperations);

      if (result.modifiedCount !== cart.products.length)
        return res
          .status(500)
          .json({
            success: false,
            message: "Something went wrong, Pls try again later",
          });

      const orderItems = [];
      cart.products.forEach((item) => {
        const tmp = {
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        };
        orderItems.push(tmp);
      });

      // TODO
      let addressdetail;
      user.address.forEach((item) => {
        if (item._id.toString() == address) addressdetail = item;
      });
      let discountAmount = 0;
      if (coupon) {
        const coupons = await couponlist.findById(coupon);
        discountAmount = coupons.discountAmount;
      }
      const orderData = {
        user: user,
        items: orderItems,
        address: addressdetail,
        discountAmount,
        paymentMode: paymentType,
        finalPrice: 0,
        totalAmount: 0,
      };
      const order = await orderlist.create(orderData);
      if (paymentType === "cashondelivery") {
        order.save();
        await cartlist.findOneAndUpdate({ user }, { products: [] });
        res.status(200).json({ success: true, url:`/orderdetails/${order._id}`});
      } else if (paymentType === "onlinepayment") {
        const razorpay_order = await razorpay.orders.create({
          amount: order.finalPrice * 100,
          currency: "INR",
          receipt: order._id.toString(),
        });
        order.paymentData = razorpay_order;
        order.save();
        res.status(200).json({ success: true, url:`/orders/payment?oid=${order._id}`});
      } else if (paymentType === "wallet") {
        order.save();

      } else {
        res
          .status(500)
          .json({ success: false, message: "Pls select a payment option" });
      }
    } catch (e) {
      console.error(e);
    }
  },

  payment: async (req, res) => {

    const category = await categorylist.find();
    const { oid: orderId } = req.query;
    const order = await orderlist.findById(orderId);
    console.log(order);
    if (order.orderStatus === "pending") {
      res.render("users/payment", {
        category,
        order,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
      });
    }
  },

  checkPayment: async (req, res) => {
    const userId = req.session.user._id;
    const { razorpayOrderId, razorpayPaymentId, secret } = req.body;
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    let generatedSignature = hmac.digest("hex");
    if (generatedSignature == secret) {
      await orderlist.findOneAndUpdate(
        { "paymentData.id": razorpayOrderId },
        { orderStatus: "placed" }
      );
      await cartlist.findOneAndUpdate({ user: userId }, { products: [] });
      res.status(200).json({ success: true });
    } else res.status(400).json({ success: false });
  },

  orderdetails: async (req, res) => {
    try {
      const category = await categorylist.find();
      const orderId = req.params.id;
      const userId = req.session.user._id;
      const user = await usermodel.findById(userId);
      const order = await orderlist.findById(orderId).populate("items.productId user");
      console.log(order)
      // const orderlists = JSON.stringify(order)
      // const order = await orderlist.findById(orderId)

//  if (order.length>0) {
//        let orderDetails = order.map(ord => {
// return {
                   
//                     status: ord.orderStatus,
                    
// }
// })
//  }
      res.render("users/orderdetails", { order, user, category });
    } catch (error) {
      console.log(error.message);
    }
  },

  orderlist: async (req, res) => {
    try {
      const category = await categorylist.find();
      const userId = req.session.user._id;
      const user = await usermodel.findById(userId);
      const order = await orderlist
        .find({ user: userId })
        .populate("items.productId");
      res.render("users/orderlist", { order, user, category });
    } catch (error) {
      console.log(error.message);
    }
  },

  editorderdetailspost: async (req, res) => {
    try { const orderId = req.params.id;
      // const orderStatus = req.body.status;
      console.log(orderId)
      await orderlist.findByIdAndUpdate(orderId, {orderStatus: "Cancelled" });
      res.redirect("/orderlist");
    } catch (error) {
      console.log(error.message);
    }
  },

  addalternateaddress: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const address = req.body.address;
      const city = req.body.city;
      const state = req.body.state;
      const pincode = req.b
      ody.pincode;
      const user = await usermodel.findByIdAndUpdate(
        userId,
        {
          $push: {
            address: {
              address: address,
              city: city,
              state: state,
              pincode: pincode,
            },
          },
        },
        { new: true }
      );
      res.redirect("/checkout");
    } catch (error) {
      console.log(error.message);
    }
  },

  addcoupon: async (req, res) => {
    try {
      const totalAmountInCart = req.query.total;
      console.log(totalAmountInCart);
      const category = await categorylist.find();
      const coupons = await couponlist.find({
        minimumAmount: { $lt: totalAmountInCart },
      });
      console.log(coupons);
      res.render("users/coupon", { coupons, category });
    } catch (error) {
      console.log(error.message);
    }
  },

  addcouponpost: async (req, res) => {
    const shouldRedirect = true;
    if (shouldRedirect) {
      res.json({ redirect: true });
    } else {
      res.json({ redirect: false });
    }
  },

  userprofile: async (req, res) => {
    try {
      const category = await categorylist.find();
      const userId = req.session.user._id;
      const user = await usermodel.findById(userId);
      res.render("users/userprofile", { user, category });
    } catch (error) {
      console.log(error.message);
    }
  },
  userprofilepost: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const email = req.body.email;
      const phonenumber = req.body.phonenumber;
      const user = await usermodel.findByIdAndUpdate(
        userId,
        { email, phonenumber },
        { new: true }
      );
      res.render("users/userprofile", { user });
    } catch (error) {
      console.log(error.message);
    }
  },
  addaddress: async (req, res) => {
    try {
      const category = await categorylist.find();
      const userId = req.session.user._id;
      const user = await usermodel.findById(userId);
      res.render("users/addaddress", { user, category });
    } catch (error) {
      console.log(error.message);
    }
  },
  addaddresspost: async (req, res) => {
    try {
      const category = await categorylist.find();
      const userId = req.session.user._id;
      const address = req.body.address;
      const city = req.body.city;
      const state = req.body.state;
      const pincode = req.body.pincode;
      const user = await usermodel.findByIdAndUpdate(
        userId,
        {
          $push: {
            address: {
              address: address,
              city: city,
              state: state,
              pincode: pincode,
            },
          },
        },
        { new: true }
      );

      res.render("users/addaddress", { user, category });
    } catch (error) {
      console.log(error.message);
    }
  },

  logout: async (req, res) => {
    try {
      delete req.session.user;
      res.redirect("/login");
    } catch (error) {
      console.log(error.message);
    }
  },

  getAllListedProducts: async (req, res, next) => {
		try {
			const { categoryId } = req.params
      const category = await categorylist.find({});
			const page  = req.query.page || 1
      let categoryID
      if(categoryId!='all')
		 categoryID = await categorylist.findById(categoryId)

			const decodedURL = decodeURIComponent(req.query.f)

			const sortStatus = req.query.sort
			const sort = {}
			if (sortStatus === 'price-asc') sort.price = 1
			else if (sortStatus === 'price-dec') sort.price = -1
			else if (sortStatus === 'new') sort.createdAt = -1

			let filter = {}
      
			const query = req.query.q || ''
			const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			if (escapedQuery !== 'undefined') {
				filter = { productname: { $regex: new RegExp(escapedQuery, 'i') } 
						},
						
					{ title: 1 }
			} else {
				filter.status = 'Listed'
			}
console.log(decodedURL)
if (decodedURL !== 'undefined') {
  filter.price= {
    $gte: decodedURL.split(",")[0],
    $lte: decodedURL.split(",")[1]
  }
  
} else {filter.status = 'Listed'}
			

			const categories = await categorylist.aggregate([
				
				
				{ $group: { _id: null, values: { $push: '$productCategory' } } },
			])
const RESULTS_PER_PAGE=3
			if (categoryId !== 'all') filter.productCategory = categoryID._id
			const documentCount = await productlist.countDocuments(filter)
			let products = await productlist.find(filter)
				.sort(sort)
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)

			const filterOptionsCounts = await productlist.aggregate([
        {
          $match: filter
          
        },
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [100, 200, 300,400,500], // Define your range boundaries here
            default: "Other", // Default bucket name for values outside the specified ranges
            // output: {
            //   count: { $sum: 1 },
            //   values: { $push: "$price" }
            // }
          }
        }
      ])
      console.log(filterOptionsCounts)

			res.render('users/categoryproducts', {
				products, 
				categories: categories[0].values,
			 filterOptionsCounts,
				decodedURL,
				currentPage:page,
				totalPages,
				searchQuery: query,
        categoryId,
        category
			})
		} catch (error) {
			next(error)
		}
	},
};
