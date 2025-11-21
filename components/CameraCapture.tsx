import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  label?: string;
  aspectRatio?: 'square' | 'video';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, label = "Capture Image", aspectRatio = 'video' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera.");
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        setPreview(dataUrl);
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        onCapture(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setPreview(null);
    stopCamera();
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {label && <h3 className="font-medium text-gray-700">{label}</h3>}
      
      <div className={`relative w-full bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'}`}>
        
        {/* Placeholder / Actions */}
        {!isStreaming && !preview && (
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex gap-4">
              <button 
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition text-indigo-600"
              >
                <Camera size={24} />
                <span className="text-sm mt-2 font-medium">Camera</span>
              </button>
              <label className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition text-indigo-600 cursor-pointer">
                <Upload size={24} />
                <span className="text-sm mt-2 font-medium">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <p className="text-xs text-gray-500">Take a photo or upload from gallery</p>
          </div>
        )}

        {/* Video Stream */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`absolute inset-0 w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`} 
        />

        {/* Capture Button (Overlay) */}
        {isStreaming && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
            <button 
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full border-4 border-white bg-red-500 shadow-lg hover:bg-red-600 transition"
            />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="relative w-full h-full">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={reset}
              className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraCapture;
