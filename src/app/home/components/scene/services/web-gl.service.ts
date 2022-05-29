import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WebGLService {
  /**
   * The underlying {@link RenderingContext}.
   */
  private _renderingContext?: RenderingContext | null;

  /**
   * Gets the {@link _renderingContext} as a {@link WebGLRenderingContext}.
   */
  private get gl(): WebGLRenderingContext {
    return this._renderingContext as WebGLRenderingContext;
  }

  /**
   * Creates a new instance of the {@link WebGLService} class.
   */
  constructor() {}

  /**
   * Initialises a new {@link WebGLRenderingContext} as part of this service from the {@link canvas} provided.
   * @param canvas - the {@link HTMLCanvasElement}
   */
  initialiseWebGLContext(canvas: HTMLCanvasElement) {
    // Try to grab the standard context. If it fails, fallback to experimental.
    this._renderingContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    // If we don't have a GL context, give up now... only continue if WebGL is available and working...
    if (!this.gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    this.setWebGLCanvasDimensions(canvas);

    this.initialiseWebGLCanvas();
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
}
