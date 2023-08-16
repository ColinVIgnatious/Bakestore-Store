const express = require("express");
const admin_route = express();
const auth = require('../middlewares/auth');

const adminController = require("../controllers/adminController");
const upload = require("../config/multer")
const setcache = require('../middlewares/cacheControlMiddleware');

admin_route.get('/',adminController.signin);
admin_route.post('/signin',adminController.signinpost);
admin_route.get('/homepage',auth.isAdminAuthorized,adminController.homepage);

admin_route.get('/userlist',auth.isAdminAuthorized,adminController.userlist);
admin_route.post('/blockunblock',auth.isAdminAuthorized,adminController.blockunblock);
admin_route.get('/categorylist',auth.isAdminAuthorized,adminController.categorylist);
admin_route.get('/addcategory',auth.isAdminAuthorized,adminController.addcategory);
admin_route.post('/addcategory',upload.array("images",10),auth.isAdminAuthorized,adminController.addcategorypost);
admin_route.get('/category/edit',auth.isAdminAuthorized,adminController.editcategory);
admin_route.post('/editcategory',upload.array("images",10),auth.isAdminAuthorized,adminController.editcategorypost);
admin_route.get('/productlist',auth.isAdminAuthorized,adminController.productlist);
admin_route.get('/addproduct',auth.isAdminAuthorized,adminController.addproduct);
admin_route.post('/addproduct',upload.array("images",10),adminController.addproductpost);
admin_route.get('/product/edit',auth.isAdminAuthorized,adminController.editproduct);
admin_route.post('/editproduct',upload.array("images",10),auth.isAdminAuthorized,adminController.editproductpost);
admin_route.post('/removeImages',auth.isAdminAuthorized,adminController.deleteImage);
admin_route.get('/couponlist',auth.isAdminAuthorized,adminController.couponlist);
admin_route.get('/addcoupon',auth.isAdminAuthorized,adminController.addcoupon);
admin_route.post('/addcoupon',auth.isAdminAuthorized,adminController.addcouponpost);
admin_route.get('/coupon/edit',auth.isAdminAuthorized,adminController.editcoupon);
admin_route.post('/editcoupon',auth.isAdminAuthorized,adminController.editcouponpost);
admin_route.get('/orderlist',auth.isAdminAuthorized,adminController.orderlist);
admin_route.get('/order/edit',auth.isAdminAuthorized,adminController.editorderlist);
admin_route.post('/editorder',auth.isAdminAuthorized,adminController.editorderlistpost);
admin_route.get('/salesreport',auth.isAdminAuthorized,setcache.setCacheControl,adminController.salesreport);
admin_route.post('/salesreportpost',auth.isAdminAuthorized,setcache.setCacheControl,adminController.salesreportpost);
admin_route.get('/bannerlist',auth.isAdminAuthorized,adminController.bannerlist);
admin_route.get('/addbanner',auth.isAdminAuthorized,adminController.addbanner);
admin_route.post('/addbanner',upload.single("images"),auth.isAdminAuthorized,adminController.addbannerpost);
admin_route.get('/banner/edit',auth.isAdminAuthorized,adminController.editbanner);
// admin_route.get('/getReports',adminController.getReports);
admin_route.get('/reports/sales/download/:type',auth.isAdminAuthorized,adminController.downloadReports);
admin_route.post('/editbanner',upload.single("images"),auth.isAdminAuthorized,adminController.editbannerpost);
admin_route.get('/logout',auth.isAdminAuthorized,adminController.logout);

module.exports = admin_route;