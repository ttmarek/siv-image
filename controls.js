'use strict'
const React = require('react')
const h = require('react-hyperscript')
const styles = require('./styles')
const extId = "WdMG"

const Controls = {
  propTypes: {
    sivState: React.PropTypes.object.isRequired,
    sivDispatch: React.PropTypes.func.isRequired,
    extState: React.PropTypes.object.isRequired,
    extDispatch: React.PropTypes.func.isRequired,
    isActive: React.PropTypes.bool.isRequired
  },

  statics: {
    extId: extId
  },

  sliderRadius: 50,

  componentDidMount () {
    this.drawRadialSlider()
  },

  shouldComponentUpdate (nextProps) {
    const state = [
      // This component should only render when:
      // There is a new current image
      { old: nextProps.sivState.currentImg,
        new: this.props.sivState.currentImg },
      // The image has been scaled or panned
      { old: nextProps.extState.version,
        new: this.props.extState.version }
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
    this.drawRadialSlider()
  },

  render () {
    const titleColor = (() => {
      if (this.props.isActive) {
        return { color: 'rgb(51, 122, 183)' }
      }
      return {}
    })()
    const close = () => {
      this.props.sivDispatch({
        type: 'CLOSE_EXTENSION',
        extId: extId
      })
    }
    return (
      h('div.ext-container', [
        h('div.ext-title', [
          h('span', { style: titleColor }, 'Image'),
          h('img', { src: 'icons/ic_close_white_18px.svg', onClick: close })
        ]),
        h('canvas', {
          ref: 'radialSlider',
          style: styles.radialSlider,
          width: '175px',
          height: '150px',
          onMouseMove: this.handleMouseMove,
          onMouseDown: this.handleMouseDown,
          onMouseUp: this.handleMouseUp
        }),
        h('div', { style: styles.radialSliderBtnsWrapper }, [
          h('button', {
            className: 'btn btn-default',
            style: styles.radialSliderBtn,
            onClick: () => this.setAngle(0)
          }, '0\u00B0'),
          h('button', {
            className: 'btn btn-default',
            style: styles.radialSliderBtn,
            onClick: () => this.setAngle(Math.PI * 0.5)
          }, '90\u00B0'),
          h('button', {
            className: 'btn btn-default',
            style: styles.radialSliderBtn,
            onClick: () => this.setAngle(Math.PI)
          }, '180\u00B0'),
          h('button', {
            className: 'btn btn-default',
            style: styles.radialSliderBtn,
            onClick: () => this.setAngle(Math.PI * 1.5)
          }, '270\u00B0')
        ])
      ])
    )
  },

  handleMouseDown (mouseEvent) {
    const slider = this.makeSliderObj()
    if (slider.onKnob(mouseEvent)) {
      this.mouseOnNob = true
    }
  },

  handleMouseUp (event) {
    this.mouseOnNob = false
  },

  handleMouseMove (mouseEvent) {
    const canvas = this.refs.radialSlider
    const slider = this.makeSliderObj()
    if (this.mouseOnNob) {
      canvas.style.cursor = 'move'
      const angle = (() => {
        // This is the angle from the top dead center of the radial
        // slider to the mouse pointer.
        const mousePos = slider.getMousePos(mouseEvent)
        const theta = Math.atan2((mousePos.x - canvas.width * 0.5),
                                 (canvas.height * 0.5 - mousePos.y))
        if (theta < 0) {
          return 2 * Math.PI + theta
        } else {
          return theta
        }
      })()
      this.setAngle(angle)
    } else {
      if (slider.onKnob(mouseEvent)) {
        canvas.style.cursor = 'pointer'
      } else {
        canvas.style.cursor = 'default'
      }
    }
  },

  setAngle (angle) {
    this.props.extDispatch({
      type: 'UPDATE_IMAGE',
      imagePath: this.props.sivState.currentImg,
      rotation: angle
    })
  },

  makeSliderObj () {
    const canvas = this.refs.radialSlider
    const canvasBCR = canvas.getBoundingClientRect()
    const currentImg = this.props.sivState.currentImg
    const sliderAngle = this.props.extState.rotation[currentImg] || 0
    const knobCoords = {
      x: (canvas.width * 0.5) + this.sliderRadius * Math.sin(sliderAngle),
      y: (canvas.height * 0.5) - this.sliderRadius * Math.cos(sliderAngle)
    }
    const getMousePos = (mouseEvent) => {
      // Given a mouseEvent, returns the x and y coodinates of the
      // mouse point relative to the top left corner of the radial
      // slider's canvas
      return {
        x: mouseEvent.clientX - canvasBCR.left,
        y: mouseEvent.clientY - canvasBCR.top
      }
    }
    const onKnob = (mouseEvent) => {
      // Given a mouseEvent, returns true if the mouse is point lands
      // on the radial slider knob, returns false otherwise.
      const mousePos = getMousePos(mouseEvent)
      return (Math.abs(knobCoords.x - mousePos.x) <= 4 ||
              Math.abs(knobCoords.y - mousePos.y) <= 4)
    }
    return {
      onKnob,
      knobCoords,
      getMousePos,
      angle: sliderAngle
    }
  },

  drawRadialSlider () {
    const slider = this.makeSliderObj()
    const canvas = this.refs.radialSlider
    const ctx = canvas.getContext('2d')
    const canvasCenter = {
      x: canvas.width * 0.5,
      y: canvas.height * 0.5
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // The doughnut
    ctx.shadowColor = '#7CC0FB'
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.lineWidth = 5
    ctx.strokeStyle = '#f1f1f1'
    ctx.arc(canvasCenter.x, canvasCenter.y, this.sliderRadius, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.closePath()
    ctx.beginPath()
    ctx.shadowBlur = 10
    ctx.fillStyle = '#f1f1f1'
    ctx.arc(slider.knobCoords.x, slider.knobCoords.y, 10, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()
    // The degrees display
    ctx.shadowBlur = 2
    ctx.font = '25px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f1f1f1'
    // I shifted the text by 3px because the degree symbol was making
    // the display look skewed:
    const degrees = Math.round(slider.angle * 180 / Math.PI)
    ctx.fillText(`${degrees}\u00B0`, canvasCenter.x + 3, canvasCenter.y)
  }
}

module.exports = React.createClass(Controls)
