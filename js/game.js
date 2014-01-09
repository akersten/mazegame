

function game() {
  this.loaded = false;

  this.setLevel = function(mapdata) {
    alert(mapdata.title);
  }
}

var g = new game();

//g.setLevel(mapdata[0]);
