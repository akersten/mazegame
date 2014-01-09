/**
 * The control philosophy is that browser events will trigger changes in the
 * keymap.pressed map (based on keybindings from keymap.map). The pressed map
 * will be checked every animation frame. Anything that needs to be timed will
 * reference the game timer and do interpolation.
 *
 * Admittedly I'm not sure what the frequency is on browser event triggers but
 * whatever, it's fast enough.
 */
keymap = new function() {
  this.pressed = {
    'rotateLeft': false,
    'roateRight': false
  };

  this.map = {
    65: 'rotateLeft',
    66: 'rotateRight'
  };
};

document.onkeydown = function(evt) {
  keymap.pressed[keymap.map[evt.keyCode]] = true;
};

document.onkeyup = function(evt) {
  keymap.pressed[keymap.map[evt.keyCode]] = false;
};