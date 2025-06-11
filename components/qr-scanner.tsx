"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Camera, X, Loader2 } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose?: () => void
  title?: string
}

export default function QRScanner({ onScan, onClose, title = "Scan QR Code" }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startScanner = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check if jsQR is loaded
        if (typeof window !== "undefined" && !window.jsQR) {
          // Load jsQR dynamically
          const jsQRScript = document.createElement("script")
          jsQRScript.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"
          jsQRScript.async = true
          jsQRScript.onload = initCamera
          jsQRScript.onerror = () => setError("Failed to load QR scanner library")
          document.body.appendChild(jsQRScript)
        } else {
          initCamera()
        }
      } catch (err) {
        console.error("Error starting QR scanner:", err)
        setError("Could not start QR scanner")
        setIsLoading(false)
      }
    }

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute("playsinline", "true") // Required for iOS
          videoRef.current.play()
          setIsScanning(true)
          setIsLoading(false)
          startScanningQR()
        }
      } catch (err) {
        console.error("Error accessing camera:", err)
        setError("Could not access camera. Please ensure you've granted camera permissions.")
        setIsLoading(false)
      }
    }

    const startScanningQR = () => {
      scanIntervalRef.current = setInterval(() => {
        scanQRCode()
      }, 500) // Scan every 500ms
    }

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current || !window.jsQR) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas dimensions to match video
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get image data for QR processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        // If QR code found
        if (code) {
          console.log("QR code detected:", code.data)
          stopScanner()
          onScan(code.data)
        }
      }
    }

    if (isScanning) {
      startScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isScanning, onScan])

  const stopScanner = () => {
    // Clear scanning interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const handleStartScan = () => {
    setIsScanning(true)
  }

  const handleClose = () => {
    stopScanner()
    if (onClose) onClose()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {isScanning ? (
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              )}
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-blue-500 opacity-50 z-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="h-24 w-24 text-gray-400" />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!isScanning && (
            <Button onClick={handleStartScan} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          )}

          {isScanning && (
            <Button variant="outline" onClick={stopScanner} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Cancel Scan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Add jsQR type definition
declare global {
  interface Window {
    jsQR: (
      data: Uint8ClampedArray,
      width: number,
      height: number,
      options?: { inversionAttempts: string },
    ) => { data: string } | null
  }
}
