var camera, scene, renderer, gameTimer;
/**
 * The main game object.
 */
function game() {
  this.loaded = false;

  //First we'll generate the actual maze data.
  this.currentMaze = new maze(10,10);
  this.currentMaze.debugPrint();

  //Then, generate the world geometry.
  var currentMazeGeometry = generateMazeGeometry(this.currentMaze);
  var tmpTxt = THREE.ImageUtils.loadTexture("res/wood.png");
  this.currentMazeMesh = new THREE.Mesh(currentMazeGeometry,new THREE.MeshPhongMaterial(
    { color: 0xDDEEFF, wireframe: false, map: tmpTxt, bumpMap: tmpTxt }));
  this.currentMazeMesh.castShadow = true;
  this.currentMazeMesh.receiveShadow = true;

  var playerGeometry = new THREE.SphereGeometry(10, 3, 2);
  this.playerMesh = new THREE.Mesh(playerGeometry, new THREE.MeshBasicMaterial(
    {color: 0x111111, wireframe: false }));

  //Move the player to where they should be...
  this.playerMesh.position.x = 2 * (this.currentMaze.homecell % this.currentMaze.width) * 25 + 25;
  this.playerMesh.position.z = 2 * ~~(this.currentMaze.homecell / this.currentMaze.width) * 25 + 25;

  this.playerLight = new THREE.SpotLight(0xFFEEEE);
  this.playerLight.castShadow = true;
  this.playerLight.shadowMapWidth = 1024;
  this.playerLight.shadowMapHeight = 1024;
  this.playerLight.shadowCameraNear = 1;
  this.playerLight.shadowCameraFar = 400;
  this.playerLight.shadowCameraFov = 140;
  this.playerLight.shadowDarkness = 1;
  this.playerLight.intensity = 1;
  this.playerLight.exponent = 3;
  this.playerLight.angle = Math.PI / 3;
  //this.playerLight.shadowCameraVisible = true;


  this.crosshairMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 3, 2),
                                      new THREE.MeshBasicMaterial({color: 0xeeeeee, wireframe: true}));

  this.loaded = true;
}



function wouldPlayerCollideWithMaze(direction, distance) {
  var ray = new THREE.Raycaster(g.playerMesh.position, direction, 0, distance + 1);
  var colliders = ray.intersectObject(g.currentMazeMesh, false);

  return (colliders.length > 0 && colliders[0].distance < distance);
}