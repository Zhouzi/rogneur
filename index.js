/* global define */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define([], factory)
  } else if (typeof exports === 'object') {
    exports.rogneur = factory()
  } else {
    root.rogneur = factory()
  }
})(this, function () {
  'use strict'

  /**
   * Return a value that is at least min and at most max.
   * @param {Number} value
   * @param {Number} min
   * @param {Number} max
   * @returns {Number}
   */
  function clamp (value, min, max) {
    return Math.max(Math.min(value, max), min)
  }

  /**
   * Rounds number with given number of decimals.
   * Note: this function is far from being bullet proof and would
   * break in certain circumstances. It's just enough for rogneur
   * but be careful when reusing it.
   * @param {Number} num
   * @param {Number} decimals
   * @returns {number}
   */
  function round (num, decimals) {
    return Math.round(num * decimals) / decimals
  }

  /**
   * Creates a rogneur instance based on image.
   * @param {HTMLElement} container - The element to bind rogneur to (requires a non-static position).
   * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
   */
  function rogneur (container) {
    var state = {
      position: {
        x: 0,
        y: 0
      },
      original: {},
      container: {},
      zoom: 1,
      src: null
    }

    Object.defineProperty(state, 'loading', {
      get: function getLoading () {
        return !state.original.width || !state.original.height
      }
    })

    var dragging = null
    var stateHandlers = { position: getPosition, zoom: getZoom }
    var loader = document.createElement('img')
    var image = document.createElement('img')

    if (window.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative'
    }

    container.appendChild(image)
    container.style.backgroundRepeat = 'no-repeat'

    image.style.position = 'absolute'
    image.style.top = '0'
    image.style.left = '0'
    image.style.transformOrigin = '0 0 0'

    document.addEventListener('mousemove', onmousemove)
    document.addEventListener('mouseup', onmouseup)

    loader.addEventListener('load', onload)

    image.setAttribute('draggable', 'false')
    image.addEventListener('mousedown', onmousedown)

    updateContainerSize()

    /**
     * mousemove handler that updates the image's position.
     * @param {Event} event
     */
    function onmousemove (event) {
      if (dragging == null) {
        return
      }

      var mousePos = {
        x: event.x + window.pageXOffset,
        y: event.y + window.pageYOffset
      }

      var newPosition = {
        x: mousePos.x - dragging.x,
        y: mousePos.y - dragging.y
      }

      setState({ position: newPosition })
    }

    /**
     * mouseup handler that releases the image.
     */
    function onmouseup () {
      dragging = null
    }

    /**
     * mousedown handler that initiate the drag by setting it's origin position.
     * @param {Event} event
     */
    function onmousedown (event) {
      dragging = {
        x: event.x - state.position.x,
        y: event.y - state.position.y
      }
    }

    /**
     * load handler that's called when an image is loaded.
     * Used to get the image's original size.
     * @param {Event} event
     */
    function onload (event) {
      var target = event.path[0]
      var width = target.naturalWidth
      var height = target.naturalHeight

      image.src = state.src
      container.style.backgroundImage = 'url(' + state.src + ')'

      setState({
        original: {
          width: width,
          height: height
        }
      })

      move('center')
    }

    /**
     * Update the image's position and scale.
     * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
     */
    function update () {
      var realWidth = state.original.width * state.zoom
      var realheight = state.original.height * state.zoom

      container.style.backgroundSize = realWidth + 'px ' + realheight + 'px '
      container.style.backgroundPosition = state.position.x + 'px ' + state.position.y + 'px'

      image.style.transform = [
        'translate(',
          state.position.x, 'px, ',
          state.position.y, 'px',
        ') ',
        'scale(',
          state.zoom,
        ')'
      ].join('')

      return this
    }

    /**
     * Load an image.
     * @param {String} url - Whatever's suitable for an img.src attribute.
     * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
     */
    function load (url) {
      loader.src = url

      setState({
        src: url,
        original: {}
      })

      return this
    }

    /**
     * Update the container's size in state.
     * Note: we need the container's width and height for some calculations.
     * So this function should be called when the container's size changes.
     */
    function updateContainerSize () {
      var rect = container.getBoundingClientRect()
      setState({ container: { width: rect.width, height: rect.height } })
    }

    /**
     * Returns the correct image position that respects the min/max values.
     * @param {Object} pos
     * @param {Number} pos.x - Image's x position.
     * @param {Number} pos.y - Image's y position.
     * @returns {{x: Number, y: Number}}
     */
    function getPosition (pos) {
      if (state.loading) {
        return pos
      }

      return {
        x: calcPos(pos.x, state.original.width, state.container.width),
        y: calcPos(pos.y, state.original.height, state.container.height)
      }
    }

    /**
     * Takes into account the fact that the image scales from the center.
     * Also clamps the value to the min and max possible values.
     * @param {Number} pos
     * @param {Number} originalSize
     * @param {Number} containerSize
     * @returns {Number}
     */
    function calcPos (pos, originalSize, containerSize) {
      var realSize = originalSize * state.zoom
      var min = lowestPos(realSize, containerSize)
      var max = highestPos(realSize, containerSize)

      return clamp(pos, min, max)
    }

    /**
     * Returns the lowest possible position.
     * @param {Number} realSize
     * @param {Number} containerSize
     * @returns {number}
     */
    function lowestPos (realSize, containerSize) {
      var overflow = Math.max(realSize - containerSize, 0)
      var lowestValue = 0

      return lowestValue - overflow
    }

    /**
     * Returns the highest possible position.
     * @param {Number} realSize
     * @param {Number} containerSize
     * @returns {number}
     */
    function highestPos (realSize, containerSize) {
      var overflow = Math.max(realSize - containerSize, 0)
      var highestValue = containerSize - realSize

      return highestValue + overflow
    }

    /**
     * Returns the zoom respecting the min value.
     * @param {Number} zoom
     * @returns {number}
     */
    function getZoom (zoom) {
      if (state.loading) {
        return zoom
      }

      var min = (function () {
        var widthRatio = state.container.width / state.original.width
        var heightRatio = state.container.height / state.original.height
        return Math.max(widthRatio, heightRatio)
      })()

      return Math.max(round(zoom, 10), round(min, 10))
    }

    /**
     * Move the image to given position, e.g "center".
     * @param {String} where - Position's name.
     * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
     */
    function move (where) {
      // setting the zoom to a value that's too
      // low will cause it to be set to its lowest
      // possible value to fit its container
      setState({
        zoom: 0
      })

      var realWidth = state.original.width * state.zoom
      var realHeight = state.original.height * state.zoom

      if (where === 'center') {
        setState({
          position: {
            x: lowestPos(realWidth, state.container.width) / 2,
            y: lowestPos(realHeight, state.container.height) / 2
          }
        })
      }

      return this
    }

    /**
     * Update the state, ensure the values respect
     * the min/max rules and persist it to the view.
     * @param {Object} newState
     * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
     */
    function setState (newState) {
      applyState(newState)

      // by applying the current values, we're ensuring
      // that they do match their min/max rules
      //
      // Note: we need to apply the zoom first for
      //       the position to be properly calculated

      if (!newState.hasOwnProperty('zoom')) {
        applyState({ zoom: state.zoom })
      }

      if (!newState.hasOwnProperty('position')) {
        applyState({ position: state.position })
      }

      update()
      return this
    }

    /**
     * Update the state and calls the relevant state handlers.
     * e.g updating the image's position needs some calculation that is done by its handler.
     * Also calls update to apply the changes to the image.
     * @param {Object} newState
     * @returns {{move: move, load: load, updateContainerSize: updateContainerSize, setState: setState, getState: getState, loading: Boolean}}
     */
    function applyState (newState) {
      for (var key in newState) {
        if (!newState.hasOwnProperty(key)) {
          continue
        }

        if (stateHandlers.hasOwnProperty(key)) {
          var handler = stateHandlers[key]
          state[key] = handler(newState[key])
        } else {
          state[key] = newState[key]
        }
      }

      return this
    }

    /**
     * Returns the state.
     * @returns {{position: {x: Number, y: Number}, original: {width: Number, height: Number}, container: {width: Number, height: Number}, zoom: Number}}
     */
    function getState () {
      return state
    }

    return {
      move: move,
      load: load,
      updateContainerSize: updateContainerSize,
      setState: setState,
      getState: getState
    }
  }

  return rogneur
})
