import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePreprocessor } from "./ImagePreprocessor";
import { useOCR } from "@/hooks/useOCR";
import { Car, Upload, Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface VehicleData {
  plate: string;
  serialNumber: string;
  year: string;
  model: string;
  color: string;
  confidence: number;
}

interface VehicleDocumentScannerProps {
  onDataExtracted: (data: VehicleData) => void;
}

export const VehicleDocumentScanner: React.FC<VehicleDocumentScannerProps> = ({
  onDataExtracted,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [extractedData, setExtractedData] = useState<VehicleData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processImage, isProcessing, progress } = useOCR();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error("Formato no soportado", {
        description: "Solo se aceptan archivos JPG, JPEG o PNG.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const extractVehicleData = async () => {
    if (!processedCanvas) {
      toast.error("No hay imagen procesada", {
        description: "Por favor, carga una imagen primero.",
      });
      return;
    }

    const result = await processImage(processedCanvas, "spa");
    if (!result) return;

    const text = result.text;

    // Regex patterns for vehicle documents
    const plateRegex = /(?:PLACA|PLATE)[:\s]*([A-Z0-9]{6,8})/i;
    const serialRegex = /(?:SERIAL|CARROCER[IÍ]A)[:\s]*([A-Z0-9]{10,17})/i;
    const yearRegex = /(?:AÑO|YEAR|MODELO)[:\s]*(\d{4})/i;
    const modelRegex = /(?:MODELO|MODEL)[:\s]*([A-Z0-9\s]+)/i;
    const colorRegex = /(?:COLOR)[:\s]*([A-ZÁÉÍÓÚÑ]+)/i;

    const plateMatch = text.match(plateRegex);
    const serialMatch = text.match(serialRegex);
    const yearMatch = text.match(yearRegex);
    const modelMatch = text.match(modelRegex);
    const colorMatch = text.match(colorRegex);

    const data: VehicleData = {
      plate: plateMatch ? plateMatch[1] : "",
      serialNumber: serialMatch ? serialMatch[1] : "",
      year: yearMatch ? yearMatch[1] : "",
      model: modelMatch ? modelMatch[1].trim() : "",
      color: colorMatch ? colorMatch[1].trim() : "",
      confidence: result.confidence,
    };

    setExtractedData(data);
    
    if (data.confidence >= 80) {
      toast.success("Datos del vehículo extraídos", {
        description: `Confianza: ${data.confidence.toFixed(1)}%`,
      });
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Escanear Carnet del Vehículo
          </CardTitle>
          <CardDescription>
            Toma una foto clara del carnet de circulación o documento de propiedad del vehículo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir Imagen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Procesando imagen... {progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {image && !isProcessing && (
        <>
          <ImagePreprocessor
            image={image}
            onProcessed={setProcessedCanvas}
          />

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={extractVehicleData}
                className="w-full"
                disabled={!processedCanvas}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Extraer Datos con OCR
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos del Vehículo Extraídos</CardTitle>
            <CardDescription>
              Revisa y corrige los datos antes de guardar. Confianza: {extractedData.confidence.toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                value={extractedData.plate}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, plate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial de Carrocería</Label>
              <Input
                id="serialNumber"
                value={extractedData.serialNumber}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, serialNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={extractedData.year}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, year: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={extractedData.model}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, model: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={extractedData.color}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, color: e.target.value })
                }
              />
            </div>

            <Button onClick={handleConfirm} className="w-full">
              Confirmar Datos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
