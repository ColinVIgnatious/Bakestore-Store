const usermodel = require("../models/userModel");
const categorylist = require("../models/category");
const productlist = require("../models/product");
const couponlist = require("../models/coupon");
const orderlist = require("../models/order");
const bannerlist = require("../models/banner");
const userhelper = require("../helpers/userhelper");
const verificationhelper = require("../helpers/verificationhelper");
const bcrypt = require("bcrypt");
const sharp = require('sharp');
const moment = require("moment");
const puppeteer = require("puppeteer");
const excel = require("exceljs");

module.exports = {
  signin: async (req, res) => {
    try {
      res.render("admin/signin", { error: "" });
    } catch (error) {
      console.log(error.message);
    }
  },
  signinpost: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await usermodel.findOne({ email });
      if (!user) {
        return res.render("admin/signin", { error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.render("admin/signin", { error: "Invalid password" });
      }

      if (!user.isAdmin) {
        return res.render("admin/signin", { error: "Access denied" });
      }
      // Admin login successful Here you can generate and return a token or perform any other necessary actions
      req.session.admin=user
      res.redirect("/admin/homepage");
      console.log("Admin login successful");
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },

  homepage: async (req, res) => {
    try {
      
       const orders = await orderlist.aggregate([
       { $match: { orderStatus: 'Delivered' } },
       {
        $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$totalAmount' },
        count: { $sum: 1 },
        },
       },
        
         { $sort: { _id: 1 } },
        
         ])
        
        
        const data = orders.map(({ _id, total, count }) => ({ date: _id, amount: total, count }))
        
         res.render('admin/adminhomepage', { data })
      
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  userlist: async (req, res) => {
    try {const user = await usermodel.find();
      if (user) res.render("admin/userlist", { data: user });
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  },

  blockunblock: async (req, res) => {
    try {
      const user = await usermodel.findById(req.body.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isActive) user.isActive = false;
      else user.isActive = true;
      await user.save();
      res.json({ status: true, message: "User blocked successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  categorylist: async (req, res) => {
    try {const ITEMS_PER_PAGE =9
      const page=parseInt(req.query.page) || 1
      const skipItems=(page-1) * ITEMS_PER_PAGE
      const totalCount=await orderlist.countDocuments()
      const totalPages=Math.ceil(totalCount/ITEMS_PER_PAGE)
      const category = await categorylist.find().skip(skipItems)
      .limit(ITEMS_PER_PAGE)
      if (category) res.render("admin/categorylist", { data: category , currentPage:page, totalPages:totalPages});
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },


  addcategory: async (req, res) => {
    try {
      const errorMessage = req.query.errorMessage || null; // Get the error message from query parameters
    res.render("admin/addcategory", { errorMessage });
     
    } catch (error) {
      console.log(error.message);
    }
  },

  addcategorypost: async (req, res) => {
    const { productCategory, catdescription } = req.body;
    const data = {
      productCategory: productCategory,
      catdescription: catdescription,
    };
    
    data.images = [];
    console.log(req.files)
    if (req.files.length > 0) {
  
    for (let file of req.files) {
      const imageName = `cropped_${file.filename}`;
      await sharp(file.path)
          .resize(500, 600, { fit: "cover" })
          .toFile(`./public/images/uploads/${imageName}`);

      data.images.push(imageName);
      }
      // category.images = images;    
    } else {
      return res.status(400).json({ success: false, message: 'Please choose product image files' });
    }

    try {
      // Check if the category already exists
      const existingCategory = await categorylist.findOne({ productCategory });
      if (existingCategory) {
        const category = await categorylist.find(); // Fetch all categories for the view
        const errorMessage = "Category already exists"; // Set the error message
        return res.render("admin/addcategory", { category, errorMessage });
        
      }

      // Save the new category to the database
      const category = await categorylist.create(data);
      if (category) {
        const allCategories = await categorylist.find(); // Fetch all categories from the database
        res.redirect("/admin/categorylist");
      }
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  editcategory: async (req, res) => {
    try {
      const categoryId = req.query._id;
      const category = await categorylist.findById(categoryId);
      res.render('admin/editcategory', { category });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  editcategorypost: async (req, res) => {
    try { const category = req.body;
      const categoryId = req.body.id;
      console.log(categoryId)
      console.log(category)

      const images = [];
      if (req.files && req.files.length > 0) {
        for (let file of req.files) {
          const imageName = `cropped_${file.filename}`;
    
          await sharp(file.path)
            .resize(500, 600, { fit: 'cover' })
            .toFile(`./public/images/uploads/${imageName}`);
    
          images.push(imageName);
        }
        // Add the new cropped image filenames to the product.images array
        // product.images = images;
      }
      // Update the product with the new data, including the images array if available
      await categorylist.findByIdAndUpdate(categoryId, { $push: { images: { $each: images } } }, { new: true });
      const updatedCategory = await categorylist.findById(categoryId);
      updatedCategory.productCategory = req.body.productCategory;
      updatedCategory.catdescription = req.body.catdescription;
      await updatedCategory.save();
      res.redirect("/admin/categorylist");
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  productlist: async (req, res) => {
    try {const ITEMS_PER_PAGE =3 
      const page=parseInt(req.query.page) || 1
      const skipItems=(page-1) * ITEMS_PER_PAGE
      const totalCount=await productlist.countDocuments()
      const totalPages=Math.ceil(totalCount/ITEMS_PER_PAGE)
      const product = await productlist.find().populate('productCategory').skip(skipItems)
      .limit(ITEMS_PER_PAGE)
      console.log(product)
      if (product) res.render("admin/productlist", { data: product, currentPage:page, totalPages:totalPages });
    } catch (error) {
      console.error("Error getting product:", error);
      throw error;
    }
  },

  addproduct: async (req, res) => {
    try {
      const category = await categorylist.find();
      res.render("admin/addproduct", { data: category });
      
    } catch (error) {
      console.log(error.message);
    }
  },

  addproductpost: async (req, res) => {
    let product = req.body;
    const images = [];
    if (req.files.length > 0) {
    for (let file of req.files) {
      const imageName = `cropped_${file.filename}`;
      await sharp(file.path)
          .resize(920, 920, { fit: "cover" })
          .toFile(`./public/images/uploads/${imageName}`);

      images.push(imageName);
      }
      product.images = images;    
    } else {
      return res.status(400).json({ success: false, message: 'Please choose product image files' });
    }

    try {console.log(product)
    await productlist.create(product);
    res.redirect("/admin/productlist");
    } catch (error) {
      console.log(error.message);
    }
  },

  editproduct: async (req, res) => {
    try {
      const productId = req.query._id;
      console.log(productId)
      const product = await productlist.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const category = await categorylist.find();
      res.render('admin/editproduct', { products :product, category });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },
  
  editproductpost: async (req, res) => {
    const id = req.body.id;
    const product = req.body;
    const images = [];
    console.log(product)
  
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const imageName = `cropped_${file.filename}`;
  
        await sharp(file.path)
          .resize(920, 920, { fit: 'cover' })
          .toFile(`./public/images/uploads/${imageName}`);
  
        images.push(imageName);
      }
      // Add the new cropped image filenames to the product.images array
      // product.images = images;
    }
    // Update the product with the new data, including the images array if available
    await productlist.findByIdAndUpdate(id, { $push: { images: { $each: images } } }, { new: true });
    // await productlist.findByIdAndUpdate(id, { $set: { ...product } }, { new: true });
    try {
           if (req.body.status === '2') {
             await productlist.findByIdAndUpdate(id, { $set: { ...product, status: 'Delisted' } });
           } else {
         await productlist.findByIdAndUpdate(id, { $set: { ...product, status: 'Listed' } });
          }
          res.redirect('/admin/productlist');
        } catch (error) {
          console.log(error.message);
        }
      },
  
  couponlist: async (req, res) => {
        try {
          const ITEMS_PER_PAGE =3 
          const page=parseInt(req.query.page) || 1
          const skipItems=(page-1) * ITEMS_PER_PAGE
          const totalCount=await orderlist.countDocuments()
          const totalPages=Math.ceil(totalCount/ITEMS_PER_PAGE)
          const coupon = await couponlist.find().skip(skipItems)
          .limit(ITEMS_PER_PAGE)
            console.log(coupon)
            res.render("admin/couponlist", { coupon , currentPage:page, totalPages:totalPages});
          } catch (error) {
          console.log(error.message);
        }
      },
    
  addcoupon: async (req, res) => {
        try {
          res.render("admin/addcoupon");
        } catch (error) {
          console.log(error.message);
        }
      },
    
  addcouponpost: async (req, res) => {
        try {
              let coupon = req.body;
              await couponlist.create(coupon);
              res.redirect("/admin/couponlist");
        } catch (error) {
          console.log(error.message);
        }
      },
    
  editcoupon: async (req, res) => {
        try {const couponId = req.query._id;
          const coupon = await couponlist.findById(couponId)
          res.render("admin/editcoupon",{coupon});
        } catch (error) {
          console.log(error.message);
        }
      },
    
  editcouponpost: async (req, res) => {
      try {const couponId = req.body.id;
          const updatedCoupon = await couponlist.findById(couponId);
          updatedCoupon.code = req.body.code;
          updatedCoupon.description = req.body.description;
          updatedCoupon.discountType = req.body.discountType;
          updatedCoupon.discountAmount = req.body.discountAmount;
          updatedCoupon.minimumAmount = req.body.minimumAmount;
          updatedCoupon.expirationDate = req.body.expirationDate;
          updatedCoupon.maxRedemptions = req.body.maxRedemptions;
          
          await updatedCoupon.save();
          res.redirect("/admin/couponlist");
      } catch (error) {
      console.log(error.message);
      }
      },
          
  deleteImage: async (req, res) => {
        const { id, file } = req.body
        try {
          await productlist.findByIdAndUpdate(id, { $pull: { images: file } })
          res.status(200).json({ success: true })
        } catch (error) {
          console.error(error.message)
          res.status(500).json({ success: false, message: 'Image deleting failed' })
        }
      },
    
  orderlist: async (req, res) => {
        try {const ITEMS_PER_PAGE =3 
          const page=parseInt(req.query.page) || 1
          const skipItems=(page-1) * ITEMS_PER_PAGE
          const totalCount=await orderlist.countDocuments()
          const totalPages=Math.ceil(totalCount/ITEMS_PER_PAGE)
           const order = await orderlist.find({}).populate('user').skip(skipItems)
           .limit(ITEMS_PER_PAGE)
              res.render("admin/orderlist",{order, currentPage:page, totalPages:totalPages});
            } catch (error) {
              console.log(error.message);
            }
          },
    
  editorderlist: async (req, res) => {
            try { const orderId = req.query._id;
              const order = await orderlist.findById({_id:orderId}).populate('user items.productId')
              res.render("admin/orderdetail",{order});
            } catch (error) {
              console.log(error.message);
            }
          },
              
  editorderlistpost: async (req, res) => {
            try { const orderId = req.body.id;
              const orderStatus = req.body.status;
              console.log(orderStatus)
              await orderlist.findByIdAndUpdate(orderId, {orderStatus: orderStatus });
              res.redirect("/admin/orderlist");
            } catch (error) {
              console.log(error.message);
            }
          },

        salesreport: async (req, res, next) => {

           try {
          
           let { from, to } = req.query
          
          
           const today = moment().format('YYYY-MM-DD')
          
           const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
          
           const last7days = moment().subtract(7, 'days').format('YYYY-MM-DD')
          
           const last30days = moment().subtract(30, 'days').format('YYYY-MM-DD')
          
           const lastYear = moment().subtract(1, 'years').format('YYYY-MM-DD')
          
          
           if (!from || !to) {
           from = last30days
          
           to = today
          
           }
          
          
           if (from > to) [from, to] = [to, from]
          
           to += 'T23:59:59.999Z'
          
           const orders = await orderlist.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' }).populate(
          
           'user'
          
           )
        from = from.split('T')[0]
        to = to.split('T')[0]
        const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
        const netFinalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0)
        const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0)
        const dateRanges = [
          
         { text: 'Today', from: today, to: today },          
         { text: 'Yesterday', from: yesterday, to: yesterday },          
         { text: 'Last 7 days', from: last7days, to: today },          
         { text: 'Last 30 days', from: last30days, to: today },
         { text: 'Last year', from: lastYear, to: today },
          
           ]
          
           res.render('admin/salesreport', { orders, from, to, dateRanges, netTotalAmount, netFinalAmount, netDiscount })          
           } catch (error) {
            console.log(error)
           next(error)
          
           }
          
           },
  
  downloadReports: async (req, res, next) => {
            try {console.log("Hi")
              const { type } = req.params
              let { from, to } = req.query
              to += 'T23:59:59.999Z'
              const orders = await orderlist.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' }).populate(
                'user'
              )
              const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
              const netFinalAmount = orders.reduce((acc, order) => acc + order.finalPrice, 0)
              const netDiscount = orders.reduce((acc, order) => acc + order.discountAmount, 0)
        
              if (type === 'excel') {
                const workbook = new excel.Workbook()
                const worksheet = workbook.addWorksheet('Report')
        
                worksheet.columns = [
                  { header: 'SL. No', key: 's_no', width: 10 },
                  { header: 'Order ID', key: 'oid', width: 20 },
                  { header: 'Date', key: 'createdAt', width: 20 },
                  { header: 'User ID', key: 'userID', width: 20 },
                  { header: 'Total Price', key: 'totalAmount', width: 20 },
                  { header: 'Discount', key: 'discountAmount', width: 20 },
                  { header: 'Final Price', key: 'finalPrice', width: 20 },
                  { header: 'Payment Mode', key: 'paymentMode', width: 20 },
                ]
        
                worksheet.duplicateRow(1, 8, true)
                worksheet.getRow(1).values = ['Sales Report']
                worksheet.getRow(1).font = { bold: true, size: 16 }
                worksheet.getRow(1).alignment = { horizontal: 'center' }
                worksheet.mergeCells('A1:H1')
        
                worksheet.getRow(2).values = []
                worksheet.getRow(3).values = ['', 'From', from]
                worksheet.getRow(3).font = { bold: false }
                worksheet.getRow(3).alignment = { horizontal: 'right' }
                worksheet.getRow(4).values = ['', 'To', to.split('T')[0]]
                worksheet.getRow(5).values = ['', 'Total Orders', orders.length]
                worksheet.getRow(6).values = ['', 'Net Final Price', netFinalAmount]
        
                worksheet.getRow(7).values = []
                worksheet.getRow(8).values = []
        
                let count = 1
                orders.forEach((order) => {
                  order.s_no = count
                  order.oid = order._id.toString().replace(/"/g, '')
                  order.userID = order.user.email
                  worksheet.addRow(order)
                  count += 1
                })
        
                worksheet.getRow(9).eachCell((cell) => {
                  cell.font = { bold: true }
                })
        
                worksheet.addRow([])
                worksheet.addRow([])
        
                worksheet.addRow(['', '', '', '', '', '', 'Net Total Price', netTotalAmount, ''])
                worksheet.addRow(['', '', '', '', '', '', 'Net Discount Price', netDiscount, ''])
                worksheet.addRow(['', '', '', '', '', '', 'Net Final Price', netFinalAmount, ''])
                worksheet.lastRow.eachCell((cell) => {
                  cell.font = { bold: true }
                })
        
                await workbook.xlsx.writeFile('sales_report.xlsx')
                const file = `${__dirname}/../sales_report.xlsx`
                res.download(file)
              } else {
                const browser = await puppeteer.launch()
                const page = await browser.newPage()
        
                // Set content and styles for the PDF
                const content = `
                        <!DOCTYPE html>
                        <html lang="en">
        
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Document</title>
                            <style>
                                .text-center {
                                    text-align: center;
                                }
        
                                .text-end {
                                    text-align: end;
                                }
        
                                .table-container {
        
                                    width: 80%;
                                    margin: 0 auto;
                                    margin-top: 1.5rem;
                                    border-radius: 5px;
                                }
        
                                table {
                                    caption-side: bottom;
                                    border-collapse: collapse;
                                    margin-bottom: 1rem;
                                    vertical-align: top;
                                    border-color: #dee2e6;
                                    border: 1px solid #ccc;
                                    border-bottom: 1px solid #444;
                                    width: 80%;
                                    margin: 0 auto;
                                    margin-top: 1.5rem;
                                    border-radius: 10px;
                                }
        
                                thead {
                                    border-color: inherit;
                                    border-style: solid;
                                    border-width: 0;
                                    vertical-align: bottom;
                                }
        
                                tr {
                                    font-size: 12px;
                                    border-color: inherit;
                                    border-style: solid;
                                    border-width: 0;
                                }
        
                                td {
                                    border-color: inherit;
                                    border-style: solid;
                                    border-width: 0;
                                    padding: .5rem .5rem;
                                    background-color: transparent;
                                    border-bottom-width: 1px;
                                    box-shadow: inset 0 0 0 9999px #fff;
                                    max-width: 100px;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                }
        
                                .d-flex-column {
                                    display: flex;
                                    flex-direction: column;
                                }
        
                                .fw-bold {
                                    font-weight: bold;
                                }
        
                                * {
                                    font-size: 14px;
                                    color: #444;
                                }
                            </style>
                        </head>
        
                        <body>
                            <div>
                                <div class="text-center">
                                    <h6>Sales reports</span>
                                </div>
        
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope="col">SL. No</th>
                                            <th scope="col">Date</th>
                                            <th scope="col">User ID</th>
                                            <th scope="col">Quantity</th>
                                            <th scope="col">Total Price</th>
                                            <th scope="col">Discount</th>
                                            <th scope="col">Final Price</th>
                                            <th scope="col">Payment Mode</th>
                                        </tr>
                                    </thead>
                                    <tbody>
        
                                        ${orders
                          .map(
                            (order, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${order._id.toString().replace(/"/g, '')}</td>
                                            <td>${order.createdAt.toISOString().split('T')[0]}</td>
                                            <td>${order.user.email}</td>
                                            <td>${order.totalAmount}</td>
                                            <td>${order.discountAmount}</td>
                                            <td>${order.finalPrice}</td>
                                            <td>${order.paymentMode}</td>
                                        </tr>`
                          )
                          .join('')}
        
                                        <tr>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td>
                                                <div class="d-flex-column text-end">
                                                    <br>
                                                    <span>Net Total Price:</span>
                                                    <span>Net Discount:</span>
                                                    <span class="fw-bold">Net Final Price:</span>
                                                </div>
                                            </td>
                                            <td class="">
                                                <div class="d-flex-column">
                                                    <br>
                                                    <span>${netTotalAmount}</span>
                                                    <span>${netDiscount}</span>
                                                    <span class="fw-bold">${netFinalAmount}</span>
                                                </div>
                                            </td>
                                        </tr>
        
                                    </tbody>
                                </table>
        
                            </div>
                        </body>
        
                        </html>`
        
                await page.setContent(content)
                await page.pdf({ path: 'sales_report.pdf', format: 'A4' })
        
                await browser.close()
        
                const file = `${__dirname}/../sales_report.pdf`
                res.download(file)
              }
            } catch (error) {
              console.log(error)
              next(error)
            }
          },

      
    salesreportpost: async (req, res) => {
      try {
        const fromDate = new Date(req.query.fromDate);
        const toDate = new Date(req.query.toDate);
    
        // Fetch order data for the specified date range using the aggregate pipeline
        const orderData = await orderlist.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(new Date(fromDate).setHours(0, 0, 0)), // Start of the day
                $lte: new Date(new Date(toDate).setHours(23, 59, 59)), // End of the day
              },
              status: { $ne: "Cancelled" }, // Exclude orders with status "Cancelled"
            },
          },
        ]);
    
        // Get all unique product IDs from all orders
        const productIds = Array.from(new Set(orderData.flatMap((order) => order.items.map((items) => items.productId))));
    
        // Find the products with matching IDs
        const prod = await productlist.find({ _id: { $in: productIds } });
    
        // Create a Map to store product names with their IDs as keys
        const productMap = new Map(prod.map((product) => [product._id.toString(), product.productname]));
    
        // Prepare the orderDetails array with required data for rendering
        const orderDetails = orderData.map(ord => {
          const orderDate = new Date(ord.date);
          const year = orderDate.getFullYear();
          const month = getMonthName(orderDate.getMonth() + 1); // Get the month in words
          const date = orderDate.getDate();
          const formattedDate = `${date} ${month} ${year}`;
    
          const productsWithNames = ord.items.map(item => {
            const productName = productMap.get(item.productId.toString());
            return { ...item, productname: productName };
          });

          return {
            orderid: ord._id,
            name: ord.user.firstname, // Assuming the user object has a 'name' property
            mobile: ord.user.phonenumber, // Assuming the address object has an 'address' property
            grandTotal: ord.finalPrice, // Updated field name for the total amount
            status: ord.orderStatus, // Updated field name for the order status
            payment_method: ord.paymentMode, // Updated field name for the payment mode
            orderdate: formattedDate,
            // delivery_date: ord.delivery_date, 
            // Assuming there is a field called 'delivery_date'
            // return: ord.return.status, 
            // Assuming there is a field called 'return' with a 'status' property
            product: productsWithNames,
          };
        });
    
        // Respond with the combined data (orderDetails and salesReportResult)
        res.json({ orderDetails });
      } catch (error) {
        console.error('Error fetching sales report data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    },
    
    bannerlist: async (req, res) => {
      try {const ITEMS_PER_PAGE =9
        const page=parseInt(req.query.page) || 1
        const skipItems=(page-1) * ITEMS_PER_PAGE
        const totalCount=await orderlist.countDocuments()
        const totalPages=Math.ceil(totalCount/ITEMS_PER_PAGE)
        const banner = await bannerlist.find().sort({createdAt:-1}).skip(skipItems)
        .limit(ITEMS_PER_PAGE)
        if (banner) res.render("admin/bannerlist", { data: banner , currentPage:page, totalPages:totalPages});
      } catch (error) {
        console.error("Error getting banners:", error);
        throw error;
      }
    },
  
  
    addbanner: async (req, res) => {
      try {
        res.render("admin/addbanner");
      } catch (error) {
        console.log(error.message);
      }
    },
  
    addbannerpost: async (req, res) => {
      const { bannername,bannerurl } = req.body;
      let images = req.file.filename
              let imageName = `cropped_${images}`;
        await sharp(`./public/images/uploads/${images}`)
            .resize(1200, 1000, { fit: "cover" })
            .toFile(`./public/images/uploads/${imageName}`); 
        images=imageName  
      try {
        
        const banner = await bannerlist.create({bannername,bannerurl,images});
        if (banner) {
          const allBanners = await bannerlist.find(); 
          res.redirect("/admin/bannerlist");
        }
         } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  
    editbanner: async (req, res) => {
      try {
        const bannerId = req.query._id;
        const banner = await bannerlist.findById(bannerId);
        res.render('admin/editbanner', { banner });
      } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
      }
    },
  
    editbannerpost: async (req, res) => {
      try {const { bannername,_id,bannerurl } = req.body;
      const data = {bannername,bannerurl}
      if(req.file && req.file.filename){
      let images = req.file.filename
      console.log(req.file)
      let imageName = `cropped_${images}`;
        await sharp(`./public/images/uploads/${images}`)
            .resize(1200, 1000, { fit: "cover" })
            .toFile(`./public/images/uploads/${imageName}`);
  
       data.images=imageName
      }
        const banner = await bannerlist.findByIdAndUpdate(_id,data);
          
            res.redirect("/admin/bannerlist");
          
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Internal server error" });
        }
      },

    logout: async (req, res) => {
      try {
        delete req.session.admin
        res.redirect("/admin/");
      } catch (error) {
        console.log(error.message);
      }
    },  
  };
  
  
  
        


