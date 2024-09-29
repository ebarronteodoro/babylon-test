import React, { useEffect, useRef, useState } from 'react'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { HDRCubeTexture } from '@babylonjs/core/Materials/Textures/hdrCubeTexture'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'

// Importar el LoadingScreen para efectos secundarios necesarios
import '@babylonjs/core/Loading/loadingScreen'
import '@babylonjs/loaders/glTF'

import ZoomInIcon from './icons/ZoomInIcon'
import ZoomOutIcon from './icons/ZoomOutIcon'
import GlobalRotateIcon from './icons/GlobalRotateIcon'
import EyeIcon from './icons/EyeIcon'
import AnimatedButton from './AnimatedButton'

const BabylonScene = ({ modelPath }) => {
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const angleRef = useRef(Math.PI / 4)
  const radiusRef = useRef(10)
  const targetRadius = useRef(radiusRef.current + 20)
  const minRadius = 50
  const maxRadius = 150
  const targetAngle = useRef(angleRef.current)
  const lerpSpeed = 0.03

  const [isDragging, setIsDragging] = useState(false)
  const [lastMouseX, setLastMouseX] = useState(0)
  const [loading, setLoading] = useState(true) // Estado de carga
  const [isButtonEnabled, setIsButtonEnabled] = useState(false) // Habilitar botón después de la carga
  const [statusMessage, setStatusMessage] = useState('')

  const center = Vector3.Zero()

  useEffect(() => {
    const canvas = canvasRef.current
    const engine = new Engine(canvas, true)

    // Crear la escena
    const scene = new Scene(engine)
    scene.clearColor = new Vector3(0, 0, 0)

    // Crear la cámara UniversalCamera
    const camera = new UniversalCamera(
      'camera',
      new Vector3(0, 3, -radiusRef.current),
      scene
    )
    camera.setTarget(center)
    cameraRef.current = camera

    // Crear luz hemisférica
    const hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(1, 1, 0),
      scene
    )
    hemiLight.intensity = 0.5

    // Crear Skybox
    const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, scene)
    const skyboxMaterial = new StandardMaterial('skyBoxMaterial', scene)
    const hdrTexture = new HDRCubeTexture('/hdri/sky2.hdr', scene, 512)
    skyboxMaterial.reflectionTexture = hdrTexture
    skyboxMaterial.reflectionTexture.coordinatesMode = 5
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial

    // Cargar el modelo GLB y cambiar el estado de carga cuando termine
    try {
      SceneLoader.Append(
        '',
        modelPath,
        scene,
        scene => {
          const meshes = scene.meshes
          meshes.forEach(mesh => {
            mesh.receiveShadows = true
          })
          scene.executeWhenReady(() => {
            setStatusMessage('Modelo cargado') // Cambia el mensaje de estado
            setIsButtonEnabled(true) // Habilitar el botón
          })
        },
        null,
        (scene, message) => {
          console.error('Error al cargar el modelo:', message)
        }
      )
    } catch (error) {
      console.error('Error en el callback de SceneLoader.Append:', error)
    }

    // Manejar eventos de arrastre en la escena
    scene.onPointerDown = (evt, pickInfo) => {
      if (pickInfo.hit) {
        handlePointerDown(evt)
      }
    }

    scene.onPointerUp = evt => {
      handlePointerUp(evt)
    }

    scene.onPointerMove = evt => {
      handlePointerMove(evt)
    }

    // Render loop
    engine.runRenderLoop(() => {
      angleRef.current += (targetAngle.current - angleRef.current) * lerpSpeed
      radiusRef.current +=
        (targetRadius.current - radiusRef.current) * lerpSpeed
      updateCameraPosition()
      scene.render()
    })

    window.addEventListener('resize', () => {
      engine.resize()
    })

    return () => {
      engine.dispose()
    }
  }, [modelPath])

  const updateCameraPosition = () => {
    const newAngle = angleRef.current
    const newRadius = radiusRef.current
    const x = newRadius * Math.sin(newAngle)
    const z = newRadius * Math.cos(newAngle)
    cameraRef.current.position = new Vector3(x, 22, z)
    cameraRef.current.setTarget(center)
  }

  const rotateRight = () => {
    targetAngle.current -= 0.3
  }

  const rotateLeft = () => {
    targetAngle.current += 0.3
  }

  const zoomIn = () => {
    if (targetRadius.current > minRadius) {
      targetRadius.current -= 5
    }
  }

  const zoomOut = () => {
    if (targetRadius.current < maxRadius) {
      targetRadius.current += 5
    }
  }

  // Manejar el inicio del arrastre
  const handlePointerDown = e => {
    e.preventDefault()
    setIsDragging(true)
    setLastMouseX(e.clientX)
  }

  // Manejar el fin del arrastre
  const handlePointerUp = e => {
    e.preventDefault()
    setIsDragging(false)
  }

  // Manejar el movimiento del mouse
  const handlePointerMove = e => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouseX
      const sensitivity = 0.005
      targetAngle.current += deltaX * sensitivity
      setLastMouseX(e.clientX)
    }
  }

  const handleLoaderButtonClick = () => {
    setLoading(false) // Ocultar la pantalla de carga y mostrar el proyecto
  }

  return (
    <div className='main-content'>
      {loading && (
        <div className='loader2'>
          <img
            className='soil-logo'
            src='/images/soil_logo.png'
            alt='Soil-Logo'
          />
          <div className='loading-container'>
            {statusMessage !== 'Modelo cargado' && (
              <h2 className='loading-text'>
                Cargando
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </h2>
            )}
            <h2 className='loading-percentage'>{statusMessage}</h2>
          </div>
          <button
            className='loader-button'
            onClick={handleLoaderButtonClick}
            disabled={!isButtonEnabled}
            style={{
              opacity: isButtonEnabled ? 1 : 0.5,
              cursor: isButtonEnabled ? 'pointer' : 'not-allowed'
            }}
          >
            <EyeIcon width='24px' height='24px' />
            <span className='button-text'>VER PROYECTO</span>
          </button>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          width: '100dvw',
          height: '100dvh'
        }}
      />
      <div className='menubar2' style={{ display: loading ? 'none' : 'flex' }}>
        <AnimatedButton onClick={rotateLeft}>
          <GlobalRotateIcon width='30px' height='30px' />
        </AnimatedButton>
        <AnimatedButton onClick={rotateRight}>
          <GlobalRotateIcon
            width='30px'
            height='30px'
            style={{ transform: 'scaleX(-1)' }}
          />
        </AnimatedButton>
        <AnimatedButton onClick={zoomOut}>
          <ZoomOutIcon width='30px' height='30px' />
        </AnimatedButton>
        <AnimatedButton onClick={zoomIn}>
          <ZoomInIcon width='30px' height='30px' />
        </AnimatedButton>
      </div>
    </div>
  )
}

export default BabylonScene
