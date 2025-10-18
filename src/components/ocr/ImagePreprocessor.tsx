import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, RotateCcw, Maximize2 } from "lucide-react";

interface ImagePreprocessorProps {
  image: HTMLImageElement | null;
  onProcessed: (canvas: HTMLCanvasElement) => void;
}

export const ImagePreprocessor: React.FC<ImagePreprocessorProps> = ({
  image,
  onProcessed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [threshold, setThreshold] = useState([128]);

  const preprocessImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply brightness and contrast
    const factor = (259 * (contrast[0] + 255)) / (255 * (259 - contrast[0]));
    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = data[i] + brightness[0] - 100;
      data[i + 1] = data[i + 1] + brightness[0] - 100;
      data[i + 2] = data[i + 2] + brightness[0] - 100;

      // Apply contrast
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;

      // Convert to grayscale
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Apply threshold (binarization)
      const binarized = gray > threshold[0] ? 255 : 0;
      data[i] = binarized;
      data[i + 1] = binarized;
      data[i + 2] = binarized;
    }

    ctx.putImageData(imageData, 0, 0);
    onProcessed(canvas);
  };

  const resetSettings = () => {
    setBrightness([100]);
    setContrast([100]);
    setThreshold([128]);
  };

  React.useEffect(() => {
    if (image) {
      preprocessImage();
    }
  }, [image, brightness, contrast, threshold]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Maximize2 className="w-5 h-5" />
          Preprocesamiento de Imagen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Brillo: {brightness[0]}%</label>
          <Slider
            value={brightness}
            onValueChange={setBrightness}
            min={0}
            max={200}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Contraste: {contrast[0]}%</label>
          <Slider
            value={contrast}
            onValueChange={setContrast}
            min={0}
            max={200}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Umbral de Binarización: {threshold[0]}</label>
          <Slider
            value={threshold}
            onValueChange={setThreshold}
            min={0}
            max={255}
            step={1}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={resetSettings} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
        </div>

        {image && (
          <div className="border rounded-lg overflow-hidden bg-muted">
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
