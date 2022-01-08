const path = require('path');
const { PythonShell } = require('python-shell');

/**
 * Control and get status of TP Link TAPO smart plug.
 */
class TapoPlugConnector {
  /**
   * @param {Object} config - Config object
   * @param {string} config.address Plug's LAN IP address
   * @param {string} config.username Tapo App Username
   * @param {string} config.password Tapo App Password (no special chars)
   */
  constructor({ address, username, password }) {
    this.address = address;
    this.username = username;
    this.password = password;
  }

  async setState(on) {
    return await this.sendCommand(on ? "on" : "off");
  }

  async getInfo(on) {
    return await this.sendCommand(null);
  }

  /**
   * Internal method
   * @param {null|"on"|"off"} command Null to only get info, on or off to switch.
   */
  async sendCommand(command = null) {
    return await new Promise((resolve, reject) => {
      try {
        let pyshell = new PythonShell(path.join(__dirname, 'python'), {
          mode: 'json',
        });

        let exited = false;
        let response = null;
        
        // sends a message to the Python script via stdin
        pyshell.send({
          address: this.address, 
          username: this.username, 
          password: this.password, 
          command
        });
        
        pyshell.on('message', (message) => {
          if(response) {
            reject("Invalid state, expected only 1 message.");
          }else if(exited) {
            reject("Invalid state, script already exited.");
          }else{
            response = message;
          }
        });
        
        // end the input stream and allow the process to exit
        pyshell.end((err, code, signal) => {
          exited = true;
          if (err || response.error) {
            reject({ 
              exception: err,
              error: response && response.error || 'Exception',
              code, 
              signal 
            });
          }else if (!response) {
            reject({ error: "Python process exited without returing a response.", code, signal });
          }else{
            resolve(response);
          }
        });
      }catch(e) {
        reject(e);
      }
    });
  }
}

module.exports = TapoPlugConnector;
