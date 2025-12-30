import React from 'react'

export default function HomePage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>
          Welcome to finEdSkywalker 🚀
        </h1>
        <p style={styles.subtitle}>
          Your comprehensive stock analysis platform
        </p>
        <div style={styles.card}>
          <h2>Hello World! 👋</h2>
          <p>The frontend is now live and ready for development.</p>
        </div>
        <div style={styles.info}>
          <p>
            <strong>Backend API:</strong>{' '}
            <code style={styles.code}>
              {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
            </code>
          </p>
          <p style={styles.note}>
            <small>CSR Mode • Next.js 15 • Client-side rendered</small>
          </p>
        </div>
      </div>
    </main>
  )
}

const styles = {
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  container: {
    maxWidth: '800px',
    textAlign: 'center' as const,
    color: '#ffffff',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    color: '#333',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
  },
  info: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
  },
  code: {
    background: 'rgba(0,0,0,0.2)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.9rem',
  },
  note: {
    marginTop: '1rem',
    opacity: 0.8,
  },
}

