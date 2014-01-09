

function game() {
  this.loaded = false;

  this.setLevel = function(mapdata) {
    alert(mapdata.title);
  }
}

var g = new game();
//generate_DFS(10, 10);
//g.setLevel(mapdata[0]);
var mz = new maze(5,5);
mz.debugPrint();