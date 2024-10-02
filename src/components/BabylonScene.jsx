import React, { useEffect, useRef, useState } from 'react'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'

// import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';

import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { HDRCubeTexture } from '@babylonjs/core/Materials/Textures/hdrCubeTexture'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'

import '@babylonjs/core/Loading/loadingScreen'
import '@babylonjs/loaders/glTF'

import ZoomInIcon from './icons/ZoomInIcon'
import ZoomOutIcon from './icons/ZoomOutIcon'
import GlobalRotateIcon from './icons/GlobalRotateIcon'
import EyeIcon from './icons/EyeIcon'
import AnimatedButton from './AnimatedButton'
import { ActionManager, ExecuteCodeAction } from '@babylonjs/core';

const BabylonScene = ({ modelPath }) => {
  const canvasRef = useRef(null)
  const cameraRef = useRef(null)
  const angleRef = useRef(Math.PI / 4)
  const radiusRef = useRef(100)
  const targetRadius = useRef(radiusRef.current)
  const minRadius = 50
  const maxRadius = 150
  const targetAngle = useRef(angleRef.current)
  const lerpSpeed = 0.05

  const [isDragging, setIsDragging] = useState(false)
  const [lastMouseX, setLastMouseX] = useState(0)
  const [lastTouchX, setLastTouchX] = useState(0) // Para manejo táctil
  const [loading, setLoading] = useState(true)
  const [isButtonEnabled, setIsButtonEnabled] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [loaderClass, setLoaderClass] = useState('loader2')

  const center = Vector3.Zero()

  useEffect(() => {
    const canvas = canvasRef.current
    const engine = new Engine(canvas, true)

    const scene = new Scene(engine)
    scene.clearColor = new Vector3(0, 0, 0)

    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4, // Alpha
      Math.PI / 4, // Beta
      100, // Radio
      center,
      scene
    );
    camera.attachControl(canvas, true); // Habilitar control táctil y del mouse

    const hemiLight = new HemisphericLight('hemiLight', new Vector3(1, 1, 0), scene);
    hemiLight.intensity = 1.5;

    const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000 }, scene)
    const skyboxMaterial = new StandardMaterial('skyBoxMaterial', scene)
    const hdrTexture = new HDRCubeTexture('/hdri/sky2.hdr', scene, 512)
    skyboxMaterial.reflectionTexture = hdrTexture
    skyboxMaterial.reflectionTexture.coordinatesMode = 5
    skyboxMaterial.backFaceCulling = false
    skyboxMaterial.disableLighting = true
    skybox.material = skyboxMaterial

    try {
      SceneLoader.Append(
        '',
        modelPath,
        scene,
        scene => {
          const meshes = scene.meshes
          meshes.forEach(mesh => {
            mesh.receiveShadows = true;
            mesh.actionManager = new ActionManager(scene);
            mesh.actionManager.registerAction(
              new ExecuteCodeAction(ActionManager.OnPickTrigger, ()=>{
                console.log(`Clicked on: ${mesh.name}`);
              })
            )

          })
          scene.executeWhenReady(() => {
            setStatusMessage('Modelo cargado')
            setIsButtonEnabled(true)
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

    // scene.detachControl()

    // updateCameraPosition()

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

    // Añadir eventos de mouse y touch
    canvas.addEventListener('mousedown', handlePointerDown)
    canvas.addEventListener('wheel', handleMouseWheel, { passive: false })
    // canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    // canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    // canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      engine.dispose()
      canvas.removeEventListener('mousedown', handlePointerDown)
      canvas.removeEventListener('wheel', handleMouseWheel)
      // canvas.removeEventListener('touchstart', handleTouchStart)
      // canvas.removeEventListener('touchmove', handleTouchMove)
      // canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [modelPath])

  useEffect(() => {
    const handleMouseMove = event => {
      if (isDragging) {
        const deltaX = event.clientX - lastMouseX
        const sensitivity = 0.003
        const rotationAmount = deltaX * sensitivity
        targetAngle.current += rotationAmount
        setLastMouseX(event.clientX)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isDragging, lastMouseX])

  const updateCameraPosition = () => {
    const newAngle = angleRef.current
    const newRadius = radiusRef.current
    const x = newRadius * Math.sin(newAngle)
    const z = newRadius * Math.cos(newAngle)
    // cameraRef.current.position = new Vector3(x, 30, z)
    // cameraRef.current.setTarget(center)
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

  // Control de arrastre para dispositivos de escritorio
  const handlePointerDown = e => {
    e.preventDefault()
    setIsDragging(true)
    setLastMouseX(e.clientX)

    document.addEventListener('mousemove', handlePointerMove)
    document.addEventListener('mouseup', handlePointerUp)
  }

  const handlePointerUp = e => {
    e.preventDefault()
    setIsDragging(false)

    document.removeEventListener('mousemove', handlePointerMove)
    document.removeEventListener('mouseup', handlePointerUp)
  }

  const handlePointerMove = e => {
    if (isDragging) {
      const deltaX = e.clientX - lastMouseX
      const sensitivity = 0.003
      const rotationAmount = deltaX * sensitivity
      targetAngle.current += rotationAmount
      setLastMouseX(e.clientX)
    }
  }

  // Control de zoom con la rueda del mouse
  const handleMouseWheel = e => {
    e.preventDefault()
    if (e.deltaY < 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }

  // Eventos táctiles para dispositivos móviles (drag y zoom)
  const handleTouchStart = e => {
    if (e.touches.length === 1) {
      // Control del arrastre con un dedo
      console.log('Touch start detected')
      e.preventDefault()
      setIsDragging(true)
      setLastTouchX(e.touches[0].clientX) // Guardamos la posición inicial del toque
    }
  }

  const handleTouchMove = e => {
    if (e.touches.length === 1 && isDragging) {
      // Arrastre con un dedo
      console.log('Touch move detected')
      e.preventDefault()
      const deltaX = e.touches[0].clientX - lastTouchX
      const sensitivity = 0.003
      const rotationAmount = deltaX * sensitivity
      targetAngle.current += rotationAmount
      setLastTouchX(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = e => {
    console.log('Touch end detected')
    setIsDragging(false)
  }

  const handleLoaderButtonClick = () => {
    setLoaderClass(prevClass => `${prevClass} fade-out`)

    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className='main-content'>
      {loading && (
        <div className={loaderClass}>
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
          width: '100vw',
          height: '100vh',
          display: 'block',
          touchAction: 'none' // Asegura que los gestos táctiles sean manejados correctamente
        }}
      />
      <div className='menubar2' style={{ display: loading ? 'none' : 'flex' }}>
        <AnimatedButton onMouseDown={rotateLeft}>
          <GlobalRotateIcon width='30px' height='30px' />
        </AnimatedButton>
        <AnimatedButton onMouseDown={rotateRight}>
          <GlobalRotateIcon
            width='30px'
            height='30px'
            style={{ transform: 'scaleX(-1)' }}
          />
        </AnimatedButton>
        <AnimatedButton onMouseDown={zoomOut}>
          <ZoomOutIcon width='30px' height='30px' />
        </AnimatedButton>
        <AnimatedButton onMouseDown={zoomIn}>
          <ZoomInIcon width='30px' height='30px' />
        </AnimatedButton>
      </div>
    </div>
  )
}

export default BabylonScene
