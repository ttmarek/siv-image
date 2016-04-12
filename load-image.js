'use strict'

/**
 * Loads an image into the http cache
 * @param {string} imgSrc image path
 * @returns {object} an HTMLImageElement instance
 */
function loadImage (imgSrc) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      resolve(img)
    }
    img.onerror = () => {
      reject(require('./error-image'))
    }
    img.src = imgSrc.replace(/#/g, '%23')
  })
}

module.exports = loadImage
