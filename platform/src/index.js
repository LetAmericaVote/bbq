// build core functions
// spinup core function to get current configured flavors
//
// if dev
//  spin up check if the staging bbq config contains new flavors the local doesn't have
//  notify user they should sync

// clone flavors and build them
//
// listen on port for traffic
//
// if prod
//  add to load balancer
//  let other bbq nodes this instance is accepting traffic


const { join } = require('path');
const { build } = require('./build');
const { listen } = require('./proxy');

// const pingPath = join(__dirname, '../../core/ping');
// build([{ flavorId: 'ping', srcPath: pingPath }]);
listen();
