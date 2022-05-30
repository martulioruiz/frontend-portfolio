import { Injectable } from '@angular/core';
import { GLSLConstants } from 'src/app/shared/GLSLConstants';
import fragmentShaderSrc from '../../../../../assets/toucan-fragment-shader.glsl';
import vertexShaderSrc from '../../../../../assets/toucan-vertex-shader.glsl';
import * as matrix from 'gl-matrix';
@Injectable({
  providedIn: 'root',
})
export class WebGLService {
  /**
   * The underlying {@link RenderingContext}.
   */
  private renderingContext?: RenderingContext | null;

  /**
   * Gets the {@link renderingContext} as a {@link WebGLRenderingContext}.
   */
  private get gl(): WebGLRenderingContext {
    return this.renderingContext as WebGLRenderingContext;
  }

  /**
   * Gets the {@link gl.canvas} as a {@link Element} client.
   */
  private get clientCanvas(): Element {
    return this.gl.canvas as Element
  }


  private fieldOfView = (45 * Math.PI) / 180; // in radians
  private aspect = 1;
  private zNear = 0.1;
  private zFar = 100.0;
  private projectionMatrix = matrix.mat4.create();
  private modelViewMatrix = matrix.mat4.create();
  private buffers: any
  private programInfo: any

  /**
   * Creates a new instance of the {@link WebGLService} class.
   */
  constructor() {}

  /**
   * Initialises a new {@link WebGLRenderingContext} as part of this service from the {@link canvas} provided.
   * @param canvas - the {@link HTMLCanvasElement}
   */
  initialiseWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext | undefined{
    // Try to grab the standard context. If it fails, fallback to experimental.
    this.renderingContext =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we don't have a GL context, give up now... only continue if WebGL is available and working...
    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    this.setWebGLCanvasDimensions(canvas);

    this.initialiseWebGLCanvas();

    // initialise shaders into WebGL
    let shaderProgram = this.initializeShaders();

    if(shaderProgram){
       // set up programInfo for buffers
    this.programInfo = {
      program: shaderProgram,
        attribLocations: {
          vertexPosition: this.gl.getAttribLocation(
            shaderProgram,
            'aVertexPosition'
          ),
          vertexColor: this.gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
          projectionMatrix: this.gl.getUniformLocation(
            shaderProgram,
            'uProjectionMatrix'
          ),
          modelViewMatrix: this.gl.getUniformLocation(
            shaderProgram,
            'uModelViewMatrix'
          ),
        },
      };

      // initalise the buffers to define what we want to draw
      this.buffers = this.initialiseBuffers();

      // prepare the scene to display content
      this.prepareScene();

      return this.gl
    }else{
      return undefined;
    }


  }

  /**
   * [initializeShaders] provides the functions necessary for loading,
   * compiling and attaching vertex and fragment shaders into a shader program.
   */
  initializeShaders(): WebGLProgram | null {
    // 1. Create the shader program
    let shaderProgram = this.gl.createProgram();

    if(shaderProgram){
      // 2. compile the shaders
      const compiledShaders = [];
      let fragmentShader = this.loadShader(
        fragmentShaderSrc,
        GLSLConstants.fragmentShaderMimeType
      );
      let vertexShader = this.loadShader(
        vertexShaderSrc,
        GLSLConstants.vertexShaderMimeType
      );
      compiledShaders.push(fragmentShader);
      compiledShaders.push(vertexShader);

      // 3. attach the shaders to the shader program using our WebGLContext
      if (compiledShaders && compiledShaders.length > 0) {
        for (let i = 0; i < compiledShaders.length; i++) {
          const compiledShader = compiledShaders[i];
          if (compiledShader) {
            this.gl.attachShader(shaderProgram, compiledShader);
          }
        }
      }

      // 4. link the shader program to our gl context
      this.gl.linkProgram(shaderProgram);

      // 5. check if everything went ok
      if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
        console.log(
          'Unable to initialize the shader program: ' +
            this.gl.getProgramInfoLog(shaderProgram)
        );
      }

      // 6. return shader
      return shaderProgram;
    }else{
      return null;
    }


  }

  /**
   * Initialises the WebGL canvas so it is ready for rendering.
   */
  initialiseWebGLCanvas() {
    // Set clear colour to black, fully opaque
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);

    // Near things obscure far things
    this.gl.depthFunc(this.gl.LEQUAL);

    // Clear the colour as well as the depth buffer.
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * Prepare's the WebGL context to render content.
   */
  prepareScene() {
    this.resizeWebGLCanvas();
    this.updateWebGLCanvas();

    // move the camera position a bit backwards to a position where
    // we can observe the content that will be drawn from a distance
    matrix.mat4.translate(
      this.modelViewMatrix, // destination matrix
      this.modelViewMatrix, // matrix to translate
      [0.0, 0.0, -6.0]      // amount to translate
    );

    // tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    this.bindVertexPosition(this.programInfo, this.buffers);

    // tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    this.bindVertexColor(this.programInfo, this.buffers);

    // tell WebGL to use our program when drawing
    this.gl.useProgram(this.programInfo.program);

    // set the shader uniforms
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      this.projectionMatrix
    );
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      this.modelViewMatrix
    );
  }

  /**
   * Resize the WebGL canvas based on the canvas's clientWidth and clientHeight.
   */
  resizeWebGLCanvas() {
    const width = this.clientCanvas.clientWidth;
    const height = this.clientCanvas.clientHeight;
    if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
      this.gl.canvas.width = width;
      this.gl.canvas.height = height;
    }
  }

  /**
   * Sets the {@link WebGLRenderingContext} canvas width and height based on the {@link HTMLCanvasElement} provided.
z`   *
   * @param canvas - the {@link HTMLCanvasElement}
   */
  setWebGLCanvasDimensions(canvas: HTMLCanvasElement) {
    // set width and height based on canvas width and height - good practice to use clientWidth and clientHeight
    this.gl.canvas.width = canvas.clientWidth;
    this.gl.canvas.height = canvas.clientHeight;
  }

  /**
   * Update the WebGL Viewport if we have a valid rendering context.
   */
  updateViewport() {
    if (this.gl) {
      this.gl.viewport(
        0,
        0,
        this.gl.drawingBufferWidth,
        this.gl.drawingBufferHeight
      );
      this.initialiseWebGLCanvas();
    } else {
      alert(
        'Error! WebGL has not been initialised! Ignoring updateViewport() call...'
      );
    }
  }

  /**
   * Update the WebGL canvas and configure the perspective matrix
   * for our viewpoint and origin before rending.
   */
  updateWebGLCanvas() {
    this.initialiseWebGLCanvas();

    // Our field of view is 45 degrees, with a width/height ratio of 640:480.
    // We only want to see objects  between 0.1 units and 100 units away from the camera.
    // The perspective projection matrix is a special matrix that is used to simulate the
    // distortion of perspective in a camera.
    this.aspect = this.clientCanvas.clientWidth / this.clientCanvas.clientHeight;
    this.projectionMatrix = matrix.mat4.create();
    matrix.mat4.perspective(
      this.projectionMatrix,
      this.fieldOfView,
      this.aspect,
      this.zNear,
      this.zFar
    );

    // Set the drawing position to the "identity" point, which is the center of the scene.
    this.setModelViewAsIdentity();
  }

  /**
   * Tell WebGL how to pull out the colors from the color buffer
   * into the vertexColor attribute.
   */
  private bindVertexColor(programInfo: any, buffers: any) {
    const bufferSize = 4;
    const type = this.gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.color);
    this.gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      bufferSize,
      type,
      normalize,
      stride,
      offset
    );
    this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  /**
   * Tell WebGL how to pull out the positions from the position
   * buffer into the vertexPosition attribute
   */
  private bindVertexPosition(programInfo: any, buffers: any) {
    const bufferSize = 2;
    const type = this.gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.position);
    this.gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      bufferSize,
      type,
      normalize,
      stride,
      offset
    );
    this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  /**
   * Checks the compiled shader and determines if its valid.
   * If it isn't, its deleted from the GL context to prevent integrity issues.
   *
   * @param compiledShader
   * returns true if valid, false otherwise
   */
  private checkCompiledShader(compiledShader: WebGLShader): boolean {
    if (!compiledShader) {
      // shader failed to compile, get the last error
      const lastError = this.gl.getShaderInfoLog(compiledShader);
      console.log("couldn't compile the shader due to: " + lastError);
      this.gl.deleteShader(compiledShader);
      return false;
    }
    return true;
  }

  /**
   * Determines the shader type and returns the result.
   * @param shaderMimeType
   * @returns -1 if the shader type could not be identified.
   */
  private determineShaderType(shaderMimeType: string): number {
    if (shaderMimeType) {
      if (shaderMimeType === GLSLConstants.vertexShaderMimeType) {
        return this.gl.VERTEX_SHADER;
      } else if (shaderMimeType === GLSLConstants.fragmentShaderMimeType) {
        return this.gl.FRAGMENT_SHADER;
      } else {
        console.log('Error: could not determine the shader type');
      }
    }
    return -1;
  }

  /**
   * Initialise the buffers we'll need. For this demo, we just
   * have one object -- a simple two-dimensional square.
   *
   * @returns {{position: WebGLBuffer}}
   */
  private initialiseBuffers(): any {
    // Create a buffer for the square's positions.
    const positionBuffer = this.gl.createBuffer();

    // bind the buffer to WebGL and tell it to accept an ARRAY of data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // create an array of positions for the square.
    const positions = new Float32Array([
       1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
      -1.0, -1.0
    ]);

    // set the list of positions into WebGL to build the
    // shape by passing it into bufferData.
    // We tell WebGL that the data supplied is an ARRAY and
    // to handle the data as a statically drawn shape.
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      positions,
      this.gl.STATIC_DRAW
    );

    // Set up the colors for the vertices
    let colors = new Uint16Array([
      1.0, 1.0, 1.0, 1.0, // white
      1.0, 0.0, 0.0, 1.0, // red
      0.0, 1.0, 0.0, 1.0, // green
      0.0, 0.0, 1.0, 1.0, // blue
    ]);

    const colorBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(colors),
      this.gl.STATIC_DRAW
    );

    return {
      position: positionBuffer,
      color: colorBuffer,
    };
  }

  /**
   * Loads a shader by source code and type supplied.
   * @param shaderSource
   * @param shaderType
   */
  private loadShader(shaderSource: string, shaderType: string): WebGLShader | null {
    const shaderTypeAsNumber = this.determineShaderType(shaderType);
    if (shaderTypeAsNumber < 0) {
      return null;
    }
    // Create the gl shader
    const glShader: WebGLShader | null = this.gl.createShader(shaderTypeAsNumber);

    if(glShader){
      // Load the source into the shader
      this.gl.shaderSource(glShader, shaderSource);

      // Compile the shaders
      this.gl.compileShader(glShader);

      // Check the compile status
      const compiledShader: WebGLShader = this.gl.getShaderParameter(
        glShader,
        this.gl.COMPILE_STATUS
      );
      return this.checkCompiledShader(compiledShader) ? glShader : null;
    }else{
      return null;
    }


  }

  /**
   * Loads the {@link modelViewMatrix} as an identity matrix.
   */
  private setModelViewAsIdentity() {
    this.modelViewMatrix = matrix.mat4.create();
  }
}
