var port = 433;
var host_url = `192.168.0.101`;

var default_auth_email = "pingkee317@gmail.com";
var default_auth_password = "pingkeepassword317";

module.exports = {
  port: 433,
  web_url: `http://${host_url}:${port}`,
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
