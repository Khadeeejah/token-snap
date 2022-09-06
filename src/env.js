/* eslint-disable node/no-sync, node/global-require, node/no-process-env */

function splitOnce(str, pat) {
  const i = str.indexOf(pat);
  return [str.slice(0, i), str.slice(i + 1)];
}

let env;
function mutateEnv() {
  if (typeof wallet === 'undefined') {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');

    env = Object.assign(
      {},
      process.env,
      Object.fromEntries(
        fs
          .readFileSync(path.join(path.dirname(__dirname), '.env'))
          .toString()
          .split(os.EOL)
          .map(line => splitOnce(line.trim(), '=')),
      ),
    );
  }
}

module.exports = key => {
  if (!env) mutateEnv();
  if (!(key in env)) throw new Error(`Unset environment variable [${key}]`);
  return env[key];
};
