import { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'
import { Shield, Upload, Activity, Server, AlertTriangle, FileText, Menu, X, Download, Zap, Cloud, Bug, Lock, UserPlus, TrendingUp, Clock, CheckCircle, AlertCircle, Play, Square } from 'lucide-react'
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
  const [attackType, setAttackType] = useState('DNS')
  
  // حالة جديدة للمراقبة المستمرة
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false)

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
        setProgress(prev => prev >= 98 ? 98 : prev + Math.random() * 6)
      }, 200)
      return () => clearInterval(interval)
    } else {
      setProgress(0)
    }
  }, [loading])

  // دالة لفحص الحالة المباشرة (يتم استدعاؤها تلقائياً)
  const checkLiveStatus = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://127.0.0.1:5000/predict-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attack_type: attackType })
      })
      const data = await res.json()
      
      if (data.success) {
        // محاكاة البيانات الإضافية (يمكنك إزالتها إذا أتى من الباك اند)
        data.alerts = [
          { id: '001', time: new Date().toLocaleTimeString(), rule: 'DDoS Attack Detected', level: 15, src: 'Live-Monitor', agent: 'Agent-01', mitre: 'T1498' }
        ]
        data.agents = [
          { name: 'Agent-01', ip: '192.168.1.10', status: 'active', alerts: 4523, version: '4.7.2', uptime: '99.9%' }
        ]
        data.timeline = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          attacks: Math.floor(Math.random() * 80),
          normal: Math.floor(Math.random() * 400)
        }))

        // التحقق من اكتشاف هجوم جديد
        if (data.prediction === 'ATTACK' && result?.prediction !== 'ATTACK') {
          alert("🚨 تحذير أمني: تم رصد هجوم نشط على السيرفر!")
          // تشغيل صوت إنذار (اختياري)
          const audio = new Audio('/alarm.mp3'); // تأكد من وجود ملف صوتي
          audio.play().catch(e => console.log("Audio play failed (interaction needed)"));
        }
        
        setResult(data)
      }
    } catch (err) {
      console.error("Live check failed", err);
    }
  }

  // المراقبة المستمرة
  useEffect(() => {
    let intervalId;
    if (isLiveMonitoring && isLoggedIn) {
      // فحص فوري عند البدء
      checkLiveStatus();
      // تكرار الفحص كل 3 ثواني
      intervalId = setInterval(checkLiveStatus, 3000);
    }
    return () => clearInterval(intervalId);
  }, [isLiveMonitoring, isLoggedIn, attackType])

  // Enhanced Glass Morphism Style
  const glass = {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '24px',
    boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  }

  // Premium gradient colors
  const gradients = {
    primary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accent: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    const endpoint = isRegister ? '/register' : '/login'
    try {
      const res = await fetch('http://127.0.0.1:5000' + endpoint, {
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
    setIsLiveMonitoring(false) // إيقاف المراقبة عند الخروج
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    setCloudData(null)
    setIsLiveMonitoring(false) // إيقاف المراقبة المباشرة عند رفع ملف جديد
    const formData = new FormData()
    formData.append('file', file)
    formData.append('attack_type', attackType)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
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
    return '#10b981'
  }

  const getRiskColor = (risk) => {
    if (risk === 'critical') return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: '#ef4444' }
    if (risk === 'high') return { bg: 'rgba(249,115,22,0.15)', text: '#f97316', border: '#f97316' }
    return { bg: 'rgba(234,179,8,0.15)', text: '#eab308', border: '#eab308' }
  }

  const pieData = result?.success ? [
    { name: 'Attacks', value: result.attack_count, color: '#ef4444' },
    { name: 'Benign', value: result.benign_count, color: '#10b981' }
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f1f5f9',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{...glass, padding: '60px', width: '100%', maxWidth: '480px', textAlign: 'center', position: 'relative', zIndex: 10}}>
          <div style={{
            width: '100px', height: '100px', margin: '0 auto 32px',
            background: gradients.primary,
            borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(6, 182, 212, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            <Shield size={50} color="white" strokeWidth={1.5} />
          </div>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '36px', fontWeight: '900', background: gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sentinel AI</h2>
          <p style={{ color: '#cbd5e1', margin: '0 0 40px 0', fontSize: '15px', fontWeight: '500' }}>
            {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول إلى حسابك'}
          </p>
          <form onSubmit={handleAuth}>
            <input
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '16px 18px', marginBottom: '16px',
                background: 'rgba(0,0,0,0.25)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: '14px', color: '#f1f5f9', fontSize: '15px', outline: 'none',
                fontFamily: 'inherit', transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(6, 182, 212, 0.5)'
                e.target.style.background = 'rgba(6, 182, 212, 0.05)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)'
                e.target.style.background = 'rgba(0,0,0,0.25)'
              }}
            />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '16px 18px', marginBottom: '28px',
                background: 'rgba(0,0,0,0.25)', border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: '14px', color: '#f1f5f9', fontSize: '15px', outline: 'none',
                fontFamily: 'inherit', transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(6, 182, 212, 0.5)'
                e.target.style.background = 'rgba(6, 182, 212, 0.05)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.12)'
                e.target.style.background = 'rgba(0,0,0,0.25)'
              }}
            />
            <button type="submit" style={{
              width: '100%', padding: '18px', marginBottom: '18px',
              background: gradients.primary,
              border: 'none', borderRadius: '14px', color: 'white',
              fontSize: '16px', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 15px 40px rgba(6, 182, 212, 0.3)',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 20px 50px rgba(6, 182, 212, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 15px 40px rgba(6, 182, 212, 0.3)'
            }}>
              {isRegister ? <><UserPlus size={18} style={{marginRight: '8px'}} /> إنشاء الحساب</> : 'تسجيل الدخول'}
            </button>
          </form>
          <button onClick={() => {setIsRegister(!isRegister); setPassword('')}} style={{
            background: 'transparent', border: 'none', color: '#06b6d4',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#0891b2'}
          onMouseLeave={(e) => e.target.style.color = '#06b6d4'}>
            {isRegister ? 'هل لديك حساب بالفعل؟ تسجيل دخول' : 'ليس لديك حساب؟ إنشاء حساب'}
          </button>
          {!isRegister && (
            <p style={{ marginTop: '24px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              🔐 تجريبي: admin / admin123
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #0f172a 100%)',
      color: '#f1f5f9',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex',
      position: 'relative'
    }}>
      {/* Enhanced background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Enhanced Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '90px',
        ...glass,
        borderRadius: 0,
        borderRight: '1px solid rgba(255,255,255,0.1)',
        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '28px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: gradients.primary,
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(6, 182, 212, 0.3)',
            flexShrink: 0
          }}>
            <Shield size={28} color="white" strokeWidth={1.5} />
          </div>
          {sidebarOpen && (
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', background: gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sentinel</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>مرحباً، {user}</p>
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
          {menu.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: '100%',
              padding: '14px 16px',
              marginBottom: '8px',
              border: 'none',
              background: activeTab === item.id ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === item.id ? '#06b6d4' : '#94a3b8',
              borderRadius: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderLeft: activeTab === item.id ? '3px solid #06b6d4' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)'
                e.currentTarget.style.color = '#cbd5e1'
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#94a3b8'
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <item.icon size={20} strokeWidth={1.5} />
                {sidebarOpen && <span>{item.label}</span>}
              </div>
              {sidebarOpen && item.badge && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
        <div style={{
          padding: '20px 12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          gap: '8px'
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            flex: 1,
            padding: '12px',
            background: 'rgba(148, 163, 184, 0.1)',
            border: 'none',
            borderRadius: '12px',
            color: '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={handleLogout} style={{
            flex: 1,
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            borderRadius: '12px',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.3s',
            fontWeight: '600',
            fontSize: '13px'
          }}>
            {sidebarOpen ? 'تسجيل خروج' : '↪'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: sidebarOpen ? '280px' : '90px',
        flex: 1,
        padding: '32px',
        transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {activeTab === 'dashboard' ? 'لوحة التحكم' : 'التحليلات'}
              {isLiveMonitoring && <span style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700',
                border: '1px solid #ef4444',
                animation: 'pulse 1.5s infinite'
              }}>🔴 LIVE</span>}
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              {new Date().toLocaleDateString('ar-SA')}
            </p>
          </div>
          {result && result.success && (
            <button onClick={exportPDF} style={{
              padding: '12px 24px',
              background: gradients.accent,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)'
            }}>
              <Download size={18} /> تحميل التقرير
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {loading && (
          <div style={{
            height: '4px',
            background: 'rgba(148, 163, 184, 0.1)',
            borderRadius: '2px',
            marginBottom: '32px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: gradients.primary,
              width: `${progress}%`,
              transition: 'width 0.3s',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
            }} />
          </div>
        )}

        {/* File Upload Section */}
        {activeTab === 'dashboard' && !result && (
          <div style={{...glass, padding: '48px', marginBottom: '32px'}}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'rgba(6, 182, 212, 0.1)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Upload size={40} color="#06b6d4" strokeWidth={1.5} />
              </div>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '800' }}>تحليل الملفات الأمنية</h2>
              <p style={{ color: '#94a3b8', margin: '0 0 24px 0', fontSize: '15px' }}>
                قم برفع ملف CSV أو JSON لتحليل حركة الشبكة والكشف عن الهجمات
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                    نوع الهجوم
                  </label>
                  <select value={attackType} onChange={e => setAttackType(e.target.value)} style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                    <option>DNS</option>
                    <option>DDoS</option>
                    <option>Botnet</option>
                    <option>Malware</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>
                    اختر الملف
                  </label>
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1.5px dashed rgba(6, 182, 212, 0.3)',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px'
              }}>
                <button type="submit" disabled={loading} style={{
                  background: loading ? 'rgba(148,163,184,0.2)' : gradients.primary,
                  color: loading ? '#64748b' : 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                  boxShadow: loading ? 'none' : '0 10px 30px rgba(6, 182, 212, 0.2)',
                  fontFamily: 'inherit'
                }}>
                  <Upload size={18} /> {loading ? 'جاري التحليل...' : 'تحليل الملف'}
                </button>
                {/* زر المراقبة المباشر المعدل */}
                <button 
                  type="button" 
                  onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
                  disabled={loading}
                  style={{
                    background: isLiveMonitoring 
                      ? 'rgba(239, 68, 68, 0.2)' // أحمر عند التشغيل
                      : (loading ? 'rgba(148,163,184,0.2)' : gradients.success),
                    color: isLiveMonitoring 
                      ? '#ef4444' 
                      : (loading ? '#64748b' : 'white'),
                    border: isLiveMonitoring ? '1px solid #ef4444' : 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s',
                    boxShadow: loading ? 'none' : '0 10px 30px rgba(16, 185, 129, 0.2)',
                    fontFamily: 'inherit'
                  }}
                >
                  {isLiveMonitoring ? <Square size={18} /> : <Activity size={18} />}
                  {isLiveMonitoring ? 'إيقاف المراقبة' : 'تحليل مباشر'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Results Section */}
        {result && result.success && (
          <div ref={reportRef}>
            {activeTab === 'dashboard' && (
              <>
                {/* Statistics Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  {[
                    { label: 'إجمالي الأحداث', value: result.total_flows, color: '#06b6d4', icon: Activity },
                    { label: 'الهجمات المكتشفة', value: result.attack_count, color: '#ef4444', icon: AlertTriangle },
                    { label: 'استخدام المعالج', value: `${result.cpu_used}%`, color: '#f59e0b', icon: Zap },
                    { label: 'استخدام الذاكرة', value: `${result.ram_used}%`, color: '#10b981', icon: Server }
                  ].map((stat, i) => {
                    const Icon = stat.icon
                    return (
                      <div key={i} style={{
                        ...glass,
                        padding: '28px',
                        borderLeft: `4px solid ${stat.color}`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '100px',
                          height: '100px',
                          background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`,
                          borderRadius: '50%'
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                          <div>
                            <p style={{ color: '#94a3b8', margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {stat.label}
                            </p>
                            <p style={{ fontSize: '36px', fontWeight: '900', margin: 0, color: stat.color }}>
                              {stat.value}
                            </p>
                          </div>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            background: `rgba(${stat.color === '#06b6d4' ? '6, 182, 212' : stat.color === '#ef4444' ? '239, 68, 68' : stat.color === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.15)`,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon size={28} color={stat.color} strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Main Result Card */}
                <div style={{...glass, padding: '40px', textAlign: 'center', marginBottom: '32px', position: 'relative', overflow: 'hidden'}}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: result.prediction === 'ATTACK'
                      ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 70%)'
                      : 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 24px',
                      background: result.prediction === 'ATTACK' ? gradients.danger : gradients.success,
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 20px 60px ${result.prediction === 'ATTACK' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      animation: result.prediction === 'ATTACK' ? 'pulse 1s infinite' : 'none'
                    }}>
                      {result.prediction === 'ATTACK' ? (
                        <AlertTriangle size={50} color="white" strokeWidth={1.5} />
                      ) : (
                        <CheckCircle size={50} color="white" strokeWidth={1.5} />
                      )}
                    </div>
                    <h3 style={{margin: '0 0 16px 0', fontSize: '28px', fontWeight: '800'}}>نتيجة التحليل</h3>
                    <p style={{
                      fontSize: '56px',
                      fontWeight: '900',
                      margin: '0 0 16px 0',
                      color: result.prediction === 'ATTACK' ? '#ef4444' : '#10b981',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}>
                      {result.prediction === 'ATTACK' ? '🚨 هجوم' : '✅ آمن'}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '16px',
                      marginTop: '24px'
                    }}>
                      <div style={{ background: 'rgba(148, 163, 184, 0.1)', padding: '16px', borderRadius: '12px' }}>
                        <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600' }}>النموذج</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{result.model}</p>
                      </div>
                      <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '12px' }}>
                        <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600' }}>درجة الثقة</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#06b6d4' }}>{result.confidence}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  {/* Pie Chart */}
                  <div style={{...glass, padding: '28px', borderRadius: '24px'}}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>توزيع النتائج</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#f1f5f9'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
                      {pieData.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', background: item.color, borderRadius: '3px' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Chart */}
                  <div style={{...glass, padding: '28px', borderRadius: '24px'}}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>الخط الزمني</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={result.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#f1f5f9'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="normal" stroke="#10b981" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts Table */}
                {result.alerts && result.alerts.length > 0 && (
                  <div style={{...glass, padding: '28px', marginBottom: '32px', borderRadius: '24px', overflow: 'hidden'}}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>التنبيهات</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>المعرّف</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>الوقت</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>القاعدة</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>المستوى</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>المصدر</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.alerts.map((alert, i) => (
                            <tr key={i} style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '12px', color: '#cbd5e1' }}>{alert.id}</td>
                              <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{alert.time}</td>
                              <td style={{ padding: '12px', color: '#cbd5e1', fontWeight: '600' }}>{alert.rule}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  background: `rgba(${alert.level >= 15 ? '239, 68, 68' : alert.level >= 12 ? '249, 115, 22' : '234, 179, 8'}, 0.2)`,
                                  color: getLevelColor(alert.level),
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  {alert.level}
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '13px' }}>{alert.src}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Agents Table */}
                {result.agents && result.agents.length > 0 && (
                  <div style={{...glass, padding: '28px', borderRadius: '24px', overflow: 'hidden'}}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>الوكلاء</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>الاسم</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>عنوان IP</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>الحالة</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>التنبيهات</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>النسخة</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#cbd5e1' }}>وقت التشغيل</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.agents.map((agent, i) => (
                            <tr key={i} style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '12px', color: '#cbd5e1', fontWeight: '600' }}>{agent.name}</td>
                              <td style={{ padding: '12px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '13px' }}>{agent.ip}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 12px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#10b981',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }} />
                                  {agent.status}
                                </div>
                              </td>
                              <td style={{ padding: '12px', color: '#cbd5e1' }}>{agent.alerts}</td>
                              <td style={{ padding: '12px', color: '#94a3b8', fontSize: '13px' }}>{agent.version}</td>
                              <td style={{ padding: '12px', color: '#cbd5e1' }}>{agent.uptime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {result?.success === false && (
          <div style={{...glass, padding: '60px', textAlign: 'center', border: '1px solid #ef4444', borderRadius: '24px'}}>
            <AlertTriangle size={50} color="#ef4444" style={{ margin: '0 auto 16px' }} strokeWidth={1.5} />
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800' }}>فشل التحليل</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>{result.error}</p>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 20px 60px rgba(6, 182, 212, 0.3); }
          50% { box-shadow: 0 20px 80px rgba(6, 182, 212, 0.5); }
        }
        tr:hover { background: rgba(56, 189, 248, 0.05)!important; }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  )
}