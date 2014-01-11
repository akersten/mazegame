var camera, scene, renderer, gameTimer;

/**
 * The main game object. Upon construction, it creates an initial maze and puts
 * the player in it.
 */
function game() {
  this.constants = {
    MAZE_START_SIZE: 6,
    WALL_SIZE: 25,
    BUN_RESOLUTION: 32,
    PLAYER_HEIGHT: 3,
    PLAYER_SPEED: 40,
    PLAYER_KEYTURN_SPEED: 0.03,
    PLAYER_MOUSETURN_SPEED_INV: 200,
    CROSSHAIR_COLOR: 0x00DDDD,
    FLASHLIGHT_COLOR: 0xEFEFDF,
    FLASHLIGHT_ANGLE: Math.PI / 3,
    FLASHLIGHT_FOCUS_EXPONENT: 20,
    FLASHLIGHT_BRIGHTNESS: 1.5,
    FLASHLIGHT_FALLOFF_BEGIN: -1, //Set later, references WALL_SIZE
    SHADOWMAP_RESOLUTION: 512,
    SHADOWCAM_FOV: 90,
  };

  this.constants.FLASHLIGHT_FALLOFF_BEGIN = 8 * this.constants.WALL_SIZE;

  //Many object variables forward-declared here just for ease of reference.
  this.currentMazeData = null;
  this.currentMazeMesh = null;
  this.playerMesh = null;
  this.playerLight = null;

  this.player = {x: 0, z: 0, theta: 0, phi: 0};

  this.textures = {};
  this.loadedTextures = 0;

  //How many textures must be loaded before we allow rendering, since the
  //texture loads are async and that makes our life a lot harder...

  this.REQUIRED_TEXTURES = ["floor1", "ceil1", "wall1"];

  /**
   * Avoid accidental closure by making this a proper function rather than a
   * this.inc... = function() style
   */
  function incLoadedTextures(targetGame) {
    targetGame.loadedTextures += 1;
  }

  /**
   * Loads any textures we'll be using. There might be special/scaled versions
   * of each for different uses in-game (like the scaled floor repeat texture).
   */
  this.loadTextures = function() {
    //Basically, textures named in the REQUIRED_TEXTURES array will be loaded by
    //name, and I'm assuming a <texture_name>_bumpmap.png also exists for the
    //texture. If this is not the behavior needed for a certain texture, add it
    //to the exceptions by making a case statement for its name.
    for (var i = 0; i < this.REQUIRED_TEXTURES.length; i++) {
      switch (this.REQUIRED_TEXTURES[i]) {
        case "some-example-texture":
          //This one might have a normal map too, maybe.
          break;
        default:
          this.textures[this.REQUIRED_TEXTURES[i]] =
            THREE.ImageUtils.loadTexture("res/" + this.REQUIRED_TEXTURES[i] +
                                         ".png", THREE.UVMapping);
          this.textures[this.REQUIRED_TEXTURES[i]] =
            THREE.ImageUtils.loadTexture("res/" + this.REQUIRED_TEXTURES[i] +
                                         "_bumpmap.png", THREE.UVMapping,
                                         incLoadedTextures(this));
          break;
      }

    }
  }

  /**
   * Generates a new maze of size `size` and sets the current maze mesh to the
   * generated maze. Clear the existing one from the scenegraph before calling
   * this, probably.
   */
  this.generateNewMaze = function (size, floorTextureName, wallTextureName,
                                  ceilTextureName) {
    //Generate the maze data and geometry.
    this.currentMazeData = new maze(size, size);
    var _mazeGeometry = generateMazeGeometry(this.currentMazeData);

    //Create the textured mesh from the geometry.
    this.currentMazeMesh =
      new THREE.Mesh(_mazeGeometry, new THREE.MeshPhongMaterial(
        {
          map: this.textures[wallTextureName],
          bumpMap: this.textures[wallTextureName],
        }
      )
                    );

    //We want self-shadowing, so the maze must both cast and receive.
    this.currentMazeMesh.castShadow = true;
    this.currentMazeMesh.receiveShadow = true;

    //Generate the ceiling and floor for this maze. Convenient that they're
    //planes, so the ceiling normals facing down lets us have a birds-eye view
    //too, if we want.
    var _bunWidth = this.constants.WALL_SIZE +
        this.currentMazeData.width * 2 * this.constants.WALL_SIZE;

    var _bunHeight = this.constants.WALL_SIZE +
        this.currentMazeData.height * 2 * this.constants.WALL_SIZE;

    //brick_bun (like hamburger bun, the ceiling and floor) changes its scale
    //based on the size of the maze, so it shouldn't be used for other meshes.
    //Since the bun is just two planes, we'll have to change the texture repeat
    //scale so it's consistent, based on the size of the maze. About 3-times the
    //number of cells in the maze is a good value.
    this.textures[floorTextureName].repeat.set(3 * this.currentMazeData.width,
                                               3 * this.currentMazeData.height);
    this.textures[floorTextureName].wrapS = THREE.RepeatWrapping;
    this.textures[floorTextureName].wrapT = THREE.RepeatWrapping;

    this.textures[ceilTextureName].repeat.set(3 * this.currentMazeData.width,
                                              3 * this.currentMazeData.height);
    this.textures[ceilTextureName].wrapS = THREE.RepeatWrapping;
    this.textures[ceilTextureName].wrapT = THREE.RepeatWrapping;

    //Make the floor and ceiling meshes.
    var _floor = new THREE.Mesh(
      new THREE.PlaneGeometry(_bunWidth, _bunHeight,
                              this.constants.BUN_RESOLUTION,
                              this.constants.BUN_RESOLUTION),
      new THREE.MeshPhongMaterial({map: this.textures[floorTextureName],
                                   bumpMap: this.textures[floorTextureName]}));

    _floor.rotation.x = Math.PI * 3 / 2;
    _floor.position.y = -this.constants.WALL_SIZE / 2;
    _floor.position.x += _bunWidth / 2 - this.constants.WALL_SIZE / 2;
    _floor.position.z += _bunHeight / 2 - this.constants.WALL_SIZE / 2;
    _floor.receiveShadow = true;

    var _ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(_bunWidth, _bunHeight,
                              this.constants.BUN_RESOLUTION,
                              this.constants.BUN_RESOLUTION),
      new THREE.MeshPhongMaterial({map: this.textures[ceilTextureName],
                                   bumpMap: this.textures[ceilTextureName]}));

    _ceil.rotation.x = Math.PI / 2;
    _ceil.position.y = this.constants.WALL_SIZE / 2;
    _ceil.position.x += _bunWidth / 2 - this.constants.WALL_SIZE / 2;
    _ceil.position.z += _bunHeight / 2 - this.constants.WALL_SIZE / 2;
    _ceil.receiveShadow = true;

    //TODO: Generate a background plane, since some renderers don't auto-clear.
    /*

  //generate giant background plane
  var bg2 = new THREE.Mesh(new THREE.PlaneGeometry(bgsx * 2, bgsz * 2),
                           new THREE.MeshLambertMaterial({color: 0x111111, wireframe: false}));
  bg2.rotation.x = Math.PI * 3/2;
  bg2.position.y = -25;
  bg2.position.x += bgsx / 2;
  bg2.position.z += bgsz / 2;
  scene.add(bg2);
  */

    //Add the scene components constituting the maze.
    scene.add(_floor);
    scene.add(_ceil);
    scene.add(this.currentMazeMesh);
  }


  /**
   * Call after generating the maze with `generateNewMaze`, puts the player
   * in the home cell within the maze. Should clear the player from the
   * scenegraph before doing this.
   */
  this.generateNewPlayer = function() {
    //Set up crosshair.
    this.playerCrosshair = new THREE.Mesh(
      new THREE.SphereGeometry(1, 3, 2),
      new THREE.MeshBasicMaterial({}));
    this.playerCrosshair.visible = false;

    //Set up the flashlight.
    this.playerLight = new THREE.SpotLight(this.constants.FLASHLIGHT_COLOR);
    this.playerLight.castShadow = true;
    this.playerLight.shadowMapWidth = this.constants.SHADOWMAP_RESOLUTION;
    this.playerLight.shadowMapHeight = this.constants.SHADOWMAP_RESOLUTION;
    this.playerLight.shadowCameraNear = 1;
    this.playerLight.shadowCameraFar = 500; //XXX: That should be far enough.
    this.playerLight.shadowCameraFov = this.constants.SHADOWCAM_FOV;
    this.playerLight.shadowDarkness = .75; //XXX: Can change later...
    this.playerLight.intensity = this.constants.FLASHLIGHT_BRIGHTNESS;
    this.playerLight.exponent = this.constants.FLASHLIGHT_FOCUS_EXPONENT;
    this.playerLight.angle = this.constants.FLASHLIGHT_ANGLE;
    this.playerLight.distance = this.constants.FLASHLIGHT_FALLOFF_BEGIN;

    scene.add(this.playerCrosshair);
    scene.add(this.playerLight);

    //Set the player's initial position to the maze home cell.
    this.player.x = 2 *
      (this.currentMazeData.homecell % this.currentMazeData.width) *
      this.constants.WALL_SIZE + this.constants.WALL_SIZE;
    this.player.z = 2 *
      ~~(this.currentMazeData.homecell / this.currentMazeData.width) *
      this.constants.WALL_SIZE + this.constants.WALL_SIZE;
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

  //Mouse motion deltas since last frame.
  this.mdx = 0.0;
  this.mdy = 0.0;

  /**
   * Update the motion deltas to be resolved on the next frame.
   */
  this.mouseMove = function(movX, movY) {
    this.mdx += movX;
    this.mdy += movY;
  }

  /**
   * Invoked by the renderer on an animation frame, with a time delta since the
   * last time logic ran.
   */
  this.doGameLogic = function(delta) {
    //--------------------------------------------------------------------------
    //Player/flashlight movement and camera updating
    //--------------------------------------------------------------------------

    //Add any mouse movement to the player's target direction angles.
    this.player.theta += this.mdx / this.constants.PLAYER_MOUSETURN_SPEED_INV;
    this.player.phi += this.mdy / this.constants.PLAYER_MOUSETURN_SPEED_INV;

    this.mdx = 0;
    this.mdy = 0;

    //Manual input for turning.
    if (keymap.pressed['turnLeft']) {
      this.player.theta -= this.constants.PLAYER_KEYTURN_SPEED;
    }

    if (keymap.pressed['turnRight']) {
      this.player.theta += this.constants.PLAYER_KEYTURN_SPEED;
    }

    //Clamp theta.
    while (this.player.theta >= 2.0 * Math.PI) {
      this.player.theta -= 2 * Math.PI;
    }

    while (this.player.theta < 0.0) {
      this.player.theta += 2 * Math.PI;
    }

    //Clamp phi.
    if (this.player.phi > Math.PI / 2) {
      this.player.phi = Math.PI / 2;
    }

    if (this.player.phi < -Math.PI / 2) {
      this.player.phi = - Math.PI / 2;
    }

    var _cT = Math.cos(this.player.theta);
    var _sT = Math.sin(this.player.theta);

    //Check to see if the player wants to move, and move if we can. First we
    //need a normalized viewport vector to see where the player is facing.
    var _playerDir = new THREE.Vector3(1.0 * _cT, 0, 1.0 * _sT);

    if (keymap.pressed['stepForward']) {
      if (!wouldPlayerCollideWithMaze(_playerDir,
                                      delta * this.constants.PLAYER_SPEED)) {
        this.player.x += delta * _cT * this.constants.PLAYER_SPEED;
        this.player.z += delta * _sT * this.constants.PLAYER_SPEED;
      }
    }

    if (keymap.pressed['stepBackward']) {
      if (!wouldPlayerCollideWithMaze(new THREE.Vector3(-_playerDir.x,
                                                        0,
                                                        -_playerDir.z),
                                      delta * this.constants.PLAYER_SPEED)) {
        this.player.x -= delta * _cT * this.constants.PLAYER_SPEED;
        this.player.z -= delta * _sT * this.constants.PLAYER_SPEED;
      }
    }

    //Vector orthogonal to the player view, to the right.
    var _xProd = new THREE.Vector3();
    _xProd.crossVectors(_playerDir, new THREE.Vector3(0.0, 1.0, 0.0));

    if (keymap.pressed['strafeRight']) {
      if (!wouldPlayerCollideWithMaze(_xProd,
                                      delta * this.constants.PLAYER_SPEED )) {
        this.player.x += delta * _xProd.x * this.constants.PLAYER_SPEED;
        this.player.z += delta * _xProd.z * this.constants.PLAYER_SPEED;
      }
    }

    if (keymap.pressed['strafeLeft']) {
      if (!wouldPlayerCollideWithMaze(new THREE.Vector3(-_xProd.x,
                                                        0,
                                                        -_xProd.z),
                                      delta * this.constants.PLAYER_SPEED)) {
        this.player.x -= delta * _xProd.x * this.constants.PLAYER_SPEED;
        this.player.z -= delta * _xProd.z * this.constants.PLAYER_SPEED;
      }
    }



    //Position the camera where the player should be, and position the crosshair
    //the correct distance out from the player.
    camera.position.x = this.player.x;
    camera.position.y = this.constants.PLAYER_HEIGHT;
    camera.position.z = this.player.z;

    //Keep the light caught up to the player position.
    this.playerLight.position.set(this.player.x,
                                  this.constants.PLAYER_HEIGHT,
                                  this.player.z);

    //Move the crosshair to a unit in front of where the player is looking.
    this.playerCrosshair.position.set(this.player.x + _playerDir.x,
                                      this.constants.PLAYER_HEIGHT,
                                      this.player.z + _playerDir.z);


    //TODO: Slow delay as camera moves to flashlight target...
    camera.lookAt(this.playerCrosshair.position);
    this.playerLight.target = this.playerCrosshair;
    //--------------------------------------------------------------------------

    if (keymap.pressed['debugPrint']) {
      console.log("Camera looking at: " + this.playerCrosshair.position.x + " " + this.playerCrosshair.position.y + " " + this.playerCrosshair.position.z);
    console.log (" (looking from: " + camera.position.x + " " + camera.position.y + " " + camera.position.z);
    console.log("Light pos: " + this.playerLight.position.x + " " + this.playerLight.position.y + " " + this.playerLight.position.z);
      console.log("scene graph:");
      for( var i = 0; i < scene.children.length; i++) {
        console.log("child " + scene.children[i].id + " at " + scene.children[i].position.x + " " + scene.children[i].position.y + " " + scene.children[i].position.z)
      }
    }

    if (keymap.pressed['cameraYaw']) {
      camera.rotation.x += 0.01;
    }

    if (keymap.pressed['cameraBarrel']) {
      camera.rotation.z += 0.01;
    }
  }

  /**
   * Async texture loading means we can't render until the textures have been
   * read, so don't say we're ready until then.
   */
  this.readyToRender = function() {
    return this.loadedTextures == this.REQUIRED_TEXTURES.length;

  }

  //Construct a new game by loading textures, generating the initial maze, and
  //placing the player in it.
  this.loadTextures();
  this.generateNewMaze(this.constants.MAZE_START_SIZE,
                       'floor1', 'wall1', 'ceil1');
  this.generateNewPlayer();


}

/**
 * Determines if the player would collide with the maze mesh by travelling
 * `distance` units in `direction` (normalized) from player's current position.
 *
 * @return true if the movement would result in a collision, false otherwise.
 */
function wouldPlayerCollideWithMaze(direction, distance) {
  //The 2.5 is a fudge factor on top of the delta movement distance - we want
  //to stay at least 2.5 units away from any wall, no matter how small our
  //movement.
  var ray = new THREE.Raycaster(new THREE.Vector3(g.player.x,
                                                  g.constants.PLAYER_HEIGHT,
                                                  g.player.z),
                                direction, 0, distance + 2.5);
  var colliders = ray.intersectObjects([g.currentMazeMesh], false);

  return (colliders.length > 0 && colliders[0].distance < distance);
}