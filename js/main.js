function init() {
  camera = new THREE.PerspectiveCamera(75,
                                       window.innerWidth / window.innerHeight,
                                       1, 10000);

  scene = new THREE.Scene();
  scene.add(camera);

  renderer = new THREE.WebGLRenderer(
    {canvas: document.getElementById('renderCanvas')});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;

  gameTimer = new THREE.Clock();
  gameTimer.start();
}


function animate() {
  requestAnimationFrame(animate);
  var delta = gameTimer.getDelta();

  g.doGameLogic(delta);

  if (g.readyToRender()) {
    renderer.render(scene, camera);
  }
}

//The game ctor adds things to the scenegraph, so we need to call init first.
init();
var g = new game();
animate();