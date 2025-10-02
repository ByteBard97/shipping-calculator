<template>
  <div class="scanner-fullscreen">
    <!-- Camera view fills entire screen -->
    <video ref="videoElement" autoplay playsinline></video>
    <canvas ref="canvasElement" class="scanner-overlay"></canvas>
    <svg ref="overlayElement" class="detection-overlay">
      <polygon
        v-if="detectionPoints"
        :points="detectionPoints"
        class="detection-box"
      />
    </svg>

    <!-- Start button overlay when not scanning -->
    <div v-if="!isScanning" class="start-overlay">
      <button class="start-button" @click="startScanning">
        <div class="camera-icon">📷</div>
        <div>Start Camera</div>
      </button>
    </div>

    <!-- Decoded barcode display -->
    <div v-if="lastScanned" class="barcode-display">
      <div class="barcode-label">Scanned:</div>
      <div class="barcode-value">{{ lastScanned }}</div>
    </div>

    <!-- Simple controls overlay -->
    <div v-if="isScanning" class="controls">
      <button class="control-button stop" @click="stopScanning">
        Stop
      </button>
    </div>

    <!-- Package count -->
    <div v-if="packages.length > 0" class="package-count">
      {{ packages.length }} scanned
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/library'

interface Package {
  id: string
  barcode: string
  timestamp: number
}

const videoElement = ref<HTMLVideoElement>()
const canvasElement = ref<HTMLCanvasElement>()
const overlayElement = ref<SVGElement>()
const isScanning = ref(false)
const lastScanned = ref<string>()
const packages = ref<Package[]>([])
const detectionPoints = ref<string>()
const codeReader = new BrowserMultiFormatReader()
let stream: MediaStream | null = null
let scanInterval: number | null = null

onMounted(() => {
  loadPackages()
})

onUnmounted(() => {
  stopScanning()
})

async function startScanning() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // Use rear camera on phones
    })

    if (videoElement.value) {
      videoElement.value.srcObject = stream
      isScanning.value = true

      // Start scanning loop
      scanInterval = window.setInterval(async () => {
        await scanFrame()
      }, 300) // Scan every 300ms
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('Failed to access camera. Please grant camera permissions.')
  }
}

function stopScanning() {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }

  isScanning.value = false
}


async function scanFrame() {
  if (!videoElement.value || !canvasElement.value || !overlayElement.value) return

  const canvas = canvasElement.value
  const video = videoElement.value
  const svg = overlayElement.value

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  svg.setAttribute('viewBox', `0 0 ${video.videoWidth} ${video.videoHeight}`)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  try {
    const result = await codeReader.decodeFromImageElement(canvas as any)
    if (result) {
      // Get the corner points of the detected barcode
      const points = result.getResultPoints()
      if (points && points.length > 0) {
        // Convert points to SVG polygon format
        const pointsStr = points.map((p: any) => `${p.getX()},${p.getY()}`).join(' ')
        detectionPoints.value = pointsStr
      }
      handleBarcode(result.getText())

      // Clear detection box after 2 seconds
      setTimeout(() => {
        detectionPoints.value = undefined
      }, 2000)
    } else {
      detectionPoints.value = undefined
    }
  } catch (error) {
    // No barcode detected in this frame, continue scanning
    detectionPoints.value = undefined
  }
}

function handleBarcode(barcode: string) {
  // Check if already scanned recently (within 2 seconds)
  const recent = packages.value.find(
    p => p.barcode === barcode && Date.now() - p.timestamp < 2000
  )
  if (recent) return

  lastScanned.value = barcode

  const pkg: Package = {
    id: Date.now().toString(),
    barcode,
    timestamp: Date.now()
  }

  packages.value.unshift(pkg)
  savePackages()

  // Clear the "last scanned" display after 2 seconds
  setTimeout(() => {
    if (lastScanned.value === barcode) {
      lastScanned.value = undefined
    }
  }, 2000)
}

function loadPackages() {
  const stored = localStorage.getItem('scanned-packages')
  if (stored) {
    packages.value = JSON.parse(stored)
  }
}

function savePackages() {
  localStorage.setItem('scanned-packages', JSON.stringify(packages.value))
}

</script>

<style scoped>
.scanner-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: none;
}

.detection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.detection-box {
  fill: rgba(76, 175, 80, 0.2);
  stroke: #4caf50;
  stroke-width: 3;
  animation: blink 0.5s ease-in-out;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.start-button {
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 16px;
  padding: 32px 48px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.start-button:active {
  transform: scale(0.95);
}

.camera-icon {
  font-size: 64px;
}

.barcode-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(76, 175, 80, 0.95);
  color: white;
  padding: 24px 32px;
  border-radius: 16px;
  text-align: center;
  min-width: 300px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  animation: scaleIn 0.3s ease-out;
}

.barcode-label {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.barcode-value {
  font-size: 32px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.controls {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
}

.control-button {
  background: rgba(244, 67, 54, 0.9);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.control-button:active {
  transform: scale(0.95);
}

.package-count {
  position: absolute;
  top: 32px;
  right: 32px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: bold;
}

@keyframes scaleIn {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
</style>
