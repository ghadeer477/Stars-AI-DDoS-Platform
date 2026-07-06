import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Shield, Upload, Activity, Server, AlertTriangle, FileText, Menu, X, Download, Zap, Cloud, Bug, Lock, UserPlus } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState('')

  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [cloudData, setCloudData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [attackType, setAttackType] = useState('DNS') // جديد
  const reportRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setIsLoggedIn(true)
      setUser(savedUser)
    }
  }, [])

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress(prev => prev >= 98? 98 : prev + Math.random() * 6)
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(0)
    }
  }, [loading])

  const glass = {
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s ease'
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    const endpoint = isRegister? '/register' : '/login'
    try {
      const res = await fetch('/api' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        if (!isRegister) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', data.user)
          setIsLoggedIn(true)
          setUser(data.user)
        } else {
          alert('تم إنشاء الحساب! سجل دخول الحين')
          setIsRegister(false)
          setPassword('')
        }
      } else {
        alert(data.message)
      }
    } catch (err) {
      alert('فشل الاتصال بالسيرفر - تأكد الباك اند شغال على port 5000')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setUser('')
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    setCloudData(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('attack_type', attackType) // جديد
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      setProgress(100)

      if (data.success) {
        data.alerts = [
          { id: '001', time: '2026-05-01 19:45:23', rule: 'DDoS Attack Detected', level: 15, src: '192.168.1.105', agent: 'Agent-01', mitre: 'T1498' },
          { id: '002', time: '2026-05-01 19:45:20', rule: 'UDP Flood Attack', level: 12, src: '10.0.0.89', agent: 'Agent-02', mitre: 'T1498.001' },
          { id: '003', time: '2026-05-01 19:45:18', rule: 'SYN Flood', level: 14, src: '172.16.5.12', agent: 'Agent-01', mitre: 'T1498.002' },
        ]
        data.agents = [
          { name: 'Agent-01', ip: '192.168.1.10', status: 'active', alerts: 4523, version: '4.7.2', uptime: '99.9%' },
          { name: 'Agent-02', ip: '192.168.1.11', status: 'active', alerts: 3821, version: '4.7.2', uptime: '99.8%' },
        ]
        data.timeline = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          attacks: Math.floor(Math.random() * 80),
          normal: Math.floor(Math.random() * 400)
        }))
      }
      setTimeout(() => setResult(data), 800)
    } catch (err) {
      setResult({ success: false, error: 'فشل الاتصال بالسيرفر' })
    }
    setLoading(false)
  }

  // جديد: التحليل المباشر
  const handleLiveAnalysis = async () => {
    setLoading(true)
    setResult(null)
    setCloudData(null)
    const token = localStorage.getItem('token')

    try {
      const res = await fetch('/api/predict-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attack_type: attackType })
      })
      const data = await res.json()
      setProgress(100)

      if (data.success) {
        data.alerts = [
          { id: '001', time: new Date().toISOString(), rule: 'DDoS Attack Detected', level: 15, src: 'Live-Monitor', agent: 'Agent-01', mitre: 'T1498' }
        ]
        data.agents = [
          { name: 'Agent-01', ip: '192.168.1.10', status: 'active', alerts: 4523, version: '4.7.2', uptime: '99.9%' }
        ]
        data.timeline = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          attacks: Math.floor(Math.random() * 80),
          normal: Math.floor(Math.random() * 400)
        }))
      }
      setTimeout(() => setResult(data), 800)
    } catch (err) {
      setResult({ success: false, error: 'فشل الاتصال بالسيرفر' })
    }
    setLoading(false)
  }

  const exportPDF = async () => {
    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#0f172a' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`Sentinel-Report-${Date.now()}.pdf`)
  }

  const getLevelColor = (level) => {
    if (level >= 15) return '#ef4444'
    if (level >= 12) return '#f97316'
    if (level >= 7) return '#eab308'
    return '#22c55e'
  }

  const getRiskColor = (risk) => {
    if (risk === 'critical') return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444', border: '#ef4444' }
    if (risk === 'high') return { bg: 'rgba(249,115,22,0.2)', text: '#f97316', border: '#f97316' }
    return { bg: 'rgba(234,179,8,0.2)', text: '#eab308', border: '#eab308' }
  }

  const pieData = result?.success? [
    { name: 'Attacks', value: result.attack_count, color: '#ef4444' },
    { name: 'Benign', value: result.benign_count, color: '#22c55e' }
  ] : []

  const menu = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'cloud', icon: Cloud, label: 'Cloud Security', badge: cloudData?.findings },
    { id: 'vulns', icon: Bug, label: 'Vulnerabilities' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: result?.alerts?.length },
    { id: 'agents', icon: Server, label: 'Agents' },
    { id: 'compliance', icon: FileText, label: 'Compliance' },
  ]

  const sidebarItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'network', icon: Cloud, label: 'Network' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: result?.alerts?.length },
    { id: 'agents', icon: Server, label: 'Agents' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ]

  const statCards = [
    {
      title: 'Total Threats',
      value: result?.success ? result.attack_count : '1,289',
      change: '+12.4%',
      note: 'Compared to last week',
      icon: AlertTriangle,
      color: '#7A00FF'
    },
    {
      title: 'Defended',
      value: result?.success ? Math.max((result.total_flows || 0) - (result.attack_count || 0), 0) : '8,602',
      change: '+8.1%',
      note: 'Compared to last week',
      icon: Shield,
      color: '#20D9FF'
    },
    {
      title: 'Failed',
      value: result?.success ? result.attack_count : '307',
      change: '-3.2%',
      note: 'Compared to last week',
      icon: Bug,
      color: '#EF4444'
    },
    {
      title: 'Total Users',
      value: '4,829',
      change: '+6.8%',
      note: 'Compared to last week',
      icon: UserPlus,
      color: '#10B981'
    }
  ]

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 20%, rgba(122,0,255,0.28), transparent 32%), radial-gradient(circle at 80% 70%, rgba(32,217,255,0.18), transparent 28%), linear-gradient(135deg, #7f93aa 0%, #95a6ba 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#09090b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '30px',
          padding: '42px',
          boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top right, rgba(79,70,255,0.23), transparent 34%)',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              width: '82px',
              height: '82px',
              margin: '0 auto 22px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #4F46FF, #20D9FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 50px rgba(79,70,255,0.45)'
            }}>
              <Lock size={40} />
            </div>

            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.04em' }}>
              Stars
            </h1>
            <p style={{ margin: '10px 0 30px', color: '#8E8E99', fontSize: '14px' }}>
              AI-Powered DDoS Detection Platform
            </p>

            <form onSubmit={handleAuth}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  marginBottom: '14px',
                  background: '#151518',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '15px 16px',
                  marginBottom: '20px',
                  background: '#151518',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />

              <button type="submit" style={{
                width: '100%',
                border: 'none',
                borderRadius: '16px',
                padding: '16px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #4F46FF, #20D9FF)',
                boxShadow: '0 18px 40px rgba(79,70,255,0.28)'
              }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => { setIsRegister(!isRegister); setPassword('') }}
              style={{
                marginTop: '18px',
                background: 'transparent',
                border: 'none',
                color: '#20D9FF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700
              }}
            >
              {isRegister ? 'Already have account? Login' : "Don't have account? Register"}
            </button>

            {!isRegister && (
              <p style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
                Demo: admin / admin123
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8ea0b6 0%, #a7b5c8 100%)',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '26px'
    }}>
      <div style={{
        maxWidth: '1440px',
        minHeight: 'calc(100vh - 52px)',
        margin: '0 auto',
        background: '#050505',
        borderRadius: '34px',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: sidebarOpen ? '230px 1fr' : '92px 1fr',
        boxShadow: '0 35px 110px rgba(0,0,0,0.45)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <aside style={{
          background: '#0b0b0d',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '22px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: sidebarOpen ? '8px 10px 18px' : '8px 0 18px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #4F46FF, #20D9FF)',
              boxShadow: '0 14px 35px rgba(79,70,255,0.35)'
            }}>
              <Shield size={25} />
            </div>
            {sidebarOpen && (
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>Stars</h2>
                <p style={{ margin: '3px 0 0', color: '#8E8E99', fontSize: '12px' }}>Security Platform</p>
              </div>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {sidebarItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: isActive ? 'linear-gradient(135deg, rgba(79,70,255,0.95), rgba(32,217,255,0.45))' : 'transparent',
                    color: isActive ? '#ffffff' : '#8E8E99',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    padding: sidebarOpen ? '0 14px' : '0',
                    transition: 'all 0.25s ease',
                    boxShadow: isActive ? '0 14px 32px rgba(79,70,255,0.22)' : 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={20} />
                    {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: 700 }}>{item.label}</span>}
                  </span>
                  {sidebarOpen && item.badge && (
                    <span style={{
                      minWidth: '22px',
                      height: '22px',
                      borderRadius: '999px',
                      background: 'rgba(239,68,68,0.18)',
                      color: '#EF4444',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(239,68,68,0.35)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '100%',
              minHeight: '46px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#151518',
              color: '#8E8E99',
              borderRadius: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div style={{
            padding: sidebarOpen ? '12px' : '8px 0',
            borderRadius: '18px',
            background: '#151518',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center'
          }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7A00FF, #20D9FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900
            }}>
              {(user || 'A').charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>{user || 'admin'}</p>
                <p style={{ margin: 0, color: '#8E8E99', fontSize: '11px' }}>Administrator</p>
              </div>
            )}
          </div>
        </aside>

        <main style={{ padding: '26px', overflow: 'auto' }}>
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '18px',
            marginBottom: '26px'
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '34px',
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: '-0.05em'
              }}>
                Dashboard
              </h1>
              <p style={{ margin: '9px 0 0', color: '#8E8E99', fontSize: '14px' }}>
                Analyze network traffic and detect suspicious DDoS activity
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button style={{
                background: '#151518',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontWeight: 800,
                cursor: 'pointer'
              }}>
                This week
              </button>

              <button
                onClick={result?.success ? exportPDF : undefined}
                disabled={!result?.success}
                style={{
                  background: result?.success ? 'linear-gradient(135deg, #4F46FF, #20D9FF)' : '#151518',
                  color: result?.success ? '#fff' : '#6b7280',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontWeight: 800,
                  cursor: result?.success ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Download size={17} /> Download Report
              </button>

              <button onClick={handleLogout} style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#EF4444',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: '14px',
                padding: '12px 16px',
                fontWeight: 800,
                cursor: 'pointer'
              }}>
                Logout
              </button>
            </div>
          </header>

          <div ref={reportRef}>
            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
              marginBottom: '18px'
            }}>
              {statCards.map((card, index) => {
                const Icon = card.icon
                return (
                  <div key={card.title} style={{
                    background: '#151518',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    padding: '20px',
                    minHeight: '148px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-30px',
                      bottom: '-34px',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${card.color}33, transparent 68%)`
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                      <div>
                        <p style={{ margin: 0, color: '#8E8E99', fontSize: '13px', fontWeight: 700 }}>{card.title}</p>
                        <h2 style={{ margin: '14px 0 0', fontSize: '30px', fontWeight: 950 }}>{card.value}</h2>
                      </div>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${card.color}1f`,
                        color: card.color
                      }}>
                        <Icon size={21} />
                      </div>
                    </div>

                    <div style={{
                      marginTop: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '999px',
                        background: `${card.color}1f`,
                        color: card.color,
                        fontSize: '12px',
                        fontWeight: 900
                      }}>
                        {card.change}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>{card.note}</span>
                    </div>

                    <div style={{
                      marginTop: '16px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '4px',
                      opacity: 0.9
                    }}>
                      {[36, 18, 28, 44, 24, 54, 32, 48, 62, 42].map((h, i) => (
                        <span key={i} style={{
                          width: '9%',
                          height: `${h}%`,
                          borderRadius: '999px',
                          background: i === index + 4 ? card.color : 'rgba(255,255,255,0.12)'
                        }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </section>

            <section style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(360px, 1.35fr)',
              gap: '18px',
              marginBottom: '18px'
            }} className="sentinel-main-grid">
              <div style={{
                background: '#151518',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '26px',
                padding: '24px',
                minHeight: '350px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Security Model Integrity</h3>
                <p style={{ margin: '8px 0 24px', color: '#8E8E99', fontSize: '13px' }}>
                  Ensures accuracy and reliability of security measures.
                </p>

                <div style={{
                  height: '185px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    width: '210px',
                    height: '210px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 220deg, #7A00FF 0deg, #20D9FF 140deg, #10B981 220deg, rgba(255,255,255,0.08) 221deg 360deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: '#151518',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <strong style={{ fontSize: '34px', lineHeight: 1 }}>7869</strong>
                      <span style={{ color: '#8E8E99', fontSize: '12px', marginTop: '8px' }}>Integrity Score</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginTop: '18px'
                }}>
                  {[
                    ['Critical', '2573', '#EF4444'],
                    ['Suspicious', '2117', '#7A00FF'],
                    ['Stable', '3179', '#10B981']
                  ].map(([label, value, color]) => (
                    <div key={label} style={{
                      background: '#0b0b0d',
                      borderRadius: '16px',
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: color, marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#8E8E99', fontSize: '11px' }}>{label}</p>
                      <strong style={{ fontSize: '15px' }}>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#151518',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '26px',
                padding: '24px',
                minHeight: '350px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'flex-start',
                  marginBottom: '18px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Predictive Model Deployment</h3>
                    <p style={{ margin: '8px 0 0', color: '#8E8E99', fontSize: '13px' }}>In last 24 hours</p>
                  </div>
                  {result?.success && (
                    <span style={{
                      padding: '7px 10px',
                      borderRadius: '999px',
                      color: result.prediction === 'ATTACK' ? '#EF4444' : '#10B981',
                      background: result.prediction === 'ATTACK' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                      border: result.prediction === 'ATTACK' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
                      fontSize: '12px',
                      fontWeight: 900
                    }}>
                      {result.prediction}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  {['All', 'At Risk', 'Breached', 'Idle', 'New Detections'].map((tab, i) => (
                    <span key={tab} style={{
                      padding: '8px 11px',
                      borderRadius: '999px',
                      background: i === 0 ? 'rgba(79,70,255,0.25)' : '#0b0b0d',
                      color: i === 0 ? '#fff' : '#8E8E99',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      {tab}
                    </span>
                  ))}
                </div>

                <div style={{
                  height: '220px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '195px',
                    height: '195px',
                    borderRadius: '50%',
                    border: '22px solid rgba(79,70,255,0.55)',
                    boxShadow: '0 0 60px rgba(79,70,255,0.26)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '132px',
                    height: '132px',
                    borderRadius: '50%',
                    border: '18px solid rgba(32,217,255,0.65)'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7A00FF, #20D9FF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 950,
                    boxShadow: '0 20px 45px rgba(32,217,255,0.22)'
                  }}>
                    AI
                  </div>

                  {[
                    ['DNS', '14%', '#20D9FF', '18%', '32%'],
                    ['SYN', '24%', '#7A00FF', '72%', '34%'],
                    ['UDP', '18%', '#10B981', '60%', '76%'],
                    ['NTP', '11%', '#EF4444', '23%', '75%']
                  ].map(([name, percent, color, left, top]) => (
                    <div key={name} style={{
                      position: 'absolute',
                      left,
                      top,
                      transform: 'translate(-50%, -50%)',
                      background: '#0b0b0d',
                      border: `1px solid ${color}55`,
                      color,
                      borderRadius: '15px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 900,
                      boxShadow: `0 12px 28px ${color}22`
                    }}>
                      {name} {percent}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(360px, 1.05fr) minmax(320px, 0.95fr)',
              gap: '18px'
            }} className="sentinel-bottom-grid">
              <div style={{
                background: '#151518',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '26px',
                padding: '24px'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Top Threats</h3>
                <p style={{ margin: '8px 0 18px', color: '#8E8E99', fontSize: '13px' }}>
                  Recent threat intelligence summary
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                    <thead>
                      <tr>
                        {['Detection', 'Threat Level', 'Source IP'].map(head => (
                          <th key={head} style={{
                            textAlign: 'left',
                            color: '#8E8E99',
                            fontSize: '12px',
                            padding: '12px 10px',
                            borderBottom: '1px solid rgba(255,255,255,0.07)'
                          }}>
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Sequential Breach', 'High', '192.168.1.44', '#EF4444', '86%'],
                        ['Global Disruption', 'Medium', '10.0.0.82', '#7A00FF', '62%'],
                        ['Analytical Deduction', 'Low', '172.16.4.11', '#20D9FF', '38%']
                      ].map(([detection, level, ip, color, width]) => (
                        <tr key={detection}>
                          <td style={{ padding: '14px 10px', fontWeight: 800, fontSize: '13px' }}>{detection}</td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{
                              height: '8px',
                              background: 'rgba(255,255,255,0.08)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                              width: '125px'
                            }}>
                              <div style={{ width, height: '100%', background: color, borderRadius: '999px' }} />
                            </div>
                            <span style={{ color, fontSize: '11px', fontWeight: 900 }}>{level}</span>
                          </td>
                          <td style={{ padding: '14px 10px', color: '#8E8E99', fontSize: '13px' }}>{ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{
                background: '#151518',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '26px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>AI DDoS Analysis</h3>
                    <p style={{ margin: '8px 0 0', color: '#8E8E99', fontSize: '13px' }}>
                      Upload CSV or run live detection
                    </p>
                  </div>
                  <Zap size={22} color="#20D9FF" />
                </div>

                <form onSubmit={handleSubmit}>
                  <select
                    value={attackType}
                    onChange={e => setAttackType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      marginBottom: '14px',
                      background: '#0b0b0d',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '15px',
                      color: '#fff',
                      outline: 'none',
                      fontWeight: 800
                    }}
                  >
                    <option value="DNS">DNS Flood</option>
                    <option value="LDAP">LDAP Flood</option>
                    <option value="NTP">NTP Flood</option>
                    <option value="NetBIOS">NetBIOS</option>
                    <option value="Syn">SYN Flood</option>
                    <option value="UDPLag">UDP Lag</option>
                  <option value="SNMP">SNMP Flood</option>
                  <option value="SSDP">SSDP Flood</option>
                  <option value="TFTP">TFTP Flood</option>
                  <option value="Portmap">Portmap Flood</option>
                  </select>

                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => setFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      border: `2px dashed ${file ? '#10B981' : 'rgba(255,255,255,0.14)'}`,
                      background: file ? 'rgba(16,185,129,0.08)' : '#0b0b0d',
                      borderRadius: '22px',
                      padding: '30px 18px',
                      textAlign: 'center',
                      transition: '0.25s ease'
                    }}>
                      <Upload size={38} color={file ? '#10B981' : '#20D9FF'} />
                      <p style={{ margin: '12px 0 4px', fontSize: '15px', fontWeight: 900 }}>
                        {file ? file.name : 'Drop CSV file here'}
                      </p>
                      <p style={{ margin: 0, color: '#8E8E99', fontSize: '12px' }}>
                        Upload network traffic data for AI-based DDoS analysis
                      </p>
                    </div>
                  </label>

                  {loading && (
                    <div style={{ marginTop: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#8E8E99' }}>AI Analysis in progress...</span>
                        <strong style={{ color: '#20D9FF' }}>{Math.round(progress)}%</strong>
                      </div>
                      <div style={{ height: '8px', borderRadius: '999px', background: '#0b0b0d', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          borderRadius: '999px',
                          background: 'linear-gradient(90deg, #4F46FF, #20D9FF)'
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginTop: '18px'
                  }}>
                    <button type="submit" disabled={loading || !file} style={{
                      background: loading || !file ? '#0b0b0d' : 'linear-gradient(135deg, #4F46FF, #20D9FF)',
                      color: loading || !file ? '#6b7280' : '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '15px 12px',
                      borderRadius: '16px',
                      cursor: loading || !file ? 'not-allowed' : 'pointer',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <Upload size={18} /> تحليل الملف
                    </button>

                    <button type="button" onClick={handleLiveAnalysis} disabled={loading} style={{
                      background: loading ? '#0b0b0d' : 'linear-gradient(135deg, #10B981, #20D9FF)',
                      color: loading ? '#6b7280' : '#fff',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '15px 12px',
                      borderRadius: '16px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <Activity size={18} /> تحليل مباشر
                    </button>
                  </div>
                </form>

                {result?.success && (
                  <div style={{
                    marginTop: '18px',
                    background: '#0b0b0d',
                    border: result.prediction === 'ATTACK' ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(16,185,129,0.35)',
                    borderRadius: '20px',
                    padding: '18px'
                  }}>
                    <p style={{ margin: 0, color: '#8E8E99', fontSize: '12px', fontWeight: 800 }}>Latest Result</p>
                    <h2 style={{
                      margin: '8px 0 6px',
                      color: result.prediction === 'ATTACK' ? '#EF4444' : '#10B981',
                      fontSize: '28px',
                      fontWeight: 950
                    }}>
                      {result.prediction}
                    </h2>
                    <p style={{ margin: 0, color: '#8E8E99', fontSize: '12px' }}>
                      Model: {result.model} | Confidence: {result.confidence}% | CPU: {result.cpu_used}% | RAM: {result.ram_used}%
                    </p>
                  </div>
                )}

                {result?.success === false && (
                  <div style={{
                    marginTop: '18px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: '18px',
                    padding: '16px',
                    color: '#EF4444',
                    fontWeight: 800
                  }}>
                    Analysis Failed: {result.error}
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        button:hover { transform: translateY(-1px); filter: brightness(1.08); }
        input::placeholder { color: #6b7280; }
        select option { background: #0b0b0d; color: white; }

        @media (max-width: 1100px) {
          .sentinel-main-grid,
          .sentinel-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          body { overflow-x: hidden; }
          main { padding: 18px !important; }
        }
      `}</style>
    </div>
  )
}
