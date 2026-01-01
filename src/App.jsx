import { useState, useEffect } from 'react'
import Constellation from './Constellation'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load constellation data
    fetch('/data.json')
      .then(res => {
        if (!res.ok) throw new Error('No constellation data found. Run "npm run fetch" and "npm run analyze" first.')
        return res.json()
      })
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={styles.message}>
        <h1 style={styles.title}>Loading Constellation...</h1>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.message}>
        <h1 style={styles.title}>Constellation</h1>
        <p style={styles.error}>{error}</p>
        <div style={styles.instructions}>
          <p>To generate your constellation:</p>
          <ol style={styles.list}>
            <li><code>npm run fetch</code> - Pull notes from Apple Notes</li>
            <li><code>npm run analyze</code> - Find connections</li>
            <li><code>npm run dev</code> - View constellation</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Constellation</h1>
        <div style={styles.stats}>
          <span>{data.stars.length} stars</span>
          <span style={styles.separator}>•</span>
          <span>{data.connections.length} connections</span>
        </div>
      </div>
      <Constellation data={data} />
    </>
  )
}

const styles = {
  message: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '2rem',
    textAlign: 'center'
  },
  title: {
    fontSize: '3rem',
    fontWeight: '300',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #fbbf24 0%, #22d3ee 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  error: {
    color: '#ff6b6b',
    fontSize: '1.1rem',
    marginBottom: '2rem'
  },
  instructions: {
    textAlign: 'left',
    background: 'rgba(255,255,255,0.05)',
    padding: '1.5rem',
    borderRadius: '8px',
    maxWidth: '500px'
  },
  list: {
    marginTop: '1rem',
    paddingLeft: '1.5rem',
    lineHeight: '2'
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '300',
    margin: 0
  },
  stats: {
    fontSize: '0.9rem',
    color: '#888'
  },
  separator: {
    margin: '0 0.5rem'
  }
}

export default App
