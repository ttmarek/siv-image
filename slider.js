const incrAngleByOneDegree = (angle, direction) => {
  const maxAngle = (Math.PI / 180) * 359
  const oneDeg = Math.PI / 180
  if (direction === 'up') {
    if (angle + oneDeg > maxAngle) {
      return 0
    }
    return angle + oneDeg
  }
  if (direction === 'down') {
    if (angle - oneDeg < 0) {
      return maxAngle
    }
    return angle - oneDeg
  }
  console.error('You are using incrAngleByOneDegree incorrectly')
  return angle
}

module.exports = {
  incrAngleByOneDegree
}
