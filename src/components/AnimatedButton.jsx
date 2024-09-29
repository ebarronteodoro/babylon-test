import React, { useState } from 'react'
import './AnimatedButton.css'

const AnimatedButton = ({
  onMouseDown,
  children,
  className = '',
  ...props
}) => {
  const [isClicked, setIsClicked] = useState(false)

  const handleMouseDown = event => {
    setIsClicked(true)

    if (onMouseDown) {
      onMouseDown(event)
    }

    setTimeout(() => {
      setIsClicked(false)
    }, 50)
  }

  return (
    <button
      onMouseDown={handleMouseDown}
      className={`animatedbutton ${className} ${isClicked ? 'clicked' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default AnimatedButton
