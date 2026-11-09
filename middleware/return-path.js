function getReturnPath(req, fallback) {
  const back = req.body.back;
  if (
    typeof back === "string" &&
    back.startsWith("/") &&
    !back.startsWith("//")
  ) {
    try {
      const url = new URL(back, "http://local.invalid");
      if (url.origin === "http://local.invalid") {
        return url.pathname + url.search + url.hash;
      }
    } catch {
      return fallback;
    }
  }

  const referer = req.get("Referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const requestHost = req.get("Host");
      if (requestHost && url.host.toLowerCase() === requestHost.toLowerCase()) {
        return url.pathname + url.search + url.hash;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

module.exports = getReturnPath;
