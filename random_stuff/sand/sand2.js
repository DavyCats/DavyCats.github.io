var W = 1000;
var H = 500;
var SPAWN_AMOUNT = 50;
var SPAWN_RADIUS = 15;
var DECAY_RATE = 0.5;

var col;
var time_since_fade = 0;
var initial_draw = true;


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
  pixelDensity(1);
}

function draw() {
  if (initial_draw) {
    background(0);
    initial_draw = false;
  }
  
  if (mouseIsPressed) {
    time_since_fade += deltaTime;
  }
  var fade = 0;
  if (time_since_fade > DECAY_RATE) {
    fade = 1;
    time_since_fade = 0;
  }
  loadPixels();
  for (var y = H-1; y >= 0; y--) {
    for (var x = W-1; x >= 0; x--) {
      var this_pixel = (y*W + x) * 4;
      var pixel_above = ((y-1)*W + x) * 4;
      var pixel_left = ((y)*W + x-1) * 4;
      var pixel_above_left = ((y-1)*W + x-1) * 4;
      var pixel_above_right = ((y-1)*W + x+1) * 4;

      for (var c = 0; c < 3; c++) {
        var new_value = pixels[this_pixel+c] - fade;

        if (pixels[this_pixel+c] == 0) {
          if (pixels[pixel_above+c] > 0) {
            new_value = pixels[pixel_above+c];
            pixels[pixel_above+c] = 0;
          } else if (x > 0 && pixels[pixel_above_left+c] > 0 && pixels[pixel_left+c] > 0) {
            new_value = pixels[pixel_above_left+c];
            pixels[pixel_above_left+c] = 0;
          } else if (x < W-1 && pixels[pixel_above_right+c] > 0) {
            new_value = pixels[pixel_above_right+c];
            pixels[pixel_above_right+c] = 0;
          }
        }
        pixels[this_pixel+c] = new_value;
      }
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