import React, { useState, useEffect } from 'react'

function LoadingDragon() {
  const [currentLogo, setCurrentLogo] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogo(prev => prev === 1 ? 2 : 1)
    }, 500) // Switch every 500ms

    return () => clearInterval(interval)
  }, [])

  // Fallback dragon SVG if images don't exist
  const dragonSvg1 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMzAiIGZpbGw9IiM5NDk5NEYiLz4KPHRleHQgeD0iNDAiIHk9IjQ1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+8J+QiTwvdGV4dD4KPC9zdmc+'
  const dragonSvg2 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMzAiIGZpbGw9IiNGMkI0NDEiLz4KPHRleHQgeD0iNDAiIHk9IjQ1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyNCI+8J+QiTwvdGV4dD4KPC9zdmc+'

  return (
    <div className="loading-dragon">
      <img 
        src={`/logo${currentLogo}.png`}
        alt="Loading Dragon"
        className="dragon-moving"
        style={{ width: '100px', height: '100px' }}
        onError={(e) => {
          // If lgoo files don't work, try standard logo naming
          if (e.target.src.includes('lgoo')) {
            e.target.src = `/logo${currentLogo}.png`
          } else {
            // Fallback to SVG dragons
            e.target.src = currentLogo === 1 ? dragonSvg1 : dragonSvg2
          }
        }}
      />
      <div className="loading-text">
        <span style={{ color: '#94994F' }}>Ko</span>
        <span style={{ color: '#F2E394' }}>Zna</span>
        <span style={{ color: '#F2B441' }}>Zna</span>
        <span style={{ color: 'rgba(228, 230, 234, 0.8)', marginLeft: '8px' }}>loading...</span>
      </div>
    </div>
  )
}

export default LoadingDragon