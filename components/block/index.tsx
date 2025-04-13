"use client"

import type React from "react"
import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { ThreeEvent } from "@react-three/fiber"
import { Instances, Instance, useTexture } from "@react-three/drei"
import { BRICK_HEIGHT, LAYER_GAP, STUD_HEIGHT, STUD_RADIUS, STUD_SEGMENTS, TEXTURES } from "@/lib/constants"
import type { BlockProps } from "./types"

// Define crocodile shape points
const createCatShape = (scale = 1) => {
  const shape = new THREE.Shape()
  
  // Start from the bottom of the body
  shape.moveTo(0, -0.4 * scale)
  
  // Left side of body (rounded)
  shape.quadraticCurveTo(-0.3 * scale, -0.4 * scale, -0.5 * scale, -0.2 * scale)
  
  // Left side of head
  shape.quadraticCurveTo(-0.6 * scale, 0, -0.5 * scale, 0.2 * scale)
  
  // Top of head (snout)
  shape.quadraticCurveTo(-0.3 * scale, 0.4 * scale, 0, 0.4 * scale)
  
  // Right side of head
  shape.quadraticCurveTo(0.3 * scale, 0.4 * scale, 0.5 * scale, 0.2 * scale)
  shape.quadraticCurveTo(0.6 * scale, 0, 0.5 * scale, -0.2 * scale)
  
  // Right side of body
  shape.quadraticCurveTo(0.3 * scale, -0.4 * scale, 0, -0.4 * scale)
  
  return shape
}

// Create facial features
const createCatFace = (scale = 1) => {
  const face = new THREE.Group()
  
  // Eyes (cute and round)
  const eyeGeometry = new THREE.CircleGeometry(0.08 * scale, 32)
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
  
  // Add white part of the eyes
  const whiteEyeGeometry = new THREE.CircleGeometry(0.1 * scale, 32)
  const whiteEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  
  // Left eye
  const leftWhiteEye = new THREE.Mesh(whiteEyeGeometry, whiteEyeMaterial)
  leftWhiteEye.position.set(-0.25 * scale, 0.2 * scale, 0.01)
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.25 * scale, 0.2 * scale, 0.02)
  
  // Right eye
  const rightWhiteEye = new THREE.Mesh(whiteEyeGeometry, whiteEyeMaterial)
  rightWhiteEye.position.set(0.25 * scale, 0.2 * scale, 0.01)
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.25 * scale, 0.2 * scale, 0.02)
  
  // Add eye highlights
  const highlightGeometry = new THREE.CircleGeometry(0.03 * scale, 32)
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  
  const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  leftHighlight.position.set(-0.27 * scale, 0.22 * scale, 0.03)
  
  const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
  rightHighlight.position.set(0.23 * scale, 0.22 * scale, 0.03)
  
  // Add smile (curved line)
  const smilePoints = []
  for(let i = 0; i <= 32; i++) {
    const angle = (Math.PI * i) / 32
    smilePoints.push(
      new THREE.Vector3(
        Math.cos(angle) * 0.3 * scale,
        Math.sin(angle) * 0.1 * scale - 0.1 * scale,
        0.01
      )
    )
  }
  const smileGeometry = new THREE.BufferGeometry().setFromPoints(smilePoints)
  const smileMaterial = new THREE.LineBasicMaterial({ color: 0x000000 })
  const smile = new THREE.Line(smileGeometry, smileMaterial)
  
  // Add teeth
  const toothGeometry = new THREE.CircleGeometry(0.03 * scale, 3) // Triangle for tooth
  const toothMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  
  const teeth = new THREE.Group()
  // Add 4 teeth
  const toothPositions = [
    [-0.2, -0.15],
    [-0.1, -0.12],
    [0.1, -0.12],
    [0.2, -0.15]
  ]
  
  toothPositions.forEach(([x, y]) => {
    const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
    tooth.position.set(x * scale, y * scale, 0.02)
    tooth.rotation.z = Math.PI // Point downward
    teeth.add(tooth)
  })
  
  // Add spots on body
  const spotGeometry = new THREE.CircleGeometry(0.02 * scale, 32)
  const spotMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
  const spots = new THREE.Group()
  
  // Spot positions
  const spotPositions = [
    [-0.4, 0], [-0.3, 0.1], [-0.2, -0.1],
    [0.4, 0], [0.3, 0.1], [0.2, -0.1],
    [0, 0.1], [0.1, 0], [-0.1, 0]
  ]
  
  spotPositions.forEach(([x, y]) => {
    const spot = new THREE.Mesh(spotGeometry, spotMaterial)
    spot.position.set(x * scale, y * scale, 0.01)
    spots.add(spot)
  })
  
  face.add(
    leftWhiteEye, rightWhiteEye,
    leftEye, rightEye,
    leftHighlight, rightHighlight,
    smile,
    teeth,
    spots
  )
  return face
}

export const Block: React.FC<BlockProps> = ({
  color,
  position,
  width,
  height,
  isPlacing = false,
  opacity = 1,
  onClick,
  shape = "box",
}) => {
  const depth = height
  
  // Create geometry based on shape
  const blockGeometry = useMemo(() => {
    if (shape === "cat") {
      const extrudeSettings = {
        depth: BRICK_HEIGHT - LAYER_GAP,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
      }
      return new THREE.ExtrudeGeometry(createCatShape(0.8), extrudeSettings)
    }
    return new THREE.BoxGeometry(width, BRICK_HEIGHT - LAYER_GAP, depth)
  }, [width, depth, shape])

  const studGeometry = useMemo(
    () => new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, STUD_SEGMENTS),
    [],
  )

  const studPositions = useMemo(() => {
    const positions = []
    for (let x = -width / 2 + 0.5; x < width / 2; x++) {
      for (let z = -depth / 2 + 0.5; z < depth / 2; z++) {
        positions.push([x, BRICK_HEIGHT / 2 - LAYER_GAP / 2 + STUD_HEIGHT / 2, z])
      }
    }
    return positions
  }, [width, depth])

  const textures = useTexture(TEXTURES)

  const brickRef = useRef<THREE.Mesh>(null)
  const studRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const faceRef = useRef<THREE.Group>(null)

  // Determine if this is an erase highlight
  const isEraseHighlight = isPlacing && onClick !== undefined

  useFrame((state) => {
    if (isPlacing && brickRef.current && studRef.current) {
      // Use different colors for build mode (yellow) vs erase mode (red)
      const glowColor = isEraseHighlight ? new THREE.Color(1, 0, 0) : new THREE.Color(1, 1, 0)
      const glowIntensity = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 0.9

      brickRef.current.material.emissive.copy(glowColor)
      brickRef.current.material.emissiveIntensity = glowIntensity
      studRef.current.material.emissive.copy(glowColor)
      studRef.current.material.emissiveIntensity = glowIntensity
    }
  })

  const instanceLimit = useMemo(() => Math.max(width * depth, 100), [width, depth])

  // Convert color to darker version for better shadow definition
  const darkenedColor = useMemo(() => {
    if (isEraseHighlight) return "#ff0000" // Red for erase mode
    if (isPlacing) return "#ffff00" // Yellow for build mode

    // Convert hex to RGB
    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    // Darken by 10%
    const darkenFactor = 0.9
    const newR = Math.floor(r * darkenFactor)
    const newG = Math.floor(g * darkenFactor)
    const newB = Math.floor(b * darkenFactor)

    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
  }, [color, isPlacing, isEraseHighlight])

  // Handle click with stopPropagation to ensure the correct block is deleted
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onClick) onClick()
  }

  // Check if we're on mobile
  const isMobile = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  }, [])

  // Only use onPointerDown for erase mode on mobile
  // For build mode, we need to use the regular click handler
  const isEraseMode = isEraseHighlight && isMobile

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerDown={(e) => {
        // For mobile erase mode only, trigger click on pointer down
        if (isEraseMode && onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      <mesh ref={brickRef} geometry={blockGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={darkenedColor}
          roughnessMap={textures.roughness}
          normalMap={textures.normal}
          map={textures.color}
          roughness={0.7}
          metalness={0.1}
          emissive={isPlacing ? (isEraseHighlight ? "#ff0000" : "#ffff00") : "#000000"}
          emissiveIntensity={isPlacing ? 1 : 0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {shape === "cat" && (
        <primitive object={createCatFace(0.8)} ref={faceRef} />
      )}
      <Instances ref={studRef} geometry={studGeometry} limit={instanceLimit}>
        <meshStandardMaterial
          color={darkenedColor}
          roughnessMap={textures.roughness}
          normalMap={textures.normal}
          map={textures.color}
          roughness={0.7}
          metalness={0.1}
          emissive={isPlacing ? (isEraseHighlight ? "#ff0000" : "#ffff00") : "#000000"}
          emissiveIntensity={isPlacing ? 1 : 0}
          transparent={opacity < 1}
          opacity={opacity}
        />
        {studPositions.map((pos, index) => (
          <Instance key={index} position={pos} castShadow receiveShadow />
        ))}
      </Instances>
    </group>
  )
}
