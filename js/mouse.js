var beginMessage = "Click to start.";
//Check if pointer lock is supported and complain if not.
var pl = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;

if (!pl) {
  alert("Upgrade your browser - pointer lock not supported.");
}

//Set up the browser to capture the mouse on a click in the render canvas.
var canvas = document.getElementById("renderCanvas");
canvas.requestPointerLock = canvas.requestPointerLock ||
  canvas.mozRequestPointerLock ||
  canvas.webkitRequestPointerLock;

canvas.onmousedown = function(evt) {
  if (document.getElementById("message").innerHTML == beginMessage) {
    document.getElementById("message").innerHTML = "";
  }
  canvas.requestPointerLock();
}

//When the mouse is moved, invoke the game's mouse movement handler.
document.onmousemove = function(evt) {
  if (g) {
    g.mouseMove(evt.movementX || evt.mozMovementX || evt.webkitMovementX || 0,
                evt.movementY || evt.mozMovementY || evt.webkitMovementY || 0);
  }
}

document.getElementById("message").innerHTML = beginMessage;