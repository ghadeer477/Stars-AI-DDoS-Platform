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
      const res = await fetch('http://16.16.65.222:5000' + endpoint, {
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
      const res = await fetch('http://16.16.65.222:5000/predict', {
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
      const res = await fetch('http://16.16.65.222:5000/predict-live', {
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

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f1f5f9',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{...glass, padding: '50px', width: '420px', textAlign: 'center'}}>
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={40} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '800' }}>Sentinel AI</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 32px 0' }}>
            {isRegister? 'Create new account' : 'Sign in to your account'}
          </p>

          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '14px', marginBottom: '16px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#f1f5f9', fontSize: '15px', outline: 'none'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '14px', marginBottom: '24px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#f1f5f9', fontSize: '15px', outline: 'none'
              }}
            />
            <button type="submit" style={{
              width: '100%', padding: '16px', marginBottom: '16px',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              border: 'none', borderRadius: '12px', color: '#0f172a',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer'
            }}>
              {isRegister? <><UserPlus size={18} /> Create Account</> : 'Sign In'}
            </button>
          </form>

          <button onClick={() => {setIsRegister(!isRegister); setPassword('')}} style={{
            background: 'transparent', border: 'none', color: '#38bdf8',
            cursor: 'pointer', fontSize: '14px'
          }}>
            {isRegister? 'Already have account? Login' : "Don't have account? Register"}
          </button>

          {!isRegister && (
            <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
              Demo: admin / admin123
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f1f5f9',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: sidebarOpen? '270px' : '80px',
       ...glass,
        borderRadius: 0,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        transition: 'width 0.3s',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(56, 189, 248, 0.4)'
          }}>
            <Lock size={24} />
          </div>
          {sidebarOpen && (
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', background: 'linear-gradient(90deg, #38bdf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sentinel AI</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Welcome, {user}</p>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
          {menu.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '6px',
              border: 'none',
              background: activeTab === item.id? 'linear-gradient(90deg, rgba(56, 189, 248, 0.2), rgba(168, 85, 247, 0.15))' : 'transparent',
              color: activeTab === item.id? '#38bdf8' : '#94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <item.icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </div>
              {sidebarOpen && item.badge && (
                <div style={{
                  padding: '2px 8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>{item.badge}</div>
              )}
            </button>
          ))}
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          padding: '16px',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'transparent',
          color: '#94a3b8',
          cursor: 'pointer'
        }}>{sidebarOpen? <X size={20} /> : <Menu size={20} />}</button>
      </div>

      <div style={{ marginLeft: sidebarOpen? '270px' : '80px', flex: 1, transition: 'margin-left 0.3s', position: 'relative', zIndex: 1 }}>
        <div style={{
         ...glass,
          borderRadius: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.85)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
              {menu.find(m => m.id === activeTab)?.label}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>DDoS + Cloud Security Platform</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {result?.success && (
              <button onClick={exportPDF} style={{
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                color: '#0f172a',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Download size={18} /> Export PDF
              </button>
            )}
            <button onClick={handleLogout} style={{
              background: 'rgba(239,68,68,0.2)',
              color: '#ef4444', border: '1px solid #ef4444',
              borderRadius: '12px', padding: '12px 20px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '700'
            }}>Logout</button>
          </div>
        </div>

        <div ref={reportRef} style={{ padding: '32px' }}>
          {!result && (
            <div style={{...glass, padding: '60px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
                  borderRadius: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 16px 50px rgba(56, 189, 248, 0.4)'
                }}>
                  <Shield size={44} />
                </div>
                <h3 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>Upload Network Traffic</h3>
                <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '15px' }}>CSV file for DDoS analysis</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* جديد: قائمة اختيار نوع الهجوم */}
                <select
                  value={attackType}
                  onChange={e => setAttackType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginBottom: '16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                >
                  <option value="DNS">DNS Flood</option>
                  <option value="LDAP">LDAP Flood</option>
                  <option value="NTP">NTP Flood</option>
                  <option value="NetBIOS">NetBIOS</option>
                  <option value="Syn">SYN Flood</option>
                  <option value="UDPLag">UDP Lag</option>
                </select>

                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                  <div style={{
                    border: `2px dashed ${file? '#22c55e' : 'rgba(148,163,184,0.3)'}`,
                    borderRadius: '18px',
                    padding: '70px 30px',
                    background: file? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.2)',
                    transition: 'all 0.3s'
                  }}>
                    <Upload size={52} style={{ marginBottom: '16px', color: file? '#22c55e' : '#38bdf8' }} />
                    {file? (
                      <p style={{ fontWeight: '700', fontSize: '17px', margin: 0, color: '#22c55e' }}>{file.name}</p>
                    ) : (
                      <>
                        <p style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>Drop CSV file here</p>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Network traffic data for analysis</p>
                      </>
                    )}
                  </div>
                </label>

                {loading && (
                  <div style={{ marginTop: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                      <span style={{ color: '#94a3b8' }}>AI Analysis in progress...</span>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ background: 'rgba(148,163,184,0.2)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)',
                        borderRadius: '8px',
                        transition: 'width 0.3s'
                      }}></div>
                    </div>
                  </div>
                )}

                {/* جديد: زرين بدل زر واحد */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '28px'}}>
                  <button type="submit" disabled={loading ||!file} style={{
                    background: loading ||!file? 'rgba(148,163,184,0.2)' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    color: loading ||!file? '#64748b' : '#0f172a',
                    border: 'none',
                    padding: '18px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading ||!file? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <Upload size={20} /> تحليل الملف
                  </button>

                  <button type="button" onClick={handleLiveAnalysis} disabled={loading} style={{
                    background: loading? 'rgba(148,163,184,0.2)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: loading? '#64748b' : 'white',
                    border: 'none',
                    padding: '18px',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: loading? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <Activity size={20} /> تحليل مباشر
                  </button>
                </div>
              </form>
            </div>
          )}

          {result && result.success && (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    {[
                      { label: 'Total Events', value: result.total_flows, color: '#38bdf8' },
                      { label: 'Attacks Detected', value: result.attack_count, color: '#ef4444' },
                      { label: 'CPU Usage', value: `${result.cpu_used}%`, color: '#f97316' },
                      { label: 'RAM Usage', value: `${result.ram_used}%`, color: '#22c55e' }
                    ].map((stat, i) => (
                      <div key={i} style={{...glass, padding: '28px', borderLeft: `4px solid ${stat.color}`}}>
                        <p style={{ color: '#94a3b8', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '500' }}>{stat.label}</p>
                        <p style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{...glass, padding: '32px', textAlign: 'center', marginBottom: '24px'}}>
                    <h3 style={{margin: '0 0 16px 0', fontSize: '24px'}}>النتيجة</h3>
                    <p style={{fontSize: '48px', fontWeight: '800', margin: 0, color: result.prediction === 'ATTACK'? '#ef4444' : '#22c55e'}}>
                      {result.prediction}
                    </p>
                    <p style={{color: '#94a3b8', marginTop: '8px'}}>المودل: {result.model} | الثقة: {result.confidence}%</p>
                  </div>
                </div>
              )}
            </>
          )}

          {result?.success === false && (
            <div style={{...glass, padding: '60px', textAlign: 'center', border: '1px solid #ef4444' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700' }}>Analysis Failed</h3>
              <p style={{ color: '#94a3b8', margin: 0 }}>{result.error}</p>
            </div>
          )}
        </div>

        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; }
          tr:hover { background: rgba(56, 189, 248, 0.05)!important; }
        `}</style>
      </div>
    </div>
  )
}
