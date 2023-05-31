var colors;

var pos = 0;
var sequence = [0,2,1,3,0,2,1,3,0,2,0,2,1,3,0,2,1,3,0,2]

var n = 20;
var max_d;
var min_d;
var base_d;
var off;

function setup() {
  createCanvas(200, 400);
  canvas.parent('sketch-holder');
  frameRate(24);
  noStroke();
  angleMode(DEGREES);
  colors = [[color(255,0,0), color(0,255,0)],
            [color(0,255,0), color(255,0,0)],
            [color(255,255,0), color(0,0,255)],
            [color(0,0,255), color(255,255,0)]];
  max_d = height / n;
  min_d = max_d / 4;
  base_d = (max_d-min_d)/2 + min_d; // height/diameter at midpoint
  off = max_d/2;
}

function nucleotide(i, rotation, strand, x, z) {
  var y = i*max_d;
  var h = z * (max_d-min_d) + min_d;
  var h1 = y - h/2;
  var h2 = y + h/2;
  
  fill(colors[sequence[i]][strand])
  quad(100+x, off+h1, 100, off+y - base_d/2,
       100, off+y + base_d/2, 100+x, off+h2);
}

function draw() {
  clear();
  pos = pos + deltaTime * 0.002;
  for (var i=0; i < n; i++) {
    var rotation = (i+pos)*36;
    var z1 = (-cos(rotation)+1)/2;
    var z2 = (cos(rotation)+1)/2;
    var x1 = sin(rotation) * 50;
    var x2 = -sin(rotation) * 50;

    nucleotide(i, rotation, 0, x1, z1);
    nucleotide(i, rotation, 1, x2, z2);
    
    // backbone
    fill(0);
    circle(100 + x1, off + i*max_d, z1*(max_d-min_d) + min_d);
    circle(100 + x2, off + i*max_d, z2*(max_d-min_d) + min_d);
  }
}