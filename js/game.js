/**
 * The main game object. Upon construction, it creates an initial maze and puts
 * the player in it.
 */
function game() {
  this.loaded = false;

  this.constants = {
    MAZE_START_SIZE: 6,
    WALL_SIZE: 25,
    BUN_RESOLUTION: 32,
  };

  //Many object variables forward-declared here just for ease of reference.
  this.currentMazeData = null;
  this.currentMazeMesh = null;
  this.playerMesh = null;
  this.playerLight = null;

  this.textures = {};

  /**
   * Loads any textures we'll be using. There might be special/scaled versions
   * of each for different uses in-game (like the scaled floor repeat texture).
   */
  function loadTextures() {
    textures['bricks'] = THREE.ImageUtils.loadTexture("res/bricks.png");
    //bricks_bun (like hamburger bun, the ceiling and floor) changes its scale
    //based on the size of the maze, so it shouldn't be used for other meshes.
    textures['bricks_bun'] = THREE.ImageUtils.loadTexture("res/bricks.png");
  }

  /**
   * Generates a new maze of size `size` and sets the current maze mesh to the
   * generated maze. Clear the existing one from the scenegraph before calling
   * this, probably.
   */
  this.generateNewMaze = function (size) {
    //Generate the maze data and geometry.
    this.currentMaze = new maze(size, size);
    var _mazeGeometry = generateMazeGeometry(this.currentMaze);

    //Create the textured mesh from the geometry.
    this.currentMazeMesh =
      new THREE.Mesh(currentMazeGeometry, new THREE.MeshPhongMaterial(
        {
          map: this.textures['bricks'],
          bumpMap: this.textures['bricks'],
        }
      )
                    );

    //We want self-shadowing, so the maze must both cast and receive.
    this.currentMazeMesh.castShadow = true;
    this.currentMazeMesh.receiveShadow = true;

    //Generate the ceiling and floor for this maze. Convenient that they're
    //planes, so the ceiling normals facing down lets us have a birds-eye view
    //too, if we want.
    var _bunWidth = g.currentMazeData.width * 2 * this.constants.WALL_SIZE +
        this.constants.WALL_SIZE;
    var _bunHeight = g.currentMazeData.height* 2 * this.constants.WALL_SIZE +
        this.constants.WALL_SIZE;

    //Since the bun is just two planes, we'll have to change the texture repeat
    //scale so it's consistent, based on the size of the maze. About 3-times the
    //number of cells in the maze is a good value.
    brickTexture.repeat.set(3 * this.currentMazeData.width,
                            3 * this.currentMazeData.height);
    brickTexture.wrapS = THREE.RepeatWrapping;
    brickTexture.wrapT = THREE.RepeatWrapping;

    //Make the floor and ceiling meshes.
    var _floor = new THREE.Mesh(
      new THREE.PlaneGeometry(_bunWidth, _bunHeight, BUN_RESOLUTION,
                              BUN_RESOLUTION),
      new THREE.MeshPhongMaterial({map: brickTexture, bumpMap: brickTexture}));

    _floor.rotation.x = Math.PI * 3 / 2;
    _floor.position.y = -this.constants.WALL_SIZE / 2;
    _floor.position.x += _bunWidth / 2 - this.constants.WALL_SIZE / 2;
    _floor.position.z += _bunHeight / 2 - this.constants.WALL_SIZE / 2;
    _floor.receiveShadow = true;

    var _ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(_bunWidth, _bunHeight, BUN_RESOLUTION,
                              BUN_RESOLUTION),
      new THREE.MeshPhongMaterial({map: brickTexture, bumpMap: brickTexture}));
//TODO: Check that this is the correct rotation
    _ceil.rotation.x = Math.PI / 2;
    _ceil.position.y = this.constants.WALL_SIZE / 2;
    _ceil.position.x += _bunWidth / 2 - this.constants.WALL_SIZE / 2;
    _ceil.position.z += _bunHeight / 2 - this.constants.WALL_SIZE / 2;
    _ceil.receiveShadow = true;

    scene.add(_floor);
    scene.add(_ceil);
//TODO: Add other scene components
  }


  /**
   * Call after generating the maze with `generateNewMaze`, puts the player
   * in the home cell within the maze. Should clear the player from the
   * scenegraph before doing this.
   */
  this.generateNewPlayer = function() {
    var _playerGeometry = new THREE.SphereGeometry(10, 3, 2);
    this.playerMesh = new THREE.Mesh(
      playerGeometry, new THREE.MeshBasicMaterial({ color: 0x111111 }));

    //Set up the flashlight.
    this.playerLight = new THREE.SpotLight(0xEFEFEF);
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

//TODO: Add player and light to scene (move stuff from runOnce in main.js)
  }

  /**
   * Cleans up the current level to prepare for a new one. This involves
   * removing the current maze and ceiling/floors, removing the player,
   * removing hostiles, and lights. Anything added to the map (like wall-lights)
   * should be a child of the maze mesh anyway so that shouldn't be too bad to
   * remove.
   */
  this.degenerate = function() {
//TODO: Remove everything that was created.
  }

  /**
   * Invoked by the renderer on an animation frame, with a time delta since the
   * last time logic ran.
   */
  this.doGameLogic = function(delta) {

  }

  //Construct a new game by loading textures, generating the initial maze, and
  //placing the player in it.
  loadTextures();
  this.generateNewMaze(this.constants.MAZE_START_SIZE);
  this.generateNewPlayer();

  this.loaded = true;
}



function wouldPlayerCollideWithMaze(direction, distance) {
  var ray = new THREE.Raycaster(g.playerMesh.position, direction, 0, distance + 1);
  var colliders = ray.intersectObject(g.currentMazeMesh, false);

  return (colliders.length > 0 && colliders[0].distance < distance);
}