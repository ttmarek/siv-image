const update = require('react-addons-update')
const initialState = {
  // I added 'version' so that I wouldn't have to do a deepEqual on
  // the images property
  version: 0,
  scale: {},
  offset: {}
}

const reducer = (x, action) => {
  const previousState = x || initialState
  switch (action.type) {
    case 'UPDATE_IMAGE':
      // TODO: This can be simplified using ES 2015's computed properties syntax
      const updates = {}
      updates.version = Math.random()
      if (action.scale) {
        const newScale = {}
        newScale[action.imagePath] = action.scale
        updates.scale = update(previousState.scale, { $merge: newScale })
      }
      if (action.offset) {
        const newOffset = {}
        newOffset[action.imagePath] = action.offset
        updates.offset = update(previousState.offset, { $merge: newOffset })
      }
      return update(previousState, { $merge: updates })
    default:
      return previousState
  }
}

module.exports = reducer
