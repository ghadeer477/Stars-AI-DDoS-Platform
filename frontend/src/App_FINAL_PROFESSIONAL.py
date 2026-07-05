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
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts' },
    { id: 'agents', icon: Server, label: 'Agents' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ]

  const activeTitle = sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'
  const resultColor = result?.prediction === 'ATTACK' ? '#ef4444' : '#10b981'

  const panels = {
    network: {
      title: 'Network Monitoring',
      subtitle: 'Live traffic visibility, packet behavior, and DDoS traffic indicators.',
      metric: result?.success ? `${result.total_flows || 0} flows` : '12.8K packets',
      status: 'AWS EC2 Connected',
      cards: [
        ['Inbound Traffic', result?.success ? `${result.total_flows || 0} flows` : '12.8K packets', '#20D9FF'],
        ['Suspicious Sources', result?.success ? `${result.attack_count || 0} detected` : '34 IPs', '#EF4444'],
        ['Selected Attack', attackType, '#7A00FF'],
        ['API Health', 'Online :5000', '#10B981']
      ],
      rows: [
        ['192.168.1.44', 'DNS Flood pattern detected', 'High', '#EF4444'],
        ['10.0.0.82', 'SYN traffic spike', 'Medium', '#F59E0B'],
        ['172.16.4.11', 'UDP lag behavior', 'Low', '#20D9FF'],
        ['203.0.113.25', 'NTP reflection attempt', 'Medium', '#7A00FF']
      ]
    },
    security: {
      title: 'Security Center',
      subtitle: 'AI model integrity, defense status, and protection workflow.',
      metric: result?.success ? `${result.confidence || 0}%` : '98%',
      status: 'Model Ready',
      cards: [
        ['Model Integrity', '98.7%', '#20D9FF'],
        ['Threat Prevention', 'Active', '#10B981'],
        ['Risk Level', result?.prediction === 'ATTACK' ? 'Critical' : 'Stable', result?.prediction === 'ATTACK' ? '#EF4444' : '#10B981'],
        ['Cloud Shield', 'Enabled', '#7A00FF']
      ],
      rows: [
        ['Input Validation', 'CSV and live traffic checks', 'Enabled', '#10B981'],
        ['DDoS Pattern Matching', 'AI-assisted classification', 'Running', '#20D9FF'],
        ['Rate Anomaly Detection', 'Traffic spike inspection', 'Monitoring', '#F59E0B'],
        ['Attack Classification', attackType, 'Ready', '#7A00FF']
      ]
    },
    alerts: {
      title: 'Threat Alerts',
      subtitle: 'Recent security events and DDoS detection notifications.',
      metric: result?.success ? `${result.attack_count || 0}` : '27',
      status: result?.prediction === 'ATTACK' ? 'Attack Detected' : 'Monitoring',
      cards: [
        ['Critical Alerts', result?.prediction === 'ATTACK' ? '1 Active' : '0 Active', '#EF4444'],
        ['Warnings', '6 Events', '#F59E0B'],
        ['Resolved', '128', '#10B981'],
        ['Live Status', loading ? 'Analyzing' : 'Idle', '#20D9FF']
      ],
      rows: [
        ['DDoS Signature', attackType, result?.prediction === 'ATTACK' ? 'Critical' : 'Stable', result?.prediction === 'ATTACK' ? '#EF4444' : '#10B981'],
        ['Unusual Packet Rate', 'Traffic spike detected', 'Warning', '#F59E0B'],
        ['Repeated Source IP', 'Network layer repetition', 'Medium', '#7A00FF'],
        ['API Analyzer', 'Backend response received', 'Online', '#20D9FF']
      ]
    },
    agents: {
      title: 'Security Agents',
      subtitle: 'Frontend, backend, AWS server, and analyzer runtime status.',
      metric: '4/4',
      status: 'All Systems Online',
      cards: [
        ['Frontend Agent', 'Active', '#20D9FF'],
        ['Flask Backend', 'Online', '#10B981'],
        ['AWS EC2 Server', 'Connected', '#7A00FF'],
        ['Analyzer Module', loading ? 'Busy' : 'Ready', '#F59E0B']
      ],
      rows: [
        ['React/Vite UI', 'Client dashboard interface', 'Active', '#20D9FF'],
        ['Flask API', 'Port 5000 backend service', 'Online', '#10B981'],
        ['Prediction Engine', '/predict endpoint', 'Ready', '#7A00FF'],
        ['Live Detection', '/predict-live endpoint', 'Ready', '#F59E0B']
      ]
    },
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Exportable analysis reports and security summary insights.',
      metric: result?.success ? result.prediction : 'Ready',
      status: result?.success ? 'Report Available' : 'Run Analysis First',
      cards: [
        ['Report Status', result?.success ? 'Available' : 'Waiting', result?.success ? '#10B981' : '#F59E0B'],
        ['Detection Result', result?.success ? result.prediction : 'No Result', resultColor],
        ['Confidence', result?.success ? `${result.confidence}%` : '--', '#7A00FF'],
        ['Export PDF', result?.success ? 'Enabled' : 'Disabled', result?.success ? '#10B981' : '#6b7280']
      ],
      rows: [
        ['Total Flows', result?.success ? `${result.total_flows || 0}` : '--', 'Dataset', '#20D9FF'],
        ['Attacks Detected', result?.success ? `${result.attack_count || 0}` : '--', 'AI Result', '#EF4444'],
        ['CPU Usage', result?.success ? `${result.cpu_used}%` : '--', 'Runtime', '#F59E0B'],
        ['RAM Usage', result?.success ? `${result.ram_used}%` : '--', 'Runtime', '#7A00FF']
      ]
    }
  }

  const dashboardStats = [
    { title: 'Total Threats', value: result?.success ? result.attack_count || 0 : '1,289', change: '+12.4%', icon: AlertTriangle, color: '#7A00FF' },
    { title: 'Defended', value: result?.success ? Math.max((Number(result.total_flows) || 0) - (Number(result.attack_count) || 0), 0) : '8,602', change: '+8.1%', icon: Shield, color: '#20D9FF' },
    { title: 'Failed', value: result?.success ? result.attack_count || 0 : '307', change: '-3.2%', icon: Bug, color: '#EF4444' },
    { title: 'Total Users', value: '4,829', change: '+6.8%', icon: UserPlus, color: '#10B981' }
  ]

  const styles = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #95a6ba; }
    button, input, select { font-family: inherit; }
    button { transition: .2s ease; }
    button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
    button:disabled { opacity: .55; cursor: not-allowed; }

    .login-page {
      min-height: 100vh;
      background:
        radial-gradient(circle at 20% 20%, rgba(122,0,255,.28), transparent 32%),
        radial-gradient(circle at 80% 70%, rgba(32,217,255,.18), transparent 28%),
        linear-gradient(135deg, #7f93aa 0%, #95a6ba 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #fff;
      font-family: Inter, system-ui, sans-serif;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: #09090b;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 30px;
      padding: 42px;
      text-align: center;
      box-shadow: 0 30px 90px rgba(0,0,0,.45);
    }

    .login-icon {
      width: 82px;
      height: 82px;
      margin: 0 auto 22px;
      border-radius: 24px;
      background: linear-gradient(135deg, #4F46FF, #20D9FF);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-card h1 { margin: 0; font-size: 32px; font-weight: 900; }
    .login-card p { margin: 10px 0 30px; color: #8E8E99; font-size: 14px; }
    .login-card input {
      width: 100%;
      padding: 15px 16px;
      margin-bottom: 14px;
      background: #151518;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 16px;
      color: #fff;
      outline: none;
    }
    .login-card form button {
      width: 100%;
      border: 0;
      border-radius: 16px;
      padding: 16px;
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      background: linear-gradient(135deg, #4F46FF, #20D9FF);
      cursor: pointer;
    }
    .switch-auth {
      margin-top: 18px;
      background: transparent;
      border: 0;
      color: #20D9FF;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
    }

    .app-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #8ea0b6 0%, #a7b5c8 100%);
      color: #fff;
      font-family: Inter, system-ui, sans-serif;
      padding: 26px;
    }

    .shell {
      max-width: 1440px;
      min-height: calc(100vh - 52px);
      margin: 0 auto;
      background: #050505;
      border-radius: 34px;
      overflow: hidden;
      display: grid;
      box-shadow: 0 35px 110px rgba(0,0,0,.45);
      border: 1px solid rgba(255,255,255,.08);
    }

    .sidebar {
      background: #0b0b0d;
      border-right: 1px solid rgba(255,255,255,.08);
      padding: 22px 14px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 10px 18px;
    }

    .brand-icon {
      min-width: 48px;
      height: 48px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4F46FF, #20D9FF);
    }

    .brand h2 { margin: 0; font-size: 18px; font-weight: 900; }
    .brand p { margin: 3px 0 0; color: #8E8E99; font-size: 12px; }

    .sidebar nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .sidebar nav button {
      width: 100%;
      min-height: 48px;
      border: 0;
      border-radius: 16px;
      background: transparent;
      color: #8E8E99;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
    }

    .sidebar nav button span {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sidebar nav button.active {
      background: linear-gradient(135deg, rgba(79,70,255,.95), rgba(32,217,255,.45));
      color: #fff;
      box-shadow: 0 14px 32px rgba(79,70,255,.22);
    }

    .collapse-btn {
      width: 100%;
      min-height: 46px;
      border: 1px solid rgba(255,255,255,.08);
      background: #151518;
      color: #8E8E99;
      border-radius: 15px;
      cursor: pointer;
    }

    .user-box {
      padding: 12px;
      border-radius: 18px;
      background: #151518;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7A00FF, #20D9FF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }

    .user-box small { display: block; color: #8E8E99; }

    main { padding: 26px; overflow: auto; }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
      margin-bottom: 26px;
    }

    .top-header h1 {
      margin: 0;
      font-size: 34px;
      line-height: 1;
      font-weight: 950;
    }

    .top-header p { margin: 9px 0 0; color: #8E8E99; font-size: 14px; }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .header-actions button {
      background: #151518;
      color: white;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      padding: 12px 16px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .download-btn:not(:disabled) {
      background: linear-gradient(135deg, #4F46FF, #20D9FF);
    }

    .logout-btn {
      background: rgba(239,68,68,.12) !important;
      color: #EF4444 !important;
      border-color: rgba(239,68,68,.35) !important;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 18px;
    }

    .card {
      background: #151518;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 26px;
      box-shadow: 0 24px 70px rgba(0,0,0,.26);
    }

    .stat-card {
      padding: 20px;
      min-height: 145px;
      position: relative;
      overflow: hidden;
    }

    .stat-card p { margin: 0; color: #8E8E99; font-size: 13px; font-weight: 800; }
    .stat-card h2 { margin: 14px 0 0; font-size: 30px; font-weight: 950; }
    .stat-head { display: flex; justify-content: space-between; }
    .stat-icon {
      width: 42px;
      height: 42px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .change { margin-top: 18px; display: flex; gap: 8px; align-items: center; }
    .change span { padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 900; }
    .change small { color: #6b7280; }

    .main-grid {
      display: grid;
      grid-template-columns: minmax(280px, .9fr) minmax(360px, 1.35fr);
      gap: 18px;
      margin-bottom: 18px;
    }

    .bottom-grid {
      display: grid;
      grid-template-columns: minmax(360px, 1.05fr) minmax(320px, .95fr);
      gap: 18px;
    }

    .panel { padding: 24px; }
    .panel h3 { margin: 0; font-size: 20px; font-weight: 900; }
    .panel p { margin: 8px 0 18px; color: #8E8E99; font-size: 13px; }

    .hero-panel {
      background: linear-gradient(135deg, rgba(79,70,255,.28), rgba(32,217,255,.12));
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 28px;
      padding: 28px;
      margin-bottom: 18px;
      overflow: hidden;
      position: relative;
    }

    .hero-panel h2 { margin: 10px 0 8px; font-size: 34px; font-weight: 950; }
    .hero-panel p { margin: 0; color: #20D9FF; font-size: 13px; font-weight: 900; text-transform: uppercase; }
    .hero-panel > span { color: #8E8E99; font-size: 14px; }
    .hero-metrics { margin-top: 22px; display: flex; gap: 12px; flex-wrap: wrap; }
    .hero-metrics div {
      background: #0b0b0d;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      padding: 16px 20px;
    }
    .hero-metrics small { display: block; color: #8E8E99; font-size: 12px; font-weight: 800; }
    .hero-metrics strong { font-size: 30px; }
    .hero-metrics b {
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(16,185,129,.12);
      color: #10B981;
      border: 1px solid rgba(16,185,129,.3);
      font-size: 13px;
      align-self: center;
    }

    .gauge {
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gauge-ring {
      width: 205px;
      height: 205px;
      border-radius: 50%;
      background: conic-gradient(from 220deg, #7A00FF, #20D9FF, #10B981, rgba(255,255,255,.08));
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .gauge-inner {
      width: 145px;
      height: 145px;
      border-radius: 50%;
      background: #151518;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .gauge-inner strong { font-size: 34px; }
    .gauge-inner span { color: #8E8E99; font-size: 12px; }

    .bubble-chart {
      height: 245px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ring1 {
      width: 195px;
      height: 195px;
      border-radius: 50%;
      border: 22px solid rgba(79,70,255,.55);
    }
    .ring2 {
      position: absolute;
      width: 132px;
      height: 132px;
      border-radius: 50%;
      border: 18px solid rgba(32,217,255,.65);
    }
    .ai-core {
      position: absolute;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7A00FF, #20D9FF);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 950;
    }
    .bubble {
      position: absolute;
      background: #0b0b0d;
      border: 1px solid rgba(32,217,255,.35);
      color: #20D9FF;
      border-radius: 15px;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 900;
    }
    .b1 { left: 18%; top: 32%; }
    .b2 { left: 72%; top: 34%; color: #7A00FF; border-color: rgba(122,0,255,.35); }
    .b3 { left: 60%; top: 76%; color: #10B981; border-color: rgba(16,185,129,.35); }
    .b4 { left: 23%; top: 75%; color: #EF4444; border-color: rgba(239,68,68,.35); }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 520px; }
    th { text-align: left; color: #8E8E99; font-size: 12px; padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,.07); }
    td { padding: 15px 10px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,.04); }
    td:first-child { font-weight: 900; }
    td:nth-child(2) { color: #8E8E99; }
    .pill { padding: 7px 10px; border-radius: 999px; border: 1px solid; font-size: 12px; font-weight: 900; }

    .select-box {
      width: 100%;
      padding: 14px;
      margin-bottom: 14px;
      background: #0b0b0d;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 15px;
      color: white;
      outline: none;
      font-weight: 800;
    }
    .select-box option { background: #0b0b0d; color: white; }
    .upload-zone input { display: none; }
    .upload-box {
      border: 2px dashed rgba(255,255,255,.14);
      background: #0b0b0d;
      border-radius: 22px;
      padding: 30px 18px;
      text-align: center;
      cursor: pointer;
    }
    .upload-box.active { border-color: #10B981; background: rgba(16,185,129,.08); }
    .upload-box strong { display: block; margin: 12px 0 4px; }
    .upload-box span { color: #8E8E99; font-size: 12px; }

    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
    .actions button {
      border: 1px solid rgba(255,255,255,.08);
      padding: 15px 12px;
      border-radius: 16px;
      cursor: pointer;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .primary { background: linear-gradient(135deg, #4F46FF, #20D9FF); color: white; }
    .live { background: linear-gradient(135deg, #10B981, #20D9FF); color: white; }
    .actions button:disabled { background: #0b0b0d; color: #6b7280; }

    .progress-box { margin-top: 18px; }
    .progress-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #8E8E99; }
    .progress-top strong { color: #20D9FF; }
    .progress-line { height: 8px; border-radius: 999px; background: #0b0b0d; overflow: hidden; }
    .progress-line span { display: block; height: 100%; background: linear-gradient(90deg, #4F46FF, #20D9FF); }

    .latest-result {
      margin-top: 18px;
      background: #0b0b0d;
      border: 1px solid;
      border-radius: 20px;
      padding: 18px;
    }
    .latest-result p { margin: 0; color: #8E8E99; font-size: 12px; font-weight: 800; }
    .latest-result h2 { margin: 8px 0 6px; font-size: 28px; font-weight: 950; }
    .latest-result span { color: #8E8E99; font-size: 12px; }

    .error-box {
      margin-top: 18px;
      background: rgba(239,68,68,.08);
      border: 1px solid rgba(239,68,68,.35);
      border-radius: 18px;
      padding: 16px;
      color: #EF4444;
      font-weight: 800;
    }

    .report-btn {
      margin-top: 14px;
      width: 100%;
      background: linear-gradient(135deg, #7A00FF, #20D9FF);
      color: white;
      border: 1px solid rgba(255,255,255,.08);
      padding: 14px;
      border-radius: 15px;
      cursor: pointer;
      font-weight: 900;
    }

    @media (max-width: 1100px) {
      .main-grid, .bottom-grid { grid-template-columns: 1fr; }
      .shell { grid-template-columns: 86px 1fr !important; }
      .brand div:not(.brand-icon), .sidebar nav button b, .user-box span { display: none; }
      .sidebar nav button { justify-content: center; padding: 0; }
    }

    @media (max-width: 760px) {
      .app-page { padding: 12px; }
      .shell { grid-template-columns: 1fr !important; border-radius: 24px; }
      .sidebar { flex-direction: row; overflow-x: auto; padding: 12px; }
      .brand, .user-box, .collapse-btn { display: none; }
      .sidebar nav { flex-direction: row; }
      .sidebar nav button { min-width: 48px; }
      main { padding: 18px; }
      .top-header { flex-direction: column; align-items: flex-start; }
      .actions { grid-template-columns: 1fr; }
    }
  `

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="card stat-card">
      <div className="stat-head">
        <div>
          <p>{title}</p>
          <h2>{value}</h2>
        </div>
        <div className="stat-icon" style={{ color, background: `${color}1f` }}>
          <Icon size={22} />
        </div>
      </div>
      <div className="change">
        <span style={{ color, background: `${color}1f` }}>{change}</span>
        <small>Compared to last week</small>
      </div>
    </div>
  )

  const DataTable = ({ rows }) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([item, desc, status, color]) => (
            <tr key={item}>
              <td>{item}</td>
              <td>{desc}</td>
              <td>
                <span className="pill" style={{ color, background: `${color}17`, borderColor: `${color}44` }}>
                  {status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const AnalysisBox = () => (
    <div className="card panel">
      <h3>AI DDoS Analysis</h3>
      <p>Upload CSV or run live detection</p>

      <form onSubmit={handleSubmit}>
        <select className="select-box" value={attackType} onChange={e => setAttackType(e.target.value)}>
                        <option value="Auto Detect">Auto Detect</option>
<option value="DNS">DNS Flood</option>
          <option value="LDAP">LDAP Flood</option>
          <option value="NTP">NTP Flood</option>
          <option value="NetBIOS">NetBIOS</option>
          <option value="Syn">SYN Flood</option>
          <option value="UDPLag">UDP Lag</option>
        </select>

        <label className="upload-zone">
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
          <div className={file ? 'upload-box active' : 'upload-box'}>
            <Upload size={38} color={file ? '#10B981' : '#20D9FF'} />
            <strong>{file ? file.name : 'Drop CSV file here'}</strong>
            <span>Upload network traffic data for AI-based DDoS analysis</span>
          </div>
        </label>

        {loading && (
          <div className="progress-box">
            <div className="progress-top">
              <span>AI Analysis in progress...</span>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="progress-line">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="actions">
          <button type="submit" disabled={loading || !file} className="primary">
            <Upload size={18} /> تحليل الملف
          </button>
          <button type="button" onClick={handleLiveAnalysis} disabled={loading} className="live">
            <Activity size={18} /> تحليل مباشر
          </button>
        </div>
      </form>

      {result?.success && (
        <div className="latest-result" style={{ borderColor: `${resultColor}55` }}>
          <p>Latest Result</p>
          <h2 style={{ color: resultColor }}>{result.prediction}</h2>
          <span>Model: {result.model} | Confidence: {result.confidence}% | CPU: {result.cpu_used}% | RAM: {result.ram_used}%</span>
        </div>
      )}

      {result?.success === false && (
        <div className="error-box">Analysis Failed: {result.error}</div>
      )}
    </div>
  )

  const DashboardPage = () => (
    <>
      <section className="stats-grid">
        {dashboardStats.map(stat => <StatCard key={stat.title} {...stat} />)}
      </section>

      <section className="main-grid">
        <div className="card panel">
          <h3>Security Model Integrity</h3>
          <p>Ensures accuracy and reliability of security measures.</p>
          <div className="gauge">
            <div className="gauge-ring">
              <div className="gauge-inner">
                <strong>7869</strong>
                <span>Integrity Score</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card panel">
          <h3>Predictive Model Deployment</h3>
          <p>In last 24 hours</p>
          <div className="bubble-chart">
            <div className="ring1" />
            <div className="ring2" />
            <div className="ai-core">AI</div>
            <span className="bubble b1">DNS 14%</span>
            <span className="bubble b2">SYN 24%</span>
            <span className="bubble b3">UDP 18%</span>
            <span className="bubble b4">NTP 11%</span>
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="card panel">
          <h3>Top Threats</h3>
          <p>Recent threat intelligence summary</p>
          <DataTable rows={[
            ['Sequential Breach', '192.168.1.44', 'High', '#EF4444'],
            ['Global Disruption', '10.0.0.82', 'Medium', '#F59E0B'],
            ['Analytical Deduction', '172.16.4.11', 'Low', '#20D9FF']
          ]} />
        </div>
        <AnalysisBox />
      </section>
    </>
  )

  const ModulePage = () => {
    const panel = panels[activeTab] || panels.network

    return (
      <>
        <section className="hero-panel">
          <p>Sentinel AI Module</p>
          <h2>{panel.title}</h2>
          <span>{panel.subtitle}</span>
          <div className="hero-metrics">
            <div>
              <small>Primary Metric</small>
              <strong>{panel.metric}</strong>
            </div>
            <b>{panel.status}</b>
          </div>
        </section>

        <section className="stats-grid">
          {panel.cards.map(([title, value, color]) => (
            <div key={title} className="card stat-card">
              <p>{title}</p>
              <h2>{value}</h2>
              <div style={{ marginTop: 18, height: 7, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <span style={{ display: 'block', width: '72%', height: '100%', background: color }} />
              </div>
            </div>
          ))}
        </section>

        <section className="bottom-grid">
          <div className="card panel">
            <h3>{panel.title} Details</h3>
            <p>Operational details connected to this Sentinel AI module.</p>
            <DataTable rows={panel.rows} />
          </div>

          <div>
            <AnalysisBox />
            {activeTab === 'reports' && (
              <button className="report-btn" onClick={result?.success ? exportPDF : undefined} disabled={!result?.success}>
                Download PDF Report
              </button>
            )}
          </div>
        </section>
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-icon"><Lock size={40} /></div>
          <h1>Sentinel AI</h1>
          <p>AI-Powered DDoS Detection Platform</p>

          <form onSubmit={handleAuth}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit">{isRegister ? 'Create Account' : 'Sign In'}</button>
          </form>

          <button className="switch-auth" onClick={() => { setIsRegister(!isRegister); setPassword('') }}>
            {isRegister ? 'Already have account? Login' : "Don't have account? Register"}
          </button>

          {!isRegister && <small style={{ display: 'block', marginTop: 20, color: '#6b7280' }}>Demo: admin / admin123</small>}
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  return (
    <div className="app-page">
      <div className="shell" style={{ gridTemplateColumns: sidebarOpen ? '230px 1fr' : '86px 1fr' }}>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon"><Shield size={25} /></div>
            {sidebarOpen && (
              <div>
                <h2>Sentinel AI</h2>
                <p>Security Platform</p>
              </div>
            )}
          </div>

          <nav>
            {sidebarItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? 'active' : ''}>
                  <span>
                    <Icon size={20} />
                    {sidebarOpen && <b>{item.label}</b>}
                  </span>
                </button>
              )
            })}
          </nav>

          <button className="collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className="user-box">
            <div className="avatar">{(user || 'A').charAt(0).toUpperCase()}</div>
            {sidebarOpen && (
              <span>
                <strong>{user || 'admin'}</strong>
                <small>Administrator</small>
              </span>
            )}
          </div>
        </aside>

        <main>
          <header className="top-header">
            <div>
              <h1>{activeTitle}</h1>
              <p>Analyze network traffic and detect suspicious DDoS activity</p>
            </div>

            <div className="header-actions">
              <button>This week</button>
              <button className="download-btn" onClick={result?.success ? exportPDF : undefined} disabled={!result?.success}>
                <Download size={17} /> Download Report
              </button>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </header>

          <div ref={reportRef}>
            {activeTab === 'dashboard' ? <DashboardPage /> : <ModulePage />}
          </div>
        </main>
      </div>

      <style>{styles}</style>
    </div>
  )
}
