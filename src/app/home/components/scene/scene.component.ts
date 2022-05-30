import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { interval } from 'rxjs';
import { WebGLService } from './services/web-gl.service';
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
  private gl?: WebGLRenderingContext

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
    // Set up to draw the scene periodically.
    const drawSceneInterval = interval(this._60fpsInterval);
    drawSceneInterval.subscribe(() => {
      this.drawScene();
    });
  }

  /**
   * Draws the scene
   */
  private drawScene() {
    // prepare the scene and update the viewport
    this.webglService.updateViewport();
    this.webglService.prepareScene();

    // draw the scene
    const offset = 0;
    const vertexCount = 4;
    if(this.gl){
      this.gl.drawArrays(
        this.gl.TRIANGLE_STRIP,
        offset,
        vertexCount
      );
    }
  }
}
