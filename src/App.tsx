import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Download, Settings, RefreshCw, Sliders, Palette, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import P5Sketch from './components/P5Sketch';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [p5AsciiArt, setP5AsciiArt] = useState<{ chars: string, width: number, height: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(100);
  const [fontSize, setFontSize] = useState<number>(8);
  const [inverted, setInverted] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<string>("grayscale");
  const [charSet, setCharSet] = useState<string>('slashes');
  const [renderMode, setRenderMode] = useState<string>("text");
  const [contrast, setContrast] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charSets = {
    slashes: [' ', '-', '\\', '/'],
    standard: [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'],
    blocks: [' ', '░', '▒', '▓', '█'],
    minimal: [' ', '·', '○', '●'],
    custom: [' ', '.', ',', ':', ';', '+', '*', '?', '%', '$', '#', '@'],
    extended: [' ', '.', '`', '^', '"', ',', ':', ';', 'I', 'l', '!', 'i', '>', '<', '~', '+', '_', '-', '?', ']', '[', '}', '{', '1', ')', '(', '|', '\\', '/', 't', 'f', 'j', 'r', 'x', 'n', 'u', 'v', 'c', 'z', 'X', 'Y', 'U', 'J', 'C', 'L', 'Q', '0', 'O', 'Z', 'm', 'w', 'q', 'p', 'd', 'b', 'k', 'h', 'a', 'o', '*', '#', 'M', 'W', '&', '8', '%', 'B', '@', '$']
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const convertToAscii = () => {
    if (!image || !canvasRef.current) return;

    setLoading(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Calculate dimensions while maintaining aspect ratio
      const ratio = img.height / img.width;
      const calculatedWidth = Math.min(width, img.width);
      const calculatedHeight = Math.floor(calculatedWidth * ratio / 2); // Divide by 2 because characters are taller than wide
      
      canvas.width = calculatedWidth;
      canvas.height = calculatedHeight;
      
      // Apply contrast and brightness adjustments
      ctx.filter = `contrast(${contrast}) brightness(${brightness + 1})`;
      
      // Draw image to canvas
      ctx.drawImage(img, 0, 0, calculatedWidth, calculatedHeight);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, calculatedWidth, calculatedHeight);
      const data = imageData.data;
      
      // Get selected character set
      const selectedCharSet = charSets[charSet as keyof typeof charSets];
      
      // Convert to ASCII
      let result = '';
      const pixelColors: Array<{r: number, g: number, b: number}> = [];
      
      for (let y = 0; y < calculatedHeight; y++) {
        for (let x = 0; x < calculatedWidth; x++) {
          const idx = (y * calculatedWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Calculate brightness (0-255)
          let brightness = (r + g + b) / 3;
          
          // Invert if needed
          if (inverted) {
            brightness = 255 - brightness;
          }
          
          // Map brightness to ASCII character
          const charIndex = Math.floor(brightness / 256 * selectedCharSet.length);
          const char = selectedCharSet[Math.min(charIndex, selectedCharSet.length - 1)];
          
          result += char;
          
          // Store color for p5.js rendering
          pixelColors.push({r, g, b});
        }
        result += '\n';
      }
      
      setAsciiArt(result);
      
      // Set data for p5.js sketch
      setP5AsciiArt({
        chars: result,
        width: calculatedWidth,
        height: calculatedHeight
      });
      
      setLoading(false);
    };
    
    img.src = image;
  };

  const downloadAsciiArt = () => {
    if (!asciiArt) return;
    
    const element = document.createElement('a');
    const file = new Blob([asciiArt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = 'ascii-art.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadP5Canvas = () => {
    const canvasElement = document.querySelector('.p5Canvas') as HTMLCanvasElement;
    if (!canvasElement) return;
    
    const link = document.createElement('a');
    link.download = 'ascii-art.png';
    link.href = canvasElement.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (image) {
      convertToAscii();
    }
  }, [image, width, inverted, charSet, contrast, brightness]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.dataTransfer.files[0]);
    }
  };

  const resetSettings = () => {
    setWidth(100);
    setFontSize(8);
    setInverted(false);
    setColorMode("grayscale");
    setCharSet("slashes");
    setRenderMode("text");
    setContrast(1);
    setBrightness(0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-6xl bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
        <div className="p-6 border-b border-gray-700 bg-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center">
              <ImageIcon className="mr-2 text-blue-400" />
              P5.js ASCII Art Generator
            </h1>
            <p className="mt-2 text-gray-400">
              Convert your images into beautiful ASCII art with advanced rendering options
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center">
            <a 
              href="https://www.asciiart.eu/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              Inspired by asciiart.eu
            </a>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-blue-400" />
              Upload Image
            </h2>
            <div 
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-750 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-400 text-center">
                Click to upload or drag and drop<br />
                <span className="text-sm">PNG, JPG, GIF up to 10MB</span>
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            {image && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2 text-gray-300">Preview:</h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                  <img src={image} alt="Preview" className="w-full h-auto" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-400" />
              Settings
            </h2>
            <div className="bg-gray-750 border border-gray-700 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width (characters)
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-gray-400 w-10 text-center">{width}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Character Set
                </label>
                <select
                  value={charSet}
                  onChange={(e) => setCharSet(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="slashes">Slashes and Dashes</option>
                  <option value="standard">Standard ASCII</option>
                  <option value="blocks">Block Characters</option>
                  <option value="minimal">Minimal</option>
                  <option value="custom">Custom Set</option>
                  <option value="extended">Extended (70 chars)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Render Mode
                </label>
                <select
                  value={renderMode}
                  onChange={(e) => setRenderMode(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Plain Text</option>
                  <option value="p5">P5.js Canvas</option>
                </select>
              </div>
              
              {renderMode === "p5" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="4"
                        max="16"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="ml-2 text-gray-400 w-10 text-center">{fontSize}px</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Color Mode
                    </label>
                    <select
                      value={colorMode}
                      onChange={(e) => setColorMode(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="grayscale">Grayscale</option>
                      <option value="original">Original Colors</option>
                      <option value="sepia">Sepia</option>
                      <option value="neon">Neon</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contrast
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => setContrast(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-gray-400 w-10 text-center">{contrast.toFixed(1)}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brightness
                </label>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.1"
                    value={brightness}
                    onChange={(e) => setBrightness(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-gray-400 w-10 text-center">{brightness.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="invert"
                  checked={inverted}
                  onChange={(e) => setInverted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                />
                <label htmlFor="invert" className="ml-2 block text-sm text-gray-300">
                  Invert Colors
                </label>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={convertToAscii}
                  disabled={!image}
                  className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Regenerate
                </button>
                
                <button
                  onClick={resetSettings}
                  className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 text-gray-300 flex items-center">
                <Sliders className="w-5 h-5 mr-2 text-blue-400" />
                Character Preview
              </h3>
              <div className="bg-gray-750 border border-gray-700 rounded-lg p-4">
                <div className="font-mono text-sm">
                  {charSets[charSet as keyof typeof charSets].join(' ')}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Characters used from darkest to lightest
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-blue-400" />
              ASCII Art Result
            </h2>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-750 h-96 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : renderMode === "text" ? (
                asciiArt ? (
                  <pre className="text-xs whitespace-pre font-mono text-gray-300">{asciiArt}</pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Upload an image to see the ASCII art result
                  </div>
                )
              ) : (
                p5AsciiArt ? (
                  <div className="flex items-center justify-center h-full">
                    <P5Sketch 
                      asciiData={p5AsciiArt} 
                      fontSize={fontSize} 
                      colorMode={colorMode}
                      inverted={inverted}
                      charSet={charSets[charSet as keyof typeof charSets]}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Upload an image to see the ASCII art result
                  </div>
                )
              )}
            </div>
            
            {asciiArt && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={renderMode === "text" ? downloadAsciiArt : downloadP5Canvas}
                  className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download {renderMode === "text" ? "ASCII Text" : "Image"}
                </button>
                
                {renderMode === "p5" && (
                  <>
                    <button
                      onClick={() => setFontSize(Math.max(4, fontSize - 1))}
                      className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setFontSize(Math.min(16, fontSize + 1))}
                      className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>P5.js ASCII Art Generator © 2025 | Created with React, TypeScript and p5.js</p>
      </footer>
    </div>
  );
}

export default App;
