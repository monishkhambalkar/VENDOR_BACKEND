const fs = require("fs");
const path = require("path");

const errorLogger = (err) => {
  const logPath = path.join(__dirname, "../../error.log");

  const log = `
Time: ${new Date()}
Message: ${err.message}
Stack: ${err.stack}
----------------------\n`;

  fs.appendFileSync(logPath, log);
};

module.exports = errorLogger;
