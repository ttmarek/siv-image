'use strict'
const extId = 'WdMG'
const reducer = require('./reducer')
const Layer = require('./layer')
const Controls = require('./controls')

module.exports = (React, h) => ({
  extId,
  reducer,
  Controls: Controls(React, h),
  Layer: Layer(React, h),
});
