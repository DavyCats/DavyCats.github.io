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
        vec4 this_noise = texture2D(uNoiseTexture, uv);

        //float r = this_pixel.x < 0.5 ? abs(this_noise.x - 1.): this_noise.x;
        //float g = this_pixel.y < 0.5 ? abs(this_noise.y - 1.): this_noise.y;
        //float b = this_pixel.z < 0.5 ? abs(this_noise.z - 1.): this_noise.z;
        //gl_FragColor = vec4(r, g, b, 1.);

        float value = this_pixel.x + this_pixel.y + this_pixel.z;
        if (value < 1.5) {
            gl_FragColor = vec4(abs(this_noise.xyz - ones.xyz), 1.);
        } else {
            gl_FragColor = this_noise;
        }
    }
`;

var PAUSE = false;
var VIDEO = false;
var VIDEO_IS_PLAYING = false
var VIDEO_HAS_HAD_TIMEUPDATE = false;
var SOURCE_ELEMENT;
const CANVAS = document.getElementById("shader_canvas");

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

function rgbNoise(width, height){
    var out = [];
    for (var i = 0; i < width*height; i++){
        out.push(Math.random() > 0.5 ? 255: 0);
        out.push(Math.random() > 0.5 ? 255: 0);
        out.push(Math.random() > 0.5 ? 255: 0);
        out.push(255);
    }
    return out;
}

function pause() {
    PAUSE = ! PAUSE;
    if (!PAUSE) {
        requestAnimationFrame(render);
    }
}

function stop() {
    PAUSE = true;
}

function start() {
    PAUSE = false;
    requestAnimationFrame(render);
}

function setup_textures() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, SOURCE_ELEMENT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // make noise
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, CANVAS.width, CANVAS.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(saltPepperNoise(CANVAS.width, CANVAS.height)));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
}

function load_image(url) {
    stop();
    SOURCE_ELEMENT = document.createElement("img");
    SOURCE_ELEMENT.addEventListener('load', image_ready);
    SOURCE_ELEMENT.src = url;
    VIDEO = false;
}

// video
function load_video(url) {
    stop();
    SOURCE_ELEMENT = document.createElement("video");
    VIDEO_HAS_HAD_TIMEUPDATE = false;
    VIDEO_IS_PLAYING = false;
    SOURCE_ELEMENT.volume = 0;
    SOURCE_ELEMENT.loop = true;
    // checking both playing and timeupdate to ensure that data is available before rendering
    SOURCE_ELEMENT.addEventListener('playing', function() {
        VIDEO_IS_PLAYING = true;
        video_ready();
    });
    SOURCE_ELEMENT.addEventListener('timeupdate', function() {
        if (! VIDEO_HAS_HAD_TIMEUPDATE) {
            VIDEO_HAS_HAD_TIMEUPDATE = true;
            video_ready();
        }
    });
    SOURCE_ELEMENT.src = url;
    SOURCE_ELEMENT.play();
}

function image_ready() {
    CANVAS.width = SOURCE_ELEMENT.width;
    CANVAS.height = SOURCE_ELEMENT.height;
    setup_textures();
    start();
}

function video_ready() {
    if (VIDEO_IS_PLAYING && VIDEO_HAS_HAD_TIMEUPDATE) {
        // This is pretty much the as with an image, except that width/height use different variables
        CANVAS.width = SOURCE_ELEMENT.videoWidth;
        CANVAS.height = SOURCE_ELEMENT.videoHeight;
        setup_textures();
        VIDEO = true;
        start();
    }
}

function switch_image() {
    const file = document.getElementById("image_src").files[0];
    console.log(file);
    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith("image/")) {
            load_image(e.target.result);
        } else if (file.type.startsWith("video/")) {
            load_video(e.target.result);
        } else {
            alert("File type not supported.")
        }
    };
    reader.readAsDataURL(file);
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

        gl.uniform2f(resolutionUniformLocation, CANVAS.width, CANVAS.height);
        gl.uniform1i(imageTextureLocation, 0);
        gl.uniform1i(noiseTextureLocation, 1);

        // Clear the canvas and draw the square
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (VIDEO) {
            gl.activeTexture(gl.TEXTURE0);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, SOURCE_ELEMENT);
        }

        // Save as previous frame
        gl.activeTexture(gl.TEXTURE1);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, CANVAS.width, CANVAS.height, 0);
    }

    if (!PAUSE) {
        requestAnimationFrame(render);
    }
}

// Setup the canvas and webgl context.
const gl = CANVAS.getContext('webgl');
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

// Make sure webGL is supported.
if (!gl) {
    console.error('WebGL not supported, falling back on experimental-webgl');
    gl = CANVAS.getContext('experimental-webgl');
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

// fps control stuff
var lastFrameDrawnAt = window.performance.now();
var fps = 60;
var frameInterval = 1000/fps;

// load default image
load_image("./text.png")