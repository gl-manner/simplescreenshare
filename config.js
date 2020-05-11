var port = 443;
var host_url = `ec2-54-176-212-246.us-west-1.compute.amazonaws.com`;

var default_auth_email = "pingkee317@gmail.com";
var default_auth_password = "";

module.exports = {
  port: 443,
  web_url: `https://${host_url}:${port}`,
  socket_url: host_url,
  STORAGE_PATH: "./public/storage",
  email: {
    auth_email: function () {
      return default_auth_email;
    },
    auth_password: function () {
      return default_auth_password;
    },
  },
};
