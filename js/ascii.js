/**
 * Supporting framework for the ASCII debug visualizer.
 */

 function generateWithAlgo(
   algoSelectorId, widthId, heightId, outputId, backtrackId) {

   var algo = document.getElementById(algoSelectorId).value;
   var width = document.getElementById(widthId).value;
   var height = document.getElementById(heightId).value;
   var backtrack = document.getElementById(backtrackId).checked;

   var mze;

   //Not the best way, but works for this quick debug/ascii demo.
   switch (algo) {
     case "dfs":
       //TODO: If/when I implement new generation algorithms, change the
       //maze constructor to take an algorithm type.
       mze = new maze(~~width, ~~height);
       break;
     default:
       alert("Unrecognized algorithm: " + algo);
   }

   document.getElementById(outputId).innerHTML = mze.debugPrint(backtrack);
 }