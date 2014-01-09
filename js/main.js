var camera, scene, renderer, gameTimer;

/**
 * Garbage loader-specific logic, bleh
 */
var loaderEnc = {
  geometry: null,
  material: null,
  mesh: null,
  spinVelocity: 0.12,
  ticks: 0,
  theta: 0.0,
};


function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1,10000);
  camera.position.z = 250;
  camera.position.x = 100;

  scene = new THREE.Scene();

  loaderEnc.geometry = new THREE.TextGeometry("Maze Game",
                                              {
                                                size: 40,
                                                height: 10,
                                                curveSegments: 1,
                                                font: "helvetiker",
                                                weight: "normal",
                                                style: "normal",
                                                bevelEnabled: false,
                                                bevelThickness: 10,
                                                bevelSize: 8
                                              });
  loaderEnc.geometry.computeBoundingBox();

  loaderEnc.material = new THREE.MeshBasicMaterial(
    { color: 0xAADDFF, wireframe: false }
  );

  loaderEnc.mesh = new THREE.Mesh(loaderEnc.geometry, loaderEnc.material);
  scene.add(loaderEnc.mesh);

  renderer = new THREE.WebGLRenderer({canvas: document.getElementById('renderCanvas')});
  renderer.setSize(window.innerWidth, window.innerHeight);
  gameTimer = new THREE.Clock();
  gameTimer.start();
}

function animate() {
  requestAnimationFrame(animate);
  var delta = gameTimer.getDelta();

  //If the game's not loaded, spin the loader.
  if (!game.loaded) {
    loaderEnc.ticks++;
    if (loaderEnc.ticks >= 90) {
      loaderEnc.ticks = 0;
      loaderEnc.spinVelocity = 0.12;
    }

    if (loaderEnc.spinVelocity > 0.0) {
      loaderEnc.spinVelocity -= 0.001;
    }

    if (loaderEnc.spinVelocity < 0) {
      loaderEnc.spinVelocity = 0;
    }


    var tmpV3;

    //Get the centered position vector of the text and look at it as we fly around.
    tmpV3 = new THREE.Vector3();
    tmpV3.copy(loaderEnc.mesh.geometry.boundingBox.max);
    tmpV3.sub(loaderEnc.mesh.geometry.boundingBox.min);
    tmpV3.multiplyScalar(0.5);
    tmpV3.add(loaderEnc.mesh.position);


    //Wobble
    loaderEnc.theta += loaderEnc.spinVelocity / 4.5;
    camera.position.set(tmpV3.x, 25 * Math.sin(loaderEnc.theta), 150);

    camera.lookAt(tmpV3);



  }

  renderer.render(scene, camera);
}


init();
animate();