import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePreprocessor } from "./ImagePreprocessor";
import { useOCR } from "@/hooks/useOCR";
import { Camera, Upload, Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface IDData {
  documentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  confidence: number;
}

interface IDDocumentScannerProps {
  onDataExtracted: (data: IDData) => void;
}

export const IDDocumentScanner: React.FC<IDDocumentScannerProps> = ({
  onDataExtracted,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [extractedData, setExtractedData] = useState<IDData | null>(null);
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

  const extractIDData = async () => {
    if (!processedCanvas) {
      toast.error("No hay imagen procesada", {
        description: "Por favor, carga una imagen primero.",
      });
      return;
    }

    const result = await processImage(processedCanvas, "spa");
    if (!result) return;

    const text = result.text;

    // Regex patterns for Venezuelan ID
    const documentNumberRegex = /[VE]-?\s*(\d{6,8})/i;
    const nameRegex = /(?:NOMBRES?|FIRST\s+NAME)[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i;
    const lastNameRegex = /(?:APELLIDOS?|LAST\s+NAME)[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i;
    const dateRegex = /(?:FECHA\s+NAC|DATE\s+OF\s+BIRTH)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i;

    const documentMatch = text.match(documentNumberRegex);
    const nameMatch = text.match(nameRegex);
    const lastNameMatch = text.match(lastNameRegex);
    const dateMatch = text.match(dateRegex);

    const data: IDData = {
      documentNumber: documentMatch ? documentMatch[1] : "",
      firstName: nameMatch ? nameMatch[1].trim() : "",
      lastName: lastNameMatch ? lastNameMatch[1].trim() : "",
      dateOfBirth: dateMatch ? dateMatch[1] : "",
      confidence: result.confidence,
    };

    setExtractedData(data);
    
    if (data.confidence >= 80) {
      toast.success("Datos extraídos correctamente", {
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
            <Camera className="w-5 h-5" />
            Escanear Cédula de Identidad
          </CardTitle>
          <CardDescription>
            Toma una foto clara de tu cédula o sube una imagen. El OCR se procesa en tu navegador de forma privada.
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
                onClick={extractIDData}
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
            <CardTitle className="text-lg">Datos Extraídos</CardTitle>
            <CardDescription>
              Revisa y corrige los datos antes de guardar. Confianza: {extractedData.confidence.toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de Cédula (V-/E-)</Label>
              <Input
                id="documentNumber"
                value={extractedData.documentNumber}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, documentNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Nombres</Label>
              <Input
                id="firstName"
                value={extractedData.firstName}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, firstName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                value={extractedData.lastName}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, lastName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={extractedData.dateOfBirth}
                onChange={(e) =>
                  setExtractedData({ ...extractedData, dateOfBirth: e.target.value })
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
