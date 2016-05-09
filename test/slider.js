const test = require('tape')
const slider = require('../slider')

test('incrAngleByOneDegree', assert => {
  const incrAngleByOneDegree = slider.incrAngleByOneDegree
  assert.equal(incrAngleByOneDegree(0, 'up'), Math.PI / 180)
  assert.equal(incrAngleByOneDegree(0, 'down'), (Math.PI / 180) * 359)
  assert.equal(incrAngleByOneDegree(0.0001, 'down'), (Math.PI / 180) * 359)
  assert.equal(incrAngleByOneDegree((Math.PI / 180) * 359, 'up'), 0)
  assert.equal(incrAngleByOneDegree((Math.PI / 180) * 359 + 0.0001, 'up'), 0)
  assert.equal(incrAngleByOneDegree((Math.PI / 180) * 56, 'up'), (Math.PI / 180) * 57)
  assert.equal(incrAngleByOneDegree((Math.PI / 180) * 57, 'down'), (Math.PI / 180) * 56)
  assert.end()
})
