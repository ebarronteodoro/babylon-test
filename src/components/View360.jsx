import React, { useEffect, useRef } from 'react'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { HDRCubeTexture } from '@babylonjs/core/Materials/Textures/hdrCubeTexture'
import '@babylonjs/core/Loading/loadingScreen'

function View360 ({ sceneTexture }) {
  console.log(sceneTexture)

  const containerRef = useRef(null)

  useEffect(() => {
    let engine, scene, camera, sphere, animationId

    const init = () => {
      if (!sceneTexture) {
        console.error('La URL de la textura HDR no está definida.')
        return
      }

      // Crear el motor de Babylon
      const canvas = containerRef.current
      engine = new Engine(canvas, true)

      // Crear la escena
      scene = new Scene(engine)

      // Crear la cámara
      camera = new UniversalCamera('camera', new Vector3(0, -10, 5), scene)
      camera.setTarget(Vector3.Zero())

      // Crear una luz hemisférica
      const hemiLight = new HemisphericLight(
        'hemiLight',
        new Vector3(1, 1, 0),
        scene
      )
      hemiLight.intensity = 0.6

      // Crear una esfera y aplicarle una textura HDR 360°
      const hdrTexture = new HDRCubeTexture(sceneTexture, scene, 512)
      const sphereMaterial = new StandardMaterial('sphereMat', scene)
      sphereMaterial.reflectionTexture = hdrTexture // Usar la textura HDR

      // Crear la geometría de la esfera, invertida para la vista interna
      sphere = MeshBuilder.CreateSphere(
        'sphere',
        { segments: 32, diameter: 600 },
        scene
      )
      sphere.material = sphereMaterial
      sphere.scaling = new Vector3(-1, 1, 1) // Invertir la esfera

      // Hacer que la cámara gire lentamente alrededor del eje Y
      const animate = () => {
        animationId = engine.runRenderLoop(() => {
          camera.rotation.y += 0.0005
          scene.render()
        })
      }

      animate()

      // Ajustar la vista cuando la ventana cambia de tamaño
      window.addEventListener('resize', handleResize)
    }

    // Manejar el redimensionado de la ventana
    const handleResize = () => {
      if (engine) {
        engine.resize()
      }
    }

    // Inicializar la escena
    init()

    return () => {
      // Limpiar cuando el componente se desmonte
      window.removeEventListener('resize', handleResize)
      if (animationId) {
        engine.stopRenderLoop()
      }
      if (engine) {
        engine.dispose()
      }
    }
  }, [sceneTexture])

  return (
    <canvas
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh'
      }}
    />
  )
}

export default View360
