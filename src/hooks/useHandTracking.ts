import { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type GestureType = 'pinch' | 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down' | 'point' | 'palm' | null;

export const useHandTracking = (onGesture?: (gesture: GestureType) => void) => {
  const [isActive, setIsActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType>(null);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastGestureTimeRef = useRef<number>(0);

  const detectGesture = useCallback((result: HandLandmarkerResult): GestureType => {
    if (!result.landmarks || result.landmarks.length === 0) return null;

    const landmarks = result.landmarks[0];
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];

    // Pinch detection (thumb and index close)
    const pinchDist = Math.sqrt(
      Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
    );
    if (pinchDist < 0.05) return 'pinch';

    // Palm detection (all fingers extended and spread)
    const fingersExtended = [index, middle, ring, pinky].every(
      (finger) => finger.y < wrist.y
    );
    if (fingersExtended) return 'palm';

    // Point detection (only index extended)
    const indexExtended = index.y < wrist.y;
    const othersDown = [middle, ring, pinky].every((finger) => finger.y > wrist.y);
    if (indexExtended && othersDown) {
      // Swipe detection
      if (lastPositionRef.current) {
        const dx = index.x - lastPositionRef.current.x;
        const dy = index.y - lastPositionRef.current.y;
        const threshold = 0.15;

        if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
          if (Math.abs(dx) > Math.abs(dy)) {
            lastPositionRef.current = { x: index.x, y: index.y };
            return dx > 0 ? 'swipe_right' : 'swipe_left';
          } else {
            lastPositionRef.current = { x: index.x, y: index.y };
            return dy > 0 ? 'swipe_down' : 'swipe_up';
          }
        }
      }
      lastPositionRef.current = { x: index.x, y: index.y };
      return 'point';
    }

    return null;
  }, []);

  const drawHandMesh = useCallback((landmarks: any[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (landmarks.length === 0) return;

    // Hand connections (MediaPipe hand model)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm
    ];

    const hand = landmarks[0];

    // Draw connections
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
      const startPoint = hand[start];
      const endPoint = hand[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    });

    // Draw landmarks
    ctx.fillStyle = '#ff0088';
    hand.forEach((landmark: any) => {
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvas.width,
        landmark.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handLandmarkerRef.current = handLandmarker;

      const detectHands = async () => {
        if (videoRef.current && handLandmarkerRef.current && videoRef.current.readyState >= 2) {
          const result = handLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );

          // Update landmarks for visualization
          setLandmarks(result.landmarks || []);
          drawHandMesh(result.landmarks || []);

          const gesture = detectGesture(result);
          const now = Date.now();

          // Throttle gesture detection to avoid spam
          if (gesture && gesture !== currentGesture && now - lastGestureTimeRef.current > 500) {
            setCurrentGesture(gesture);
            onGesture?.(gesture);
            lastGestureTimeRef.current = now;
          } else if (!gesture) {
            setCurrentGesture(null);
          }
        }
        animationFrameRef.current = requestAnimationFrame(detectHands);
      };

      detectHands();
      setIsActive(true);
    } catch (error) {
      console.error('Error starting hand tracking:', error);
    }
  }, [detectGesture, currentGesture, onGesture, drawHandMesh]);

  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    handLandmarkerRef.current?.close();
    setIsActive(false);
    setCurrentGesture(null);
    setLandmarks([]);
    lastPositionRef.current = null;

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isActive,
    currentGesture,
    landmarks,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking
  };
};
