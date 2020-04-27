var chalk = require('chalk');
var bCrypt = require('bcrypt-nodejs');

module.exports = {
  responseHandler: (res, success, message, data) => {
    res.send({
      success: success,
      message: message,
      data: data,
    });
  },
  createHash: function (password) {
    password = String(password);
    var hash = bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    // var hash = md5(password)
    console.log(chalk.yellowBright('password', password,typeof(password), hash));
    return hash;
  },
  Logger: {
    LOGE: function (message) {
      if (typeof message == 'object') {
        try {
          console.log(chalk.red(JSON.stringify(message, null, 2)));
        } catch (err) {}
        return;
      }
      if (typeof message == 'string') {
        console.log(chalk.red(message));
        return;
      }
    },
    LOGW: function (message) {
      if (typeof message == 'object') {
        try {
          console.log(chalk.yellowBright('WARN: ', JSON.stringify(message, null, 2)));
        } catch (err) {}
        return;
      }
      if (typeof message == 'string') {
        console.log(chalk.yellowBright('WARN: ', message));
        return;
      }
    },
    LOGD: function (message) {
      if (typeof message == 'object') {
        try {
          console.log(chalk.green(JSON.stringify(message, null, 2)));
        } catch (err) {}
        return;
      }
      if (typeof message == 'string') {
        console.log(chalk.green(message));
        return;
      }
    },
    LOG_SOCKET_IO: function (message) {
      if (typeof message == 'object') {
        try {
          console.log(chalk.yellowBright('SOCKET_IO: '), JSON.stringify(message, null, 2));
        } catch (err) {}
        return;
      }
      if (typeof message == 'string') {
        console.log(chalk.yellowBright('SOCKET_IO: '), message);
        return;
      }
    },

  },
  
};