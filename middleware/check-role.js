function checkRole(role) {
  return (req, res, next) => {
    if (req.session.user.role === role) return next();
    res.send("This page is only for " + role + " accounts.");
  };
}

module.exports = checkRole;
