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
    'strafeLeft': false,
    'strafeRight': false,
    'stepBackward': false,
    'stepForward': false,
    'turnLeft': false,
    'turnRight': false,
    'debugPrint': false,
    'cameraYaw': false,
    'cameraBarrel': false,
  };

  this.map = {
    65: 'strafeLeft',
    83: 'stepBackward',
    68: 'strafeRight',
    87: 'stepForward',
    37: 'turnLeft',
    39: 'turnRight',
    66: 'debugPrint',
    38: 'cameraYaw',
    40: 'cameraBarrel',
  };
};

document.onkeydown = function(evt) {
  keymap.pressed[keymap.map[evt.keyCode]] = true;
};

document.onkeyup = function(evt) {
  keymap.pressed[keymap.map[evt.keyCode]] = false;
};

