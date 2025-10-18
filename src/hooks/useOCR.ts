import { useState, useCallback } from "react";
import { createWorker, PSM, OEM } from "tesseract.js";
import { toast } from "sonner";

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = useCallback(async (
    imageSource: string | HTMLCanvasElement,
    language = "spa"
  ): Promise<OCRResult | null> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker(language, OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/.,: áéíóúñÁÉÍÓÚÑ",
      });

      const result = await worker.recognize(imageSource);
      
      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence,
        blocks: result.data.blocks.map((block) => ({
          text: block.text,
          confidence: block.confidence,
          bbox: block.bbox,
        })),
      };

      await worker.terminate();

      if (ocrResult.confidence < 80) {
        toast.warning("Baja confianza en el OCR", {
          description: "Por favor, toma una foto más clara con mejor iluminación y sin reflejos.",
        });
      }

      setIsProcessing(false);
      return ocrResult;
    } catch (error) {
      console.error("Error en OCR:", error);
      toast.error("Error al procesar la imagen", {
        description: "No se pudo extraer el texto. Intenta con otra foto.",
      });
      setIsProcessing(false);
      return null;
    }
  }, []);

  return {
    processImage,
    isProcessing,
    progress,
  };
};
