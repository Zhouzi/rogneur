# rogneur

Simple low level and opinionated cropper library.

* Simple ES5 vanilla JavaScript, no dependencies, no bloat.
* Straight to the point, almost no options.
* Doesn't make much assumptions and leave the power in your hands.

* [Demo](https://gabinaureche.com/rogneur)
* [Usage](#usage)
* [Example](https://github.com/Zhouzi/rogneur/blob/gh-pages/index.html)
* [Documentation](#documentation)

## Usage

```
npm install rogneur --save
```

## Documentation

### rogneur(container)

Create a new cropper instance bound to container.

1. **container**: The container that will hold the cropper (should have a `relative` or `absolute` position) 

Return the api as described below.

### crop()

Use a canvas to crop the image according to its position/zoom.

Return the image as a data url string.

### move(position)

Move the image to given position.

1. **position**: a position that can be one of: `center`. Also reset the zoom to make the image fit its container.

Return the api.

### load(url)

Load an image in the cropper.
Note: an event is published when it the loading starts and ends, see [subscribe](#subscribe).

1. **url**: whatever fits the `<img>`'s `src` attribute (e.g an url, a data url, ...).

Return the api.

### updateContainerSize()

rogneur relies on the size of the container that is calculated once so if it changes, you'll need to update it.

Return the api.

### subscribe(event, callback)

Add a callback to be called when event occurs.

1. **event**: the name of the event to subscribe to, one of: `LOAD_START`, `LOAD_END`.
2. **callback**: a function to call when the event is published.

### setState(state)

Used to set the internal rogneur instance's state.
Can be used to update the `position.x`, `position.y` and `zoom` but should be used with caution otherwise.
Note: some properties go through a transformer that ensure they match their min/max values.

See [getState](#getstate) to have a look at the state's shape.

Return the api.

### getState()

Return the rogneur instance's state.

```json
{
  "position": {
    "x": Number,
    "y": Number
  },
  "zoom": Number,
  "loading": Boolean,
  "minZoom": Number,
  "minX": Number,
  "maxX": Number,
  "minY": Number,
  "maxY": Number
}
```
