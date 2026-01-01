import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars as BackgroundStars, Line } from '@react-three/drei'
import { useState, useRef, useMemo } from 'react'
import * as THREE from 'three'

function Star({ position, color, content, themes, onClick, isHovered, onHover }) {
  const meshRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (meshRef.current && isHovered) {
      // Gentle pulsing animation when hovered
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.02 + 0.15
      meshRef.current.scale.setScalar(1 + pulse)
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'auto'
          onHover(false)
        }}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 2.5 : 1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Glow ring when hovered */}
      {isHovered && (
        <>
          <mesh ref={glowRef}>
            <ringGeometry args={[0.15, 0.18, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight color={color} intensity={3} distance={4} />
        </>
      )}
    </group>
  )
}

function AnimatedConnection({ from, to, fromColor, toColor, strength, reason, isHovered, onHover }) {
  const lineRef = useRef()

  // Determine line color based on whether it's connecting same or different clusters
  const lineColor = useMemo(() => {
    if (fromColor === toColor) {
      return fromColor // Same cluster = cluster color
    } else {
      return '#ffffff' // Cross-cluster = white
    }
  }, [fromColor, toColor])

  const points = useMemo(() => {
    return [from, to]
  }, [from, to])

  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(true)
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        onHover(false)
      }}
    >
      <Line
        ref={lineRef}
        points={points}
        color={lineColor}
        lineWidth={isHovered ? 3 : 1.5}
        opacity={isHovered ? 0.9 : strength * 0.4}
        transparent
        dashed={fromColor !== toColor} // Dashed if cross-cluster
        dashScale={50}
        dashSize={0.1}
        gapSize={0.05}
      />
    </group>
  )
}

function Constellation({ data }) {
  const [hoveredStar, setHoveredStar] = useState(null)
  const [selectedStar, setSelectedStar] = useState(null)
  const [hoveredConnection, setHoveredConnection] = useState(null)

  const handleStarClick = (star) => {
    setSelectedStar(star)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: '#000' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        {/* Background stars */}
        <BackgroundStars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        {/* Connections (render first so stars appear on top) */}
        {data.connections.map((conn, i) => (
          <AnimatedConnection
            key={i}
            from={[
              data.stars[conn.from].position.x,
              data.stars[conn.from].position.y,
              data.stars[conn.from].position.z
            ]}
            to={[
              data.stars[conn.to].position.x,
              data.stars[conn.to].position.y,
              data.stars[conn.to].position.z
            ]}
            fromColor={data.stars[conn.from].color}
            toColor={data.stars[conn.to].color}
            strength={conn.strength}
            reason={conn.reason}
            isHovered={hoveredConnection === i}
            onHover={(isHovered) => {
              setHoveredConnection(isHovered ? i : null)
            }}
          />
        ))}

        {/* Constellation stars */}
        {data.stars.map((star) => (
          <Star
            key={star.id}
            position={[star.position.x, star.position.y, star.position.z]}
            color={star.color}
            content={star.content}
            themes={star.themes}
            onClick={() => handleStarClick(star)}
            isHovered={hoveredStar === star.id}
            onHover={(isHovered) => {
              setHoveredStar(isHovered ? star.id : null)
            }}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>

      {/* Info panel for selected star */}
      {selectedStar && (
        <div style={styles.panel}>
          <button
            onClick={() => setSelectedStar(null)}
            style={styles.closeButton}
          >
            ×
          </button>
          <div style={styles.panelContent}>
            <div
              style={{
                ...styles.colorDot,
                background: selectedStar.color,
                boxShadow: `0 0 20px ${selectedStar.color}`
              }}
            />
            <p style={styles.content}>{selectedStar.content}</p>
            {selectedStar.themes && selectedStar.themes.length > 0 && (
              <div style={styles.themes}>
                {selectedStar.themes.map((theme, i) => (
                  <span key={i} style={styles.theme}>
                    {theme}
                  </span>
                ))}
              </div>
            )}
            <div style={styles.source}>
              {selectedStar.source === 'apple-notes' ? '📝 Apple Notes' : '💬 Claude'}
            </div>
          </div>
        </div>
      )}

      {/* Connection info tooltip */}
      {hoveredConnection !== null && (
        <div style={styles.connectionTooltip}>
          <div style={styles.connectionTitle}>Connection</div>
          <div style={styles.connectionReason}>
            {data.connections[hoveredConnection].reason}
          </div>
          <div style={styles.connectionStrength}>
            Strength: {Math.round(data.connections[hoveredConnection].strength * 100)}%
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.instructions}>
        <p>Click and drag to rotate • Scroll to zoom • Hover over lines to see connections • Click stars to explore</p>
      </div>

      {/* Legend hint */}
      <div style={styles.legendHint}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendLine, background: '#fbbf24'}}></div>
          <span>Same cluster</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendLine, background: '#fff', backgroundImage: 'repeating-linear-gradient(90deg, #fff 0, #fff 5px, transparent 5px, transparent 10px)'}}></div>
          <span>Cross-cluster</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '350px',
    maxHeight: '400px',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    color: '#fff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    overflowY: 'auto'
  },
  closeButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '2rem',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  panelContent: {
    marginTop: '0.5rem'
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginBottom: '0.75rem',
    boxShadow: '0 0 12px currentColor'
  },
  content: {
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  themes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  theme: {
    padding: '0.25rem 0.75rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    fontSize: '0.85rem',
    color: '#fff'
  },
  source: {
    fontSize: '0.85rem',
    color: '#888',
    marginTop: '0.5rem'
  },
  instructions: {
    position: 'fixed',
    bottom: '2rem',
    left: '2rem',
    color: '#666',
    fontSize: '0.85rem',
    maxWidth: '400px'
  },
  connectionTooltip: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '1.5rem',
    color: '#fff',
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
    animation: 'fadeIn 0.2s ease-in'
  },
  connectionTitle: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#888',
    marginBottom: '0.5rem'
  },
  connectionReason: {
    fontSize: '1.1rem',
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  connectionStrength: {
    fontSize: '0.85rem',
    color: '#fbbf24',
    fontWeight: '500'
  },
  legendHint: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.75rem',
    color: '#888'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  legendLine: {
    width: '30px',
    height: '2px',
    borderRadius: '1px'
  }
}

export default Constellation
