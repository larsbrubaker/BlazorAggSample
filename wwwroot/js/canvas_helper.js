window.updateCanvas = function (canvas, width, height, pixelData) {
    if (!canvas.gl) {
        canvas.gl = canvas.getContext('webgl');
        if (!canvas.gl) {
            console.error("Unable to initialize WebGL. Your browser may not support it.");
            return;
        }

        // Create and bind the texture
        canvas.texture = canvas.gl.createTexture();
        canvas.gl.bindTexture(canvas.gl.TEXTURE_2D, canvas.texture);
        canvas.gl.texParameteri(canvas.gl.TEXTURE_2D, canvas.gl.TEXTURE_WRAP_S, canvas.gl.CLAMP_TO_EDGE);
        canvas.gl.texParameteri(canvas.gl.TEXTURE_2D, canvas.gl.TEXTURE_WRAP_T, canvas.gl.CLAMP_TO_EDGE);
        canvas.gl.texParameteri(canvas.gl.TEXTURE_2D, canvas.gl.TEXTURE_MIN_FILTER, canvas.gl.NEAREST);
        canvas.gl.texParameteri(canvas.gl.TEXTURE_2D, canvas.gl.TEXTURE_MAG_FILTER, canvas.gl.NEAREST);

        // Set the shader program
        canvas.program = createShaderProgram(canvas.gl);
        canvas.gl.useProgram(canvas.program);

        // Create a buffer for the vertex positions
        var positionBuffer = canvas.gl.createBuffer();
        canvas.gl.bindBuffer(canvas.gl.ARRAY_BUFFER, positionBuffer);
        var positions = [
            -1.0, 1.0,
            1.0, 1.0,
            -1.0, -1.0,
            1.0, -1.0,
        ];
        canvas.gl.bufferData(canvas.gl.ARRAY_BUFFER, new Float32Array(positions), canvas.gl.STATIC_DRAW);

        // Link position data to shader attributes
        var positionAttributeLocation = canvas.gl.getAttribLocation(canvas.program, 'a_position');
        canvas.gl.enableVertexAttribArray(positionAttributeLocation);
        canvas.gl.vertexAttribPointer(positionAttributeLocation, 2, canvas.gl.FLOAT, false, 0, 0);

        // Set up the texture coordinates
        var texcoordBuffer = canvas.gl.createBuffer();
        canvas.gl.bindBuffer(canvas.gl.ARRAY_BUFFER, texcoordBuffer);
        canvas.gl.bufferData(canvas.gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
        ]), canvas.gl.STATIC_DRAW);

        // Link texture coordinate data to shader attributes
        var texcoordAttributeLocation = canvas.gl.getAttribLocation(canvas.program, 'a_texCoord');
        canvas.gl.enableVertexAttribArray(texcoordAttributeLocation);
        canvas.gl.vertexAttribPointer(texcoordAttributeLocation, 2, canvas.gl.FLOAT, false, 0, 0);
    }

    var gl = canvas.gl;

    // Adjust canvas size if necessary
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
    }

    // Update the texture with the new pixel data
    var pixelArray = new Uint8Array(pixelData.buffer);
    gl.bindTexture(gl.TEXTURE_2D, canvas.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelArray);

    // Draw the rectangle
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

function createShaderProgram(gl) {
    // Define shaders
    var vsSource = `
        attribute vec4 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
            gl_Position = a_position;
            v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // Flip the y-coordinate
        }
    `;
    var fsSource = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_texture;
        void main() {
            vec4 texColor = texture2D(u_texture, v_texCoord);
            // Swap the red and blue components
            gl_FragColor = vec4(texColor.b, texColor.g, texColor.r, texColor.a);
        }
    `;

    // Create and compile shaders
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Link shaders to create a program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader); // Add this line
    gl.linkProgram(program); // Add this line

    // Check the link status
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var info = gl.getProgramInfoLog(program);
        throw 'Could not compile WebGL program. \n\n' + info;
    }

    return program;
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check the compile status
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var info = gl.getShaderInfoLog(shader);
        throw 'Could not compile WebGL shader. \n\n' + info;
    }

    return shader;
}

