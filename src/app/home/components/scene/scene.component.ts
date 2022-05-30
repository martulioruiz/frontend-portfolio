import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { interval } from 'rxjs';
import { WebGLService } from './services/web-gl.service';
import * as matrix from 'gl-matrix';

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.css'],
})
export class SceneComponent implements OnInit, AfterViewInit {
  @ViewChild('sceneCanvas') private canvas?: ElementRef<HTMLCanvasElement>;

  /**
   * The interval of refresh rate for drawing our scene during one second of elapsed time (1000ms).
   */
  private _60fpsInterval = 16.666666666666666667;
  private gl?: WebGLRenderingContext;

  private cubeRotation = 0;
  private deltaTime = 0;

  constructor(private webglService: WebGLService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.canvas) {
      alert('canvas not supplied! cannot bind WebGL context!');
      return;
    }
    this.gl = this.webglService.initialiseWebGLContext(
      this.canvas.nativeElement
    );
    // Set up to draw the scene periodically via deltaTime.
    const milliseconds = 0.001;
    this.deltaTime = this._60fpsInterval * milliseconds;
    const drawSceneInterval = interval(this._60fpsInterval);
    drawSceneInterval.subscribe(() => {
      this.drawScene();
      this.deltaTime = this.deltaTime + (this._60fpsInterval * milliseconds);
    });
  }

  /**
   * Draws the scene
   */
  private drawScene() {
    // prepare the scene and update the viewport
    this.webglService.formatScene();

    // draw the scene
    const offset = 0;
    // 2 triangles, 3 vertices, 6 faces
    const vertexCount = 2 * 3 * 6;

    // translate and rotate the model-view matrix to display the cube
    const mvm = this.webglService.getModelViewMatrix();
    matrix.mat4.translate(
        mvm,                    // destination matrix
        mvm,                    // matrix to translate
        [-0.0, 0.0, -6.0]       // amount to translate
        );
    matrix.mat4.rotate(
        mvm,                    // destination matrix
        mvm,                    // matrix to rotate
        this.cubeRotation,      // amount to rotate in radians
        [1, 1, 1]               // rotate around X, Y, Z axis
    );

    this.webglService.prepareScene();

    if(this.gl){
      this.gl.drawArrays(
        this.gl.TRIANGLES,
        offset,
        vertexCount
      );
    }


    // rotate the cube
    this.cubeRotation = this.deltaTime;
  }
}
