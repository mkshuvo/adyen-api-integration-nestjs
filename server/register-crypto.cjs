'use strict';
try {
  const nodeCrypto = require('crypto');
  global.crypto = nodeCrypto;
  if (typeof global.crypto.randomUUID !== 'function' && typeof nodeCrypto.randomUUID === 'function') {
    global.crypto.randomUUID = nodeCrypto.randomUUID.bind(nodeCrypto);
  }
} catch (e) {
  // noop
}
