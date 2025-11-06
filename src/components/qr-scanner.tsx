import { useState, useEffect, useRef } from 'react'
import { Camera } from '@capacitor/camera'
import { CameraResultType, CameraSource } from '@capacitor/camera'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QrScannerProps {
  onResult: (url: string) => void
  onClose: () => void
}

export function QrScanner({ onResult, onClose }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setIsScanning(true)

      // Check if we're on mobile (Capacitor)
      if (window.Capacitor?.isNativePlatform()) {
        // Use Capacitor Camera for native mobile apps
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          promptLabelHeader: 'Scan QR Code',
          promptLabelPhoto: 'Take Photo',
          promptLabelPicture: 'Choose from Gallery'
        })

        if (image.dataUrl) {
          // Process the image for QR code
          await processImageForQR(image.dataUrl)
        }
      } else {
        // Use web camera for browser
        await startWebCamera()
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      })
      onClose()
    }
  }

  const startWebCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setHasPermission(true)
        
        // Initialize QR code reader
        codeReaderRef.current = new BrowserMultiFormatReader()
        
        // Start scanning
        setTimeout(() => {
          if (codeReaderRef.current && videoRef.current) {
            codeReaderRef.current.decodeFromVideoDevice(
              undefined,
              videoRef.current,
              (result, error) => {
                if (result) {
                  const text = result.getText()
                  if (isValidUrl(text)) {
                    onResult(text)
                    stopCamera()
                    onClose()
                  }
                }
              }
            )
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Web camera error:', error)
      throw error
    }
  }

  const processImageForQR = async (dataUrl: string) => {
    try {
      const codeReader = new BrowserMultiFormatReader()
      const result = await codeReader.decodeFromImageUrl(dataUrl)
      const text = result.getText()
      
      if (isValidUrl(text)) {
        onResult(text)
        toast({
          title: "QR Code Detected",
          description: "URL found and ready to scan for safety."
        })
      } else {
        toast({
          title: "Invalid QR Code",
          description: "QR code does not contain a valid URL.",
        })
      }
    } catch (error) {
      console.error('QR processing error:', error)
      toast({
        title: "QR Scan Failed",
        description: "Could not detect QR code in image.",
      })
    }
    setIsScanning(false)
    onClose()
  }

  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text)
      return text.startsWith('http://') || text.startsWith('https://')
    } catch {
      return false
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    if (codeReaderRef.current) {
      try {
        // Stop any ongoing decode operations
        codeReaderRef.current = null
      } catch (error) {
        console.log('Error stopping code reader:', error)
      }
    }
    
    setHasPermission(false)
    setIsScanning(false)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>QR Scanner</span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {window.Capacitor?.isNativePlatform() ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Camera will open to scan QR codes for URLs
              </p>
              {isScanning && (
                <div className="text-sm">Processing image...</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                autoPlay
                playsInline
                muted
              />
              {!hasPermission && (
                <p className="text-sm text-muted-foreground text-center">
                  Requesting camera permission...
                </p>
              )}
              {hasPermission && (
                <p className="text-sm text-muted-foreground text-center">
                  Point camera at QR code containing a URL
                </p>
              )}
            </div>
          )}
          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}