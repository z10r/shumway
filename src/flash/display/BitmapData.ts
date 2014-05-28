/**
 * Copyright 2014 Mozilla Foundation
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Class: BitmapData
module Shumway.AVM2.AS.flash.display {
  import notImplemented = Shumway.Debug.notImplemented;
  import somewhatImplemented = Shumway.Debug.somewhatImplemented;
  import DataBuffer = Shumway.ArrayUtilities.DataBuffer;

  import asCoerceString = Shumway.AVM2.Runtime.asCoerceString;
  import throwError = Shumway.AVM2.Runtime.throwError;

  import Bounds = Shumway.Bounds;

  export class BitmapData extends ASNative implements IBitmapDrawable {

    // Called whenever the class is initialized.
    static classInitializer: any = null;
    
    // Called whenever an instance of the class is initialized.
    static initializer: any = null;
    
    // List of static symbols to link.
    static classSymbols: string [] = null; // [];
    
    // List of instance symbols to link.
    static instanceSymbols: string [] = null; // ["rect"];

    static MAXIMUM_WIDTH: number = 8191;
    static MAXIMUM_HEIGHT: number = 8191;
    static MAXIMUM_DIMENSION: number = 16777215;

    constructor (width: number /*int*/, height: number /*int*/, transparent: boolean = true, fillColor: number /*uint*/ = 4294967295) {
      width = width | 0; height = height | 0;
      false && super();
      this._id = flash.display.DisplayObject.getNextSyncID();
      if (width > BitmapData.MAXIMUM_WIDTH ||
        height > BitmapData.MAXIMUM_HEIGHT ||
        width * height > BitmapData.MAXIMUM_DIMENSION) {
        throwError('ArgumentError', Errors.ArgumentError);
      }

      this._bounds = new Bounds(0, 0, width, height);
      this._transparent = !!transparent;
      this._fillColor = fillColor;
      this._pixelData = new Uint32Array(width * height);
      this._dataBuffer = DataBuffer.FromArrayBuffer(this._pixelData.buffer);
      this._isDirty = true;
      this.fillRect(this.rect, this._fillColor);
    }
    
    _transparent: boolean;

    _id: number;
    _bounds: Shumway.Bounds;
    _fillColor: number;
    _locked: boolean;
    _pixelData: Uint32Array;
    _dataBuffer: DataBuffer;
    _isDirty: boolean;

    getDataBuffer(): DataBuffer {
      return this._dataBuffer;
    }

    _getContentBounds(): Bounds {
      return this._bounds.clone();
    }

    private _getPixelUnsafe(x, y): number {
      var pixelData = this._pixelData;
      var color = pixelData[y * this._bounds.width + x];
      var alpha = color & 0xff;
      var a = 0xff / alpha;
      var red = ((color >> 24) & 0xff) * a;
      var green = ((color >> 16) & 0xff) * a;
      var blue = ((color >> 8) & 0xff) * a;
      return (alpha << 24) | (red << 16) | (green << 8) | blue;
    }

    private _setPixelUnsafe(x, y, color, ignoreAlpha: boolean = false): void {
      var pixelData = this._pixelData;
      var i = y * this._bounds.width + x;
      var alpha = (ignoreAlpha ? this._pixelData[i] : color >> 24) & 0xff;
      var a = alpha / 0xff;
      var red = ((color >> 16) & 0xff) * a;
      var green = ((color >> 8) & 0xff) * a;
      var blue = (color & 0xff) * a;
      pixelData[i] = (red << 24) | (green << 16) | (blue << 8) | alpha;
    }

    private _getPixelData(rect: flash.geom.Rectangle): Uint32Array {
      var b = Bounds.FromRectangle(rect).clip(this._bounds);
      var output = new Uint32Array(b.area);
      var p = 0;
      for (var y = b.yMin; y < b.yMax; y++) {
        for (var x = b.xMin; x < b.xMax; x++) {
          output[p++] = this._getPixelUnsafe(x, y);
        }
      }
      return output;
    }

    private _putPixelData(rect: flash.geom.Rectangle, input: Uint32Array): void {
      var b = Bounds.FromRectangle(rect).clip(this._bounds);
      var padding = rect.width - b.width;
      var p = (rect.width * rect.height - b.height) + (b.xMin - rect.x);
      for (var y = b.yMin; y < b.yMax; y++) {
        for (var x = b.xMin; x < b.xMax; x++) {
          var color = input[p++];
          this._setPixelUnsafe(x, y, color);
        }
        p += padding;
      }
    }

    get width(): number /*int*/ {
      return this._bounds.width;
    }

    get height(): number /*int*/ {
      return this._bounds.height;
    }

    get rect(): flash.geom.Rectangle {
      return flash.geom.Rectangle.FromBounds(this._bounds);
    }

    get transparent(): boolean {
      return this._transparent;
    }

    clone(): flash.display.BitmapData {
      var bd = new BitmapData(this._bounds.width, this._bounds.height, this._transparent, this._fillColor);
      bd._pixelData.set(this._pixelData);
      return bd;
    }

    getPixel(x: number /*int*/, y: number /*int*/): number /*uint*/ {
      x = x | 0; y = y | 0;
      if (!this._bounds.contains(x, y)) {
        return 0;
      }
      return this._getPixelUnsafe(x, y) & 0x00ffffff;
    }

    getPixel32(x: number /*int*/, y: number /*int*/): number /*uint*/ {
      x = x | 0; y = y | 0;
      if (!this._bounds.contains(x, y)) {
        return 0;
      }
      return this._getPixelUnsafe(x, y) >>> 0;
    }

    setPixel(x: number /*int*/, y: number /*int*/, color: number /*uint*/): void {
      x = x | 0; y = y | 0; color = color >>> 0;
      if (!this._bounds.contains(x, y)) {
        return;
      }
      this._setPixelUnsafe(x, y, color, true);
    }

    setPixel32(x: number /*int*/, y: number /*int*/, color: number /*uint*/): void {
      x = x | 0; y = y | 0;
      if (!this._bounds.contains(x, y)) {
        return;
      }
      this._setPixelUnsafe(x, y, color);
    }

    applyFilter(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, filter: flash.filters.BitmapFilter): void {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; filter = filter;
      notImplemented("public flash.display.BitmapData::applyFilter"); return;
    }
    colorTransform(rect: flash.geom.Rectangle, colorTransform: flash.geom.ColorTransform): void {
      rect = rect; colorTransform = colorTransform;
      somewhatImplemented("public flash.display.BitmapData::colorTransform");
      return;
    }
    compare(otherBitmapData: flash.display.BitmapData): ASObject {
      otherBitmapData = otherBitmapData;
      notImplemented("public flash.display.BitmapData::compare"); return;
    }
    copyChannel(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, sourceChannel: number /*uint*/, destChannel: number /*uint*/): void {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; sourceChannel = sourceChannel >>> 0; destChannel = destChannel >>> 0;
      notImplemented("public flash.display.BitmapData::copyChannel"); return;
    }
    copyPixels(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, alphaBitmapData: flash.display.BitmapData = null, alphaPoint: flash.geom.Point = null, mergeAlpha: boolean = false): void {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; alphaBitmapData = alphaBitmapData; alphaPoint = alphaPoint; mergeAlpha = !!mergeAlpha;
      notImplemented("public flash.display.BitmapData::copyPixels"); return;
    }

    dispose(): void {
      this._bounds.setEmpty();
      this._pixelData = null;
    }

    draw(source: flash.display.IBitmapDrawable, matrix: flash.geom.Matrix = null, colorTransform: flash.geom.ColorTransform = null, blendMode: string = null, clipRect: flash.geom.Rectangle = null, smoothing: boolean = false): void {
      source = source; matrix = matrix; colorTransform = colorTransform; blendMode = asCoerceString(blendMode); clipRect = clipRect; smoothing = !!smoothing;
    }
    drawWithQuality(source: flash.display.IBitmapDrawable, matrix: flash.geom.Matrix = null, colorTransform: flash.geom.ColorTransform = null, blendMode: string = null, clipRect: flash.geom.Rectangle = null, smoothing: boolean = false, quality: string = null): void {
      source = source; matrix = matrix; colorTransform = colorTransform; blendMode = asCoerceString(blendMode); clipRect = clipRect; smoothing = !!smoothing; quality = asCoerceString(quality);
      notImplemented("public flash.display.BitmapData::drawWithQuality"); return;
    }

    fillRect(rect: flash.geom.Rectangle, color: number /*uint*/): void {
      color = color >>> 0;
      var b = Bounds.FromRectangle(rect).clip(this._bounds);
      for (var y = b.yMin; y < b.yMax; y++) {
        for (var x = b.xMin; x < b.xMax; x++) {
          this._setPixelUnsafe(x, y, color);
        }
      }
    }

    floodFill(x: number /*int*/, y: number /*int*/, color: number /*uint*/): void {
      x = x | 0; y = y | 0; color = color >>> 0;
      notImplemented("public flash.display.BitmapData::floodFill"); return;
    }
    generateFilterRect(sourceRect: flash.geom.Rectangle, filter: flash.filters.BitmapFilter): flash.geom.Rectangle {
      sourceRect = sourceRect; filter = filter;
      notImplemented("public flash.display.BitmapData::generateFilterRect"); return;
    }
    getColorBoundsRect(mask: number /*uint*/, color: number /*uint*/, findColor: boolean = true): flash.geom.Rectangle {
      mask = mask >>> 0; color = color >>> 0; findColor = !!findColor;
      notImplemented("public flash.display.BitmapData::getColorBoundsRect"); return;
    }

    getPixels(rect: flash.geom.Rectangle): flash.utils.ByteArray {
      var outputByteArray = new flash.utils.ByteArray();
      this.copyPixelsToByteArray(rect, outputByteArray);
      return outputByteArray;
    }

    copyPixelsToByteArray(rect: flash.geom.Rectangle, data: flash.utils.ByteArray): void {
      var pixelData = this._getPixelData(rect);
      if (!pixelData) {
        return;
      }
      data.writeRawBytes(new Uint8Array(pixelData));
    }

    getVector(rect: flash.geom.Rectangle): Uint32Vector {
      var outputVector = new Uint32Vector(pixelData.length);
      var pixelData = this._getPixelData(rect);
      if (!pixelData) {
        return outputVector;
      }
      outputVector.length = pixelData.length;
      outputVector._view().set(pixelData);
      return outputVector;
    }

    hitTest(firstPoint: flash.geom.Point, firstAlphaThreshold: number /*uint*/, secondObject: ASObject, secondBitmapDataPoint: flash.geom.Point = null, secondAlphaThreshold: number /*uint*/ = 1): boolean {
      firstPoint = firstPoint; firstAlphaThreshold = firstAlphaThreshold >>> 0; secondObject = secondObject; secondBitmapDataPoint = secondBitmapDataPoint; secondAlphaThreshold = secondAlphaThreshold >>> 0;
      notImplemented("public flash.display.BitmapData::hitTest"); return;
    }
    merge(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, redMultiplier: number /*uint*/, greenMultiplier: number /*uint*/, blueMultiplier: number /*uint*/, alphaMultiplier: number /*uint*/): void {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; redMultiplier = redMultiplier >>> 0; greenMultiplier = greenMultiplier >>> 0; blueMultiplier = blueMultiplier >>> 0; alphaMultiplier = alphaMultiplier >>> 0;
      notImplemented("public flash.display.BitmapData::merge"); return;
    }
    noise(randomSeed: number /*int*/, low: number /*uint*/ = 0, high: number /*uint*/ = 255, channelOptions: number /*uint*/ = 7, grayScale: boolean = false): void {
      randomSeed = randomSeed | 0; low = low >>> 0; high = high >>> 0; channelOptions = channelOptions >>> 0; grayScale = !!grayScale;
      notImplemented("public flash.display.BitmapData::noise"); return;
    }
    paletteMap(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, redArray: any [] = null, greenArray: any [] = null, blueArray: any [] = null, alphaArray: any [] = null): void {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; redArray = redArray; greenArray = greenArray; blueArray = blueArray; alphaArray = alphaArray;
      notImplemented("public flash.display.BitmapData::paletteMap"); return;
    }
    perlinNoise(baseX: number, baseY: number, numOctaves: number /*uint*/, randomSeed: number /*int*/, stitch: boolean, fractalNoise: boolean, channelOptions: number /*uint*/ = 7, grayScale: boolean = false, offsets: any [] = null): void {
      baseX = +baseX; baseY = +baseY; numOctaves = numOctaves >>> 0; randomSeed = randomSeed | 0; stitch = !!stitch; fractalNoise = !!fractalNoise; channelOptions = channelOptions >>> 0; grayScale = !!grayScale; offsets = offsets;
      notImplemented("public flash.display.BitmapData::perlinNoise"); return;
    }
    pixelDissolve(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, randomSeed: number /*int*/ = 0, numPixels: number /*int*/ = 0, fillColor: number /*uint*/ = 0): number /*int*/ {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; randomSeed = randomSeed | 0; numPixels = numPixels | 0; fillColor = fillColor >>> 0;
      notImplemented("public flash.display.BitmapData::pixelDissolve"); return;
    }
    scroll(x: number /*int*/, y: number /*int*/): void {
      x = x | 0; y = y | 0;
      notImplemented("public flash.display.BitmapData::scroll"); return;
    }

    setPixels(rect: flash.geom.Rectangle, inputByteArray: flash.utils.ByteArray): void {
      this._putPixelData(rect, new Uint32Array(inputByteArray.readRawBytes()));
    }

    setVector(rect: flash.geom.Rectangle, inputVector: Uint32Vector): void {
      this._putPixelData(rect, inputVector._view());
    }

    threshold(sourceBitmapData: flash.display.BitmapData, sourceRect: flash.geom.Rectangle, destPoint: flash.geom.Point, operation: string, threshold: number /*uint*/, color: number /*uint*/ = 0, mask: number /*uint*/ = 4294967295, copySource: boolean = false): number /*uint*/ {
      sourceBitmapData = sourceBitmapData; sourceRect = sourceRect; destPoint = destPoint; operation = asCoerceString(operation); threshold = threshold >>> 0; color = color >>> 0; mask = mask >>> 0; copySource = !!copySource;
      notImplemented("public flash.display.BitmapData::threshold"); return;
    }

    lock(): void {
      this._locked = true;
    }

    unlock(changeRect: flash.geom.Rectangle = null): void {
      //changeRect = changeRect;
      this._locked = false;
    }

    histogram(hRect: flash.geom.Rectangle = null): ASVector<any> {
      hRect = hRect;
      notImplemented("public flash.display.BitmapData::histogram"); return;
    }
    encode(rect: flash.geom.Rectangle, compressor: ASObject, byteArray: flash.utils.ByteArray = null): flash.utils.ByteArray {
      rect = rect; compressor = compressor; byteArray = byteArray;
      notImplemented("public flash.display.BitmapData::encode"); return;
    }
  }
}
