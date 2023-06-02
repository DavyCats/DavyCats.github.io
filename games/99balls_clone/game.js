//settings
var w = 400;
var textSection = 64;
var rows = 12;
var columns = 8;
var circleSpawnRate = 0.6;
var ballSpawnRate = 0.075;
var shootRate = 5;
var velocity = 600; // pixels per second
var fps = 60;

// derivatives
var columnWidth;
var h;
var leftOffset;
var bottomLine;
var circleRadius;
var ballRadius;
var pixelsPerFrame;

// state
var circles = [];
var balls = [];
var numberOfBalls = 1;
var newBalls = 0;
var ballsSpawned = 0;
var framesSinceSpawn = Infinity;
var spawnLocation;
var newSpawnLocation;
var spawnLocationSet = false;
var shootTrajectory;
var inProgress = false;
var score = 0;
var lost = false;

function randomInt(minimum, maximum) {
  maximum = maximum + 1;
  return floor(random() * (maximum-minimum)) + minimum;
}

function getTrajectory(x1, y1, x2, y2) {
  var xOffset = x2 - x1;
  var yOffset = y2 - y1;
  var total = abs(xOffset) + abs(yOffset);
  var xPortion = abs(xOffset) / total;
  var yPortion = abs(yOffset) / total;
  if (xOffset < 0) {
    xPortion = -xPortion; 
  }
  if (yOffset < 0) {
    yPortion = -yPortion; 
  }
  return {x: xPortion, y: yPortion};
}

function checkWallCollision(ball) {
  if (ball.x - ballRadius <= 0 || ball.x + ballRadius >= w) {
    // make sure the ball isn't stuck bouncing from wall to wall
    if (ball.sideWallHit && (ball.right > 0.90 || ball.right < -0.90)) {
      ball.right = ball.right*0.99;
      ball.down = ball.down < 0? -(1-abs(ball.right)): 1-abs(ball.right);
    }
    ball.right = -ball.right;
    ball.sideWallHit = true;
  }
  if (ball.y - ballRadius <= 0) {
    ball.down = -ball.down;
    ball.sideWallHit = false;
  }
  if (ball.y + ballRadius >= bottomLine) {
    return true; // should despawn
  }
  return false; // should not despawn
}

function checkCircleCollision(ball) {
  for (var rowI=0; rowI < rows; rowI++) {
    for (var columnI=0; columnI < columns; columnI++) {
      if (circles[rowI][columnI] != 0) {
        // find collision
        circleX = columnI*columnWidth + leftOffset;
        circleY = rowI*columnWidth + columnWidth*1.5;
        var xOffset = circleX - ball.x;
        var yOffset = circleY - ball.y;
        var distance = sqrt(pow(xOffset, 2) + pow(yOffset, 2));
        if (circles[rowI][columnI] === -1 && distance < ballRadius * 2) { // increase balls
          newBalls = newBalls + 1;
          circles[rowI][columnI] = 0;
        } else if (circles[rowI][columnI] > 0 && distance < ballRadius + circleRadius) { // bounce
          // get collision vector
          var trajectory = getTrajectory(circleX, circleY, ball.x, ball.y);
          // apply vector to ball trajectory vector
          var xAdjusted = ball.right + trajectory.x*2;
          var yAdjusted = ball.down + trajectory.y*2;
          // normalize to have their absolutes sum to 1
          var total = abs(xAdjusted) + abs(yAdjusted);
          var xPortion = abs(xAdjusted)/total;
          var yPortion = abs(yAdjusted)/total;
          // set new trajectory
          ball.right = xAdjusted < 0 ? -xPortion: xPortion;
          ball.down = yAdjusted < 0 ? -yPortion: yPortion;
          ball.sideWallHit = false;

          //reduce value of hit circle
          circles[rowI][columnI] = circles[rowI][columnI] - 1;
        }
      }
    }
  }
}

function createRow() {
  var row = [];
  for (var columnI=0; columnI < columns; columnI++) {
    var value = 0;
    var r = random();
    if (r > 1 - circleSpawnRate) {
      value = randomInt(max(1, score - 10), score + 2);
    }
    if (r < ballSpawnRate) {
      value = -1;
    }
    row.push(value);
  }
  return row;
}

function mouseClicked(e) {
  if (e.offsetY < bottomLine && !inProgress) {
    shootTrajectory = getTrajectory(spawnLocation,
      bottomLine - ballRadius - 1, e.offsetX, e.offsetY);
    inProgress = true;
  }
}

function setup() {
  columnWidth = w / columns;
  h = w * (rows/columns) + textSection + columnWidth*2;
  leftOffset = columnWidth / 2;
  bottomLine = columnWidth * (rows+1);
  circleRadius = columnWidth / 2.5;
  ballRadius = circleRadius / 2;
  pixelsPerFrame = velocity / fps;

  spawnLocation = w / 2;
  
  colorMode(HSB, 100);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  
  frameRate(fps);
  createCanvas(w, h);
  
  // setup initial grid of circles
  for (var rowI=0; rowI < rows; rowI++) {
    var innerCircles = [];
    for (var columnI=0; columnI < columns; columnI++) {
      var value = 0;
      if (rowI === 0) {
        if (random() > 0.4) {
          value = randomInt(1, 2);
        }
      }
      innerCircles.push(value);
    }
    circles.push(innerCircles);
  }
}

function draw() {
  background(0);
  
  var despawners = [];

  // draw circles
  noStroke();
  for (var rowI=0; rowI < circles.length; rowI++) {
    for (var columnI=0; columnI < columns; columnI++) {
      var value = circles[rowI][columnI];
      if (value > 0) {
        // draw circle
        fill(value % 100, 100, 100);
        circle(columnI*columnWidth + leftOffset,
               rowI*columnWidth + columnWidth*1.5,
               circleRadius * 2);
        // show value in circle
        fill(0);
        textSize(circleRadius * 0.75);
        text(value,
             columnI*columnWidth + leftOffset,
             rowI*columnWidth + columnWidth*1.5);
      }
      if (value === -1) {
        // draw ball pickups
        fill(0, 0, 100)
        circle(columnI*columnWidth + leftOffset,
               rowI*columnWidth + columnWidth*1.5,
               ballRadius * 2);
      }
    }
  }

  // overlay
  fill(0, 0, 25);
  circle(newSpawnLocation || spawnLocation,
         bottomLine - ballRadius,
         ballRadius * 2);

  stroke(100);
  strokeWeight(2);
  line(0, bottomLine, w, bottomLine);
  
  fill(100);
  noStroke();
  textSize(textSection / 2);
  text(lost? "Final score:": "Click to shoot!",
       w / 2, h - textSection*0.75)
  text("Score:" + score + "\tBalls:" + (numberOfBalls+newBalls),
       w / 2, h - textSection/4);

  // draw and handle balls
  noStroke();
  for (var ballI=0; ballI < balls.length; ballI++) {
    // move ball 
    balls[ballI].y = balls[ballI].y + balls[ballI].down*pixelsPerFrame;
    balls[ballI].x = balls[ballI].x + balls[ballI].right*pixelsPerFrame;
  
    // draw ball
    fill(0, 0, 100);
    circle(balls[ballI].x, balls[ballI].y, ballRadius * 2);

    // check for collisions
    checkCircleCollision(balls[ballI])
    var shouldDespawn = checkWallCollision(balls[ballI]);
    if (shouldDespawn) {
      if (!spawnLocationSet) {
        newSpawnLocation = balls[ballI].x;
        spawnLocationSet = true;
      }
      despawners.push(ballI);
    }
  }

  // despawn balls
  for (var despawnI=0; despawnI < despawners.length; despawnI++) {
    balls.splice(despawners[despawnI], 1);
  }
  
  // spawn balls
  if (inProgress && ballsSpawned < numberOfBalls) {
    if (framesSinceSpawn >= shootRate) {
      balls.push({x: spawnLocation, 
                  y: bottomLine - ballRadius - 1, 
                  down: shootTrajectory.y, 
                  right: shootTrajectory.x,
                  sideWallHit: false});
      ballsSpawned = ballsSpawned + 1;
      framesSinceSpawn = 0;
    } else {
      framesSinceSpawn = framesSinceSpawn + 1;
    }
  }

  // handle level ending
  if (inProgress && !lost && balls.length === 0 && ballsSpawned === numberOfBalls) {
    var newRow = createRow();
    circles.unshift(newRow);
    if (circles[rows].map(arr => arr > 0).includes(true)) {
      lost = true;
    } else {
      numberOfBalls = numberOfBalls + newBalls;
      newBalls = 0;
      ballsSpawned = 0;
      framesSinceSpawn = Infinity;
    
      spawnLocation = newSpawnLocation;
      newSpawnLocation = null;
      spawnLocationSet = false;
      
      inProgress = false;
      score = score + 1;
      circles.pop();
    }
  }
}