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
        if (texture2D(uImageTexture, uv) != ones) {
            gl_FragColor = vec4(abs(texture2D(uNoiseTexture, uv).xyz - ones.xyz), 1.);
        } else {
            gl_FragColor = texture2D(uNoiseTexture, uv);
        }
    }
`;

var PAUSE = false;

function pause() {
    PAUSE = ! PAUSE;
    if (!PAUSE) {
        requestAnimationFrame(render);
    }
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

// load image
gl.activeTexture(gl.TEXTURE0);
const ImageTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0,0,0,255])); // initial single pixel image
var image = new Image();
image.src = "./text.png";
image.addEventListener('load', function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, ImageTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
});

// make noise
gl.activeTexture(gl.TEXTURE1);
const noiseTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array(saltPepperNoise(canvas.width, canvas.height)));
gl.generateMipmap(gl.TEXTURE_2D);


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
        //gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Save as previous frame
        gl.activeTexture(gl.TEXTURE1);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.height, 0);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    if (!PAUSE) {
        requestAnimationFrame(render);
    }
}

requestAnimationFrame(render);


