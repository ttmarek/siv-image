const ErrorMsg = [
  'x_x',
  '',
  'There was an error loading this image. The most',
  'probable reason for the error is that the',
  'image has moved or been deleted',
  'since it was first opened.'
]
const padding = 20
const canvas = document.createElement('canvas')
canvas.width = 700
canvas.height = 300
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#f1f1f1'
ctx.font = '30px sans-serif'
ctx.textAlign = 'center'
ErrorMsg.forEach((line, index) => {
  ctx.fillText(line, 350, (35 * (index + 1)) + 20)
})

module.exports = canvas
