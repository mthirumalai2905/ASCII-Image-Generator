import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface P5SketchProps {
  asciiData: {
    chars: string;
    width: number;
    height: number;
  };
  fontSize: number;
  colorMode: string;
  inverted: boolean;
  charSet: string[];
}

const P5Sketch: React.FC<P5SketchProps> = ({ asciiData, fontSize, colorMode, inverted, charSet }) => {
  const sketchRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  useEffect(() => {
    // Clean up previous sketch if it exists
    if (p5Instance.current) {
      p5Instance.current.remove();
    }

    // Create new p5 instance
    p5Instance.current = new p5((p: p5) => {
      const { chars, width: asciiWidth, height: asciiHeight } = asciiData;
      const lines = chars.split('\n');
      
      p.setup = () => {
        // Create canvas with dimensions based on ASCII dimensions and font size
        const canvasWidth = asciiWidth * fontSize * 0.6; // Adjust for character width
        const canvasHeight = asciiHeight * fontSize;
        p.createCanvas(canvasWidth, canvasHeight);
        p.textFont('monospace');
        p.textSize(fontSize);
        p.textAlign(p.LEFT, p.TOP);
        p.background(0);
      };

      p.draw = () => {
        p.background(0);
        
        // Draw each character with appropriate styling
        for (let y = 0; y < lines.length; y++) {
          const line = lines[y];
          for (let x = 0; x < line.length; x++) {
            const char = line[x];
            const xPos = x * fontSize * 0.6; // Adjust for character width
            const yPos = y * fontSize;
            
            // Calculate color based on character density
            const charIndex = charSet.indexOf(char);
            const brightness = charIndex / (charSet.length - 1);
            const adjustedBrightness = inverted ? 1 - brightness : brightness;
            
            // Apply color mode
            switch (colorMode) {
              case 'grayscale':
                const grayValue = adjustedBrightness * 255;
                p.fill(grayValue);
                break;
              case 'original':
                // Original colors would require pixel data from the source image
                // Using a gradient as an approximation
                p.fill(
                  adjustedBrightness * 255,
                  adjustedBrightness * 200,
                  adjustedBrightness * 150
                );
                break;
              case 'sepia':
                p.fill(
                  adjustedBrightness * 255,
                  adjustedBrightness * 220,
                  adjustedBrightness * 180
                );
                break;
              case 'neon':
                // Neon effect with hue based on position
                p.colorMode(p.HSB, 255);
                p.fill(
                  (x + y) % 255, // Hue cycles through colors
                  200,           // High saturation
                  adjustedBrightness * 255 // Brightness based on character
                );
                break;
              default:
                p.fill(255);
            }
            
            // Draw the character
            p.text(char, xPos, yPos);
          }
        }
        
        // Only render once
        p.noLoop();
      };
      
      // Redraw when props change
      p.updateWithProps = () => {
        p.loop();
      };
    }, sketchRef.current);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
      }
    };
  }, [asciiData, fontSize, colorMode, inverted, charSet]);

  // Trigger redraw when props change
  useEffect(() => {
    if (p5Instance.current && (p5Instance.current as any).updateWithProps) {
      (p5Instance.current as any).updateWithProps();
    }
  }, [fontSize, colorMode, inverted]);

  return <div ref={sketchRef} className="w-full h-full"></div>;
};

export default P5Sketch;
