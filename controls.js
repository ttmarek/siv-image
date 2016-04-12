'use strict'
const React = require('react')
const h = require('react-hyperscript')
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

  shouldComponentUpdate () {
    return false
  },

  render () {
    const titleColor = (() => {
      if (this.props.isActive) {
        return {color: 'rgb(51, 122, 183)'}
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
      ])
    )
  }
}

module.exports = React.createClass(Controls)
