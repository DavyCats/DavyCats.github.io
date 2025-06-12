/* THIS IS A MESS and needs a bunch of cleanup/refactoring....
 */

// Vertex shader source code
const vertexShaderSource = `
    attribute vec4 aVertexPosition;
    void main(void) {
        gl_Position = aVertexPosition;
    }
`;

// Fragment shader source code
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 uResolution;
    uniform sampler2D uImageTexture;
    uniform sampler2D uNoiseTexture;

    void main(void) {
        vec4 ones = vec4(1., 1., 1., 1.);
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        vec4 this_pixel = texture2D(uImageTexture, uv);
        float value = this_pixel.x + this_pixel.y + this_pixel.z;
        if (value < 1.5) {
            gl_FragColor = vec4(abs(texture2D(uNoiseTexture, uv).xyz - ones.xyz), 1.);
        } else {
            gl_FragColor = texture2D(uNoiseTexture, uv);
        }
    }
`;

var PAUSE = false;
var PLAYING_VIDEO = false;
var video_playing = false
var video_timeupdate = false;

function pause() {
    PAUSE = ! PAUSE;
    if (!PAUSE) {
        requestAnimationFrame(render);
    }
}

function stop() {
    PAUSE = true
}

function start() {
    PAUSE = false
    requestAnimationFrame(render);
}

function load_image(url) {
    // load image
    stop();
    image.src = url;
    PLAYING_VIDEO = false
}

// video
function load_video(url) {
    stop();
    video_timeupdate = false;
    video_playing = false;
    video.src = url;
    video.volume = 0;
    video.loop = true;
    video.play();
}

function video_ready() {
    if (video_playing && video_timeupdate) {
        // This is pretty much the as with an image, except that width/height use different variables
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        // make noise
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array(saltPepperNoise(canvas.width, canvas.height)));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        PLAYING_VIDEO = true;
        start();
    }
}

function switch_image() {
    load_video("Firefox.mp4")
}

function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


function saltPepperNoise(width, height){
    var out = [];
    for (var i = 0; i < width*height; i++){
        const val = Math.random() > 0.5 ? 255: 0;
        out.push(val);
        out.push(val);
        out.push(val);
        out.push(255);
    }
    return out;
}

// Setup the canvas and webgl context.
const canvas = document.getElementById("shader_canvas");
const gl = canvas.getContext('webgl');
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

// Make sure webGL is supported.
if (!gl) {
    console.error('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
}

if (!gl) {
    alert('Your browser does not support WebGL');
}

// Create shaders
const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create the shader program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
}

const ImageTexture = gl.createTexture();
const noiseTexture = gl.createTexture();
var image = new Image();
image.addEventListener('load', function() {
    canvas.width = image.width;
    canvas.height = image.height;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // make noise
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(saltPepperNoise(canvas.width, canvas.height)));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    start();
});

// Setup a video element, checking both playing and timeupdate to ensure that data is available before rendering
var video = document.createElement('video');
video.addEventListener('playing', function() {
    video_playing = true;
    video_ready();
})
video.addEventListener('timeupdate', function() {
    if (! video_timeupdate) {
        video_timeupdate = true;
        video_ready();
    }
})

// load default image
load_image("./text.png")

// fps control stuff
var lastFrameDrawnAt = window.performance.now();
var fps = 60;
var frameInterval = 1000/fps;

function render(time) {
    var elapsed = time - lastFrameDrawnAt;

    if (elapsed > frameInterval) {
        lastFrameDrawnAt = time - (elapsed % frameInterval);

        gl.useProgram(shaderProgram);

        // Define the area the shader will be applied over.
        const vertices = new Float32Array([
            1.0,  1.0,
            -1.0,  1.0,
            1.0, -1.0,
            -1.0, -1.0,
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Get the attribute location, enable it.
        const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(vertexPosition);
        gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);

        // Get the uniform locations
        const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'uResolution');
        var imageTextureLocation = gl.getUniformLocation(shaderProgram, "uImageTexture");
        var noiseTextureLocation = gl.getUniformLocation(shaderProgram, "uNoiseTexture");

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform1i(imageTextureLocation, 0);
        gl.uniform1i(noiseTextureLocation, 1);

        // Clear the canvas and draw the square
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (PLAYING_VIDEO) {
            gl.activeTexture(gl.TEXTURE0);
            //gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        }

        // Save as previous frame
        gl.activeTexture(gl.TEXTURE1);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.height, 0);
    }

    if (!PAUSE) {
        requestAnimationFrame(render);
    }
}
