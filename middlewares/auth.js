module.exports = {
    checkSession: (req, res, next) => {
        if (req.session.user) next()
        else res.redirect("/login")
    },
    isAdminAuthorized: (req, res, next) => {
        if(req.session.admin) next()
        else res.redirect("/admin/signin")
    },
    
      
}

