// settings
var w = 800;
var h = 600;
var speed = 15;
var appleRadius = 20;

// state
var snake = [];
var apple;
var xV = 0;
var yV = 0;
var lost = false;

function randomInt(minimum, maximum) {
  maximum = maximum + 1;
  return floor(random() * (maximum-minimum)) + minimum;
}

function keyPressed() {
  if (lost) {
    return true;
  }
  if ((key === 'w' || key === 'ArrowUp') && yV === 0) {
    yV = -speed;
    xV = 0;
  } else if ((key === 's' || key === 'ArrowDown') && yV === 0) {
    yV = speed;
    xV = 0;
  } else if ((key === 'a' || key === 'ArrowLeft') && xV === 0) {
    yV = 0;
    xV = -speed;
  } else if ((key === 'd' || key === 'ArrowRight') && xV === 0) {
    yV = 0;
    xV = speed;
  }
  return true;
}

function wallCollision() {
  if (snake[0][0] <= speed || 
      snake[0][0]+speed >= width-speed ||
      snake[0][1] <= speed ||
      snake[0][1]+speed >= height-speed) {
    lost = true;
  }
}

function selfCollision() {
  for (var snakeI=1; snakeI < snake.length; snakeI++) {
    /* The snake effectively moves in a grid 
     * (always moves it's own size in a given
     * direction), so we only need to check
     * if the coordinates are the same.
     */
    if (snake[0][0] === snake[snakeI][0] &&
        snake[0][1] === snake[snakeI][1]) {
      lost = true;
    }
  }
}

function appleCollision() {
  var dist = sqrt(pow(abs(snake[0][0] + speed/2 - apple[0]), 2) + 
                  pow(abs(snake[0][1] + speed/2 - apple[1]), 2));
  if (dist <= appleRadius) {
    snake.push(snake[snake.length - 1]);
    apple = [randomInt(appleRadius + speed, width - appleRadius - speed), 
             randomInt(appleRadius + speed, height - appleRadius - speed)];
  }
}

function setup() {
  var canvas = createCanvas(w, h);
  canvas.parent('sketch-holder');
  
  frameRate(30);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(72);
  snake.push([width/2, height/2]);
  apple = [randomInt(appleRadius + speed, width - appleRadius - speed), 
           randomInt(appleRadius + speed, height - appleRadius - speed)];
}

function draw() {
  background(102);
  
  // draw border
  fill(0);
  rect(0, 0, width, speed);
  rect(0, 0, speed, height);
  rect(0, height - speed, width, speed);
  rect(width - speed, 0, speed, height);
  
  // move snake and check collisions
  if (!lost) {
    snake.unshift([snake[0][0] + xV, snake[0][1] + yV]);
    snake.pop();
  }
    
  // check collisions
  wallCollision();
  selfCollision();
  appleCollision();
  
  // show score
  fill(255);
  text(snake.length, 0, 0, width, height);
  
  // draw snake
  fill(0,102,0);
  for (var snakeI = 0; snakeI < snake.length; snakeI++) {
    rect(snake[snakeI][0], snake[snakeI][1], speed);
  }
  
  // draw apple
  fill(102,0,0);
  circle(apple[0], apple[1], appleRadius);
}