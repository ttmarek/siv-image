'use strict'
const remote = require('electron').remote
const clipboard = require('electron').clipboard
const nativeImage = require('electron').nativeImage
const loadImage = require('./load-image')

const extId = 'WdMG'
const layerName = 'image'

const Layer = (React, h) => React.createClass({
  propTypes: {
    zIndex: React.PropTypes.number,
    sivState: React.PropTypes.object.isRequired,
    sivDispatch: React.PropTypes.func.isRequired,
    extState: React.PropTypes.object.isRequired,
    extDispatch: React.PropTypes.func.isRequired
  },

  statics: {
    extId: extId,
    layerName: layerName
  },

  componentDidMount () {
    this.props.sivDispatch({
      type: 'ADD_CANVAS_REF',
      canvasRef: this.refs.canvas,
      extId: this.extId
    })
    this.drawImg()
  },

  shouldComponentUpdate (nextProps) {
    const state = [
      // This component should only render when:
      // There is a new current image
      { old: nextProps.sivState.currentImg,
        new: this.props.sivState.currentImg },
      // The SIV viewer is resized
      { old: nextProps.sivState.viewerDimensions.width,
        new: this.props.sivState.viewerDimensions.width },
      { old: nextProps.sivState.viewerDimensions.height,
        new: this.props.sivState.viewerDimensions.height },
      // The image has been scaled or panned
      { old: nextProps.extState.version,
        new: this.props.extState.version}
    ]
    const nothingHasChanged = state.every(property => {
      return property.old === property.new
    })
    if (nothingHasChanged) {
      return false              // Don't update the component
    }
    return true                 // Update the component
  },

  componentDidUpdate () {
    this.drawImg()
  },

  render () {
    return (
      h('canvas.Layer', {
        ref: 'canvas',
        'data-extid': extId,
        style: { zIndex: this.props.zIndex },
        width: this.props.sivState.viewerDimensions.width,
        height: this.props.sivState.viewerDimensions.height,
        onMouseMove: this.handleMouseMove,
        onWheel: this.handleScroll,
        onContextMenu: this.showContextMenu,
        onMouseDown: (event) => {
          if (event.nativeEvent.button === 0) { // left click
            this.mouseDown = true
            this.refs.canvas.style.cursor = 'move'
          }
        },
        onMouseUp: (event) => {
          if (event.nativeEvent.button === 0) { // left click
            this.mouseDown = false
            this.refs.canvas.style.cursor = ''
          }
        }
      })
    )
  },

  showContextMenu () {
    const menu = remote.Menu.buildFromTemplate([
      {
        label: 'Copy Image',
        click: () => {
          clipboard.writeImage(this.props.sivState.currentImg)
        }
      },
      {
        label: 'Copy Path',
        click: () => {
          clipboard.writeText(this.props.sivState.currentImg)
        }
      }
    ])
    menu.popup(remote.getCurrentWindow())
  },

  getCurrentScale () {
    // Returns the current image's scale. If the current image doesn't
    // have a saved scale then the function returns a scale of 1
    const currentImg = this.props.sivState.currentImg
    return this.props.extState.scale[currentImg] || 1
  },

  getCurrentOffset () {
    // Returns the current image's offset. If the current image
    // doesn't have a saved offset then the function returns an offset
    // of dx = 0, and dy = 0.
    const currentImg = this.props.sivState.currentImg
    return this.props.extState.offset[currentImg] || { dx: 0, dy: 0 }
  },

  getCurrentRotation () {
    // Return's the current image's rotation angle (in radians). If
    // the current image hasn't been rotated then the function returns
    // 0
    const currentImg = this.props.sivState.currentImg
    return this.props.extState.rotation[currentImg] || 0
  },

  scaleToFit (img, viewerWidth, viewerHeight) {
    // Returns a number that can be multiplied to the image width and
    // height to make the image fit within the viewer
    if (img.width > viewerWidth || img.height > viewerHeight) {
      const scaleX = viewerWidth / img.width
      const scaleY = viewerHeight / img.height
      return Math.min(scaleX, scaleY)
    }
    return 1
  },

  handleMouseMove (event) {
    if (this.imgDrawn === 'error') return
    if (this.mouseDown) {
      const offset = (() => {
        const currentOffset = this.getCurrentOffset()
        const rotation = this.getCurrentRotation()
        const movementX = event.nativeEvent.movementX
        const movementY = event.nativeEvent.movementY
        if (rotation != 0) {
          const sinTheta = Math.sin(rotation)
          const cosTheta = Math.cos(rotation)
          return {
            dx: currentOffset.dx + (cosTheta * movementX) + (sinTheta * movementY),
            dy: currentOffset.dy + (cosTheta * movementY) - (sinTheta * movementX)
          }
        }
        return {
          dx: currentOffset.dx + movementX,
          dy: currentOffset.dy + movementY
        }
      })()
      this.props.extDispatch({
        type: 'UPDATE_IMAGE',
        imagePath: this.props.sivState.currentImg,
        offset
      })
    }
  },

  handleScroll (mouseEvent) {
    if (this.imgDrawn === 'error') return
    // The incremented/decremented scale
    const nextScale = (() => {
      const maxScale = 4
      const minScale = (() => {
        const rotation = this.getCurrentRotation()
        if (rotation != 0) {
          return 0.25
        }
        return 1
      })()
      const scaleIncr = 0.25
      const currentScale = this.getCurrentScale()
      if (mouseEvent.deltaY < 0) { // scroll up
        return currentScale + Math.min(scaleIncr, (maxScale - currentScale))
      }
      return currentScale + Math.max(-scaleIncr, (minScale - currentScale))
    })()
    // The offset is the x and y offset from the centered position of
    // the scaled image. The offset needs to be calculated so that a
    // user can zoom-in on a specific part of an image.
    const offset = (() => {
      if (nextScale === 1) {
        // The image should snap back to its centered position when
        // there is no extra scale.
        return { dx: 0, dy: 0 }
      }
      const viewer = this.props.sivState.viewerDimensions
      // The mouse position in the viewer (pixels)
      const mousePos = {
        x: mouseEvent.clientX - viewer.left,
        y: mouseEvent.clientY - viewer.top
      }
      // The mouse position on the drawn image as a percentage of the
      // image width and height
      const mousePosOnImgDrawn = {
        x: (mousePos.x - this.imgDrawn.dx) / this.imgDrawn.drawnWidth,
        y: (mousePos.y - this.imgDrawn.dy) / this.imgDrawn.drawnHeight
      }
      // The scale that makes the image fit in the viewer
      const scaleToFit = this.scaleToFit(this.imgDrawn, viewer.width, viewer.height)
      // The final dimensions of the image that'll be drawn
      const scaledImgWidth = this.imgDrawn.width * scaleToFit * nextScale
      const scaledImgHeight = this.imgDrawn.height * scaleToFit * nextScale
      // The following is a non-intuitive forumla for calcuting the x
      // and y offset.
      return {
        dx: mousePos.x - (0.5 * viewer.width) + (scaledImgWidth * (0.5 - mousePosOnImgDrawn.x)),
        dy: mousePos.y - (0.5 * viewer.height) + (scaledImgHeight * (0.5 - mousePosOnImgDrawn.y))
      }
    })()

    this.props.extDispatch({
      type: 'UPDATE_IMAGE',
      imagePath: this.props.sivState.currentImg,
      scale: nextScale,
      offset: offset
    })
  },

  drawImg () {
    const imagePath = this.props.sivState.currentImg
    if (imagePath) {
      loadImage(imagePath)
        .then(img => {
          const viewer = this.props.sivState.viewerDimensions
          // The scale that makes the image fit in the viewer
          const scaleToFit = this.scaleToFit(img, viewer.width, viewer.height)
          // The scale set by the user when they zoom-in on the image
          const extraScale = this.getCurrentScale()
          // The final dimensions of the image that'll be drawn
          const scaledImgWidth = img.width * scaleToFit * extraScale
          const scaledImgHeight = img.height * scaleToFit * extraScale
          // The x and y that centers the scaled image in the viewer
          const centeredPosition = {
            dx: 0.5 * (viewer.width - scaledImgWidth),
            dy: 0.5 * (viewer.height - scaledImgHeight)
          }
          // The x and y offset from the centered position
          const offset = this.getCurrentOffset()
          // The final x and y position of the image in the viewer
          const position = {
            dx: centeredPosition.dx + offset.dx,
            dy: centeredPosition.dy + offset.dy
          }
          const canvas = this.refs.canvas
          const ctx = canvas.getContext('2d')
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          // Rotate the canvas about the image center if necessary
          const rotation = this.getCurrentRotation()
          if (rotation != 0) {
            ctx.translate(canvas.width * 0.5, canvas.height * 0.5)
            ctx.rotate(rotation)
            ctx.translate(canvas.width * -0.5, canvas.height * -0.5)
          }
          ctx.drawImage(img, position.dx, position.dy, scaledImgWidth, scaledImgHeight)
          // The dimensions of the drawn image are needed in the
          // handleScroll and handleMouseMove functions
          this.imgDrawn = {
            drawnWidth: scaledImgWidth,
            drawnHeight: scaledImgHeight,
            dx: position.dx,
            dy: position.dy,
            width: img.width,
            height: img.height
          }
        })
        .catch(errorImage => {
          const viewer = this.props.sivState.viewerDimensions
          // The x and y that centers the error image in the viewer
          const dx = 0.5 * (viewer.width - errorImage.width)
          const dy = 0.5 * (viewer.height - errorImage.height)
          const canvas = this.refs.canvas
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(errorImage, dx, dy, errorImage.width, errorImage.height)
          this.imgDrawn = 'error'
        })
    }
  }
})

module.exports = Layer
