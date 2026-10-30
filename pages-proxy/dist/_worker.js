// Pages "advanced mode": hand every request (URL, method, headers, body, Access JWT) to the site Worker.
export default {
  fetch(request, env) {
    return env.SITE.fetch(request);
  },
};
