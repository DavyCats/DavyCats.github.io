var W = 1000;
var H = 500;
var SPAWN_AMOUNT = 50;
var SPAWN_RADIUS = 15;
var DECAY_RATE = 0.5;

var col;
var time_since_fade = 0;


function mouseWheel(event) {
  var old_hue = hue(col);
  var new_hue = old_hue + (event.delta > 0 ? 5 : -5);
  new_hue = new_hue > 0 ? new_hue : 359;
  col = color(new_hue, 255, 126);
}


function setup() {
  col = color(255,0,0);
  colorMode(HSB);
  createCanvas(W, H);
}

function draw() {
  if (mouseIsPressed) {
    time_since_fade += deltaTime;
  }
  var fade = 0;
  if (time_since_fade > DECAY_RATE) {
    fade = 1;
    time_since_fade = 0;
  }
  loadPixels();
  for (var x = W-1; x >= 0; x--) {
    for (var y = H-1; y >= 0; y--) {
      var this_pixel = (y*W + x) * 4;
      var pixel_above = ((y-1)*W + x) * 4;
      
      var new_red = pixels[this_pixel] - fade;
      var new_green = pixels[this_pixel+1] - fade;
      var new_blue = pixels[this_pixel+2] - fade;
      
      var this_pixel_is_black = pixels[this_pixel] == 0 &&
        pixels[this_pixel+1] == 0 &&
        pixels[this_pixel+2] == 0;      
      
      var pixel_above_is_black = pixels[pixel_above] == 0 &&
        pixels[pixel_above+1] == 0 &&
        pixels[pixel_above+2] == 0;
      
      if (this_pixel_is_black && ! pixel_above_is_black) {
        new_red = pixels[pixel_above];
        new_green = pixels[pixel_above+1];
        new_blue = pixels[pixel_above+2];
        pixels[pixel_above] = 0;
        pixels[pixel_above+1] = 0;
        pixels[pixel_above+2] = 0;
      }
      
      pixels[this_pixel] = new_red;
      pixels[this_pixel+1] = new_green;
      pixels[this_pixel+2] = new_blue;
      pixels[this_pixel+3] = 255;
    }
  }
  
  if (mouseX >= 0 && mouseX < W && mouseY >= 0 && mouseY < H) {
    for (var z = 0; z < SPAWN_AMOUNT; z++) {
      var r = random()*SPAWN_RADIUS;
      var angle = random()*TWO_PI;
      var offset_x = floor(r*cos(angle));
      var offset_y = floor(r*sin(angle));
      var mouse_pixel = (floor(mouseY+offset_y) * W + mouseX + offset_x) * 4;
      pixels[mouse_pixel] = red(col);
      pixels[mouse_pixel+1] = green(col);
      pixels[mouse_pixel+2] = blue(col);
      pixels[mouse_pixel+3] = 255;
    }
  }
  updatePixels();
}