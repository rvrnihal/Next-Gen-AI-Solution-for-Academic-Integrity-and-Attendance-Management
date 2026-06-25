"use client";

import React, { useState, useEffect } from 'react';

// Types
type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'HOD_PRINCIPAL';

interface MalpracticeEvent {
  id: string;
  studentName: string;
  rollNumber: string;
  incidentType: string;
  confidence: number;
  timestamp: string;
  status: 'PENDING' | 'RESOLVED';
}

export default function AegisDashboard() {
  // Authentication & Navigation State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('FACULTY');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Input States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Plagiarism State
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [plagResult, setPlagResult] = useState<{ similarity: number; status: string } | null>(null);
  const [checkingPlag, setCheckingPlag] = useState(false);

  // Session Creation State
  const [subjectName, setSubjectName] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState('50');
  const [useGPS, setUseGPS] = useState(true);
  const [useQR, setUseQR] = useState(true);
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', subject: 'Machine Learning (CS401)', date: 'Today, 10:00 AM', enrolled: 45, present: 38 },
    { id: '2', subject: 'Advanced Computer Networks', date: 'Yesterday', enrolled: 42, present: 40 },
    { id: '3', subject: 'Compiler Design Lab', date: '24 June 2026', enrolled: 45, present: 41 }
  ]);

  // Attendance Scanning State
  const [scanRollNumber, setScanRollNumber] = useState('');
  const [scanMethod, setScanMethod] = useState<'BARCODE' | 'QR' | 'FACE'>('BARCODE');
  const [attendanceMessage, setAttendanceMessage] = useState('');

  // Malpractice Event Logs (Initial Mock Data)
  const [malpracticeLogs, setMalpracticeLogs] = useState<MalpracticeEvent[]>([
    { id: 'ev-1', studentName: 'Aditya Sen', rollNumber: '22AG1A05B5', incidentType: 'MOBILE_PHONE', confidence: 94.2, timestamp: '11:05 AM', status: 'PENDING' },
    { id: 'ev-2', studentName: 'Rohan Sharma', rollNumber: '22AG1A05C2', incidentType: 'PERSON_DEVIATION', confidence: 78.5, timestamp: '10:42 AM', status: 'RESOLVED' },
    { id: 'ev-3', studentName: 'Priya Verma', rollNumber: '22AG1A05D7', incidentType: 'MULTIPLE_PEOPLE', confidence: 88.0, timestamp: '09:55 AM', status: 'PENDING' }
  ]);

  // Alert simulation
  useEffect(() => {
    if (activeTab === 'malpractice' || activeTab === 'overview') {
      const interval = setInterval(() => {
        // Randomly simulate a new malpractice event if on malpractice tab
        const randomStudents = [
          { name: 'Kunal Verma', roll: '22AG1A05E3' },
          { name: 'Sneha Roy', roll: '22AG1A05F1' },
          { name: 'Rajesh Kumar', roll: '22AG1A05G6' }
        ];
        const student = randomStudents[Math.floor(Math.random() * randomStudents.length)];
        const types = ['MOBILE_PHONE', 'SUSPICIOUS_ITEMS', 'PERSON_DEVIATION'];
        const type = types[Math.floor(Math.random() * types.length)];
        const conf = Math.round((70 + Math.random() * 28) * 10) / 10;
        
        const newEvent: MalpracticeEvent = {
          id: `ev-${Date.now()}`,
          studentName: student.name,
          rollNumber: student.roll,
          incidentType: type,
          confidence: conf,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'PENDING'
        };

        setMalpracticeLogs(prev => [newEvent, ...prev.slice(0, 5)]);
      }, 12000);

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Handle Login Mock
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsLoggedIn(true);
    }
  };

  // Plagiarism Evaluator Call
  const handlePlagiarismCheck = async () => {
    if (!docA || !docB) return;
    setCheckingPlag(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/plagiarism/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({ docA, docB })
      });
      const data = await response.json();
      if (data.similarity !== undefined) {
        setPlagResult(data);
      } else {
        // Mock fallback if service not running locally yet
        setPlagResult({ similarity: 34.5, status: 'Moderate Similarity' });
      }
    } catch (e) {
      // Mock Fallback
      const score = Math.round((10 + Math.random() * 65) * 10) / 10;
      setPlagResult({
        similarity: score,
        status: score > 50 ? 'High Similarity' : score > 20 ? 'Moderate Similarity' : 'Clean'
      });
    } finally {
      setCheckingPlag(false);
    }
  };

  // Add Attendance Scan Mock
  const handleAttendanceScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanRollNumber) return;
    
    // Check in codes
    const isMatched = scanRollNumber.startsWith('22AG1A0');
    if (isMatched) {
      setAttendanceMessage(`✅ Success: marked present via ${scanMethod}`);
      setScanRollNumber('');
      setTimeout(() => setAttendanceMessage(''), 4000);
    } else {
      setAttendanceMessage('❌ Error: Student ID not found in database');
      setTimeout(() => setAttendanceMessage(''), 4000);
    }
  };

  // Create Class Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName) return;

    const newSession = {
      id: String(activeSessions.length + 1),
      subject: subjectName,
      date: 'Today, 11:30 AM',
      enrolled: 48,
      present: 0
    };

    setActiveSessions([newSession, ...activeSessions]);
    setSubjectName('');
    setActiveTab('overview');
  };

  // Theme Toggler
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // CSS module style declarations
  const styles = {
    appContainer: {
      display: 'flex',
      minHeight: '100vh',
    },
    sidebar: {
      width: '260px',
      padding: '24px 16px',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    mainContent: {
      flex: 1,
      padding: '32px',
      overflowY: 'auto' as const,
    },
    topBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    cardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    navItem: (active: boolean) => ({
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: 600,
      backgroundColor: active ? 'var(--color-primary-glow)' : 'transparent',
      borderColor: active ? 'var(--border-glass-active)' : 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
      transition: 'all 0.2s',
    })
  };

  // Render Login state
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '16px' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--color-primary)' }}>AEGIS AI</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Campus Integrity & Attendance Management</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</label>
              <input 
                type="email" 
                className="glass-input" 
                placeholder="faculty@aegis.edu" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
              <input 
                type="password" 
                className="glass-input" 
                placeholder="••••••••" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="glass-button" style={{ justifyContent: 'center', padding: '14px' }}>
              Sign In to Portal
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={{ padding: '8px 12px 24px 12px', borderBottom: '1px solid var(--border-glass)', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>Aegis AI</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Enterprise SaaS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={styles.navItem(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
            📊 System Overview
          </div>
          <div style={styles.navItem(activeTab === 'attendance')} onClick={() => setActiveTab('attendance')}>
            🎟️ Attendance Scanner
          </div>
          <div style={styles.navItem(activeTab === 'malpractice')} onClick={() => setActiveTab('malpractice')}>
            🚨 Malpractice Monitor
          </div>
          <div style={styles.navItem(activeTab === 'plagiarism')} onClick={() => setActiveTab('plagiarism')}>
            📄 Plagiarism Check
          </div>
          <div style={styles.navItem(activeTab === 'sessions')} onClick={() => setActiveTab('sessions')}>
            📅 Class Sessions
          </div>
          <div style={styles.navItem(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
            ⚙️ System Settings
          </div>
        </div>

        {/* Role Demo Selection Box */}
        <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', background: 'hsla(0, 0%, 100%, 0.03)', border: '1px dashed var(--border-glass)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>DEMO ROLE SWITCHER</span>
          <select 
            value={currentRole} 
            onChange={e => setCurrentRole(e.target.value as UserRole)}
            style={{ width: '100%', padding: '6px', background: 'var(--bg-base)', border: '1px solid var(--border-glass)', borderRadius: '4px' }}
          >
            <option value="FACULTY">Faculty Dashboard</option>
            <option value="STUDENT">Student Dashboard</option>
            <option value="HOD_PRINCIPAL">Principal / HOD View</option>
            <option value="ADMIN">System Admin</option>
          </select>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main style={styles.mainContent}>
        
        {/* TOP BAR */}
        <div style={styles.topBar}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {activeTab === 'overview' && 'System Overview'}
              {activeTab === 'attendance' && 'Attendance Scanner Hub'}
              {activeTab === 'malpractice' && 'AI Malpractice Monitoring'}
              {activeTab === 'plagiarism' && 'AI Plagiarism Evaluation'}
              {activeTab === 'sessions' && 'Class Session Registry'}
              {activeTab === 'settings' && 'Portal Settings'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Dr. Sarah Collins ({currentRole})</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={toggleTheme} className="glass-button-secondary" style={{ padding: '8px 12px' }}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="glass-button-secondary" style={{ padding: '8px 12px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ========================================================
            OVERVIEW TAB
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Stat Cards */}
            <div style={styles.cardGrid}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Average Attendance Rate</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '8px', color: 'var(--color-success)' }}>91.4%</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>+1.8% from last semester</p>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Class Sessions</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '8px', color: 'var(--color-primary)' }}>12 Classes</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Live scans in progress</p>
              </div>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Malpractice Incidents</span>
                <h3 style={{ fontSize: '2.2rem', marginTop: '8px', color: 'var(--color-danger)' }}>
                  {malpracticeLogs.filter(l => l.status === 'PENDING').length} Flagged
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting faculty review</p>
              </div>
            </div>

            {/* Custom SVG Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>Weekly Attendance Trend</h3>
                {/* Responsive CSS Bar Chart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingTop: '20px' }}>
                  {[
                    { day: 'Mon', val: 94 },
                    { day: 'Tue', val: 88 },
                    { day: 'Wed', val: 92 },
                    { day: 'Thu', val: 95 },
                    { day: 'Fri', val: 89 }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: `${item.val * 1.5}px`,
                        background: 'linear-gradient(to top, var(--color-primary-glow), var(--color-primary))',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: '0 0 8px var(--color-primary-glow)'
                      }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.day} ({item.val}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                <h3>Verification Methods</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                  {[
                    { name: 'Barcode Scanning', val: 55, color: 'var(--color-primary)' },
                    { name: 'Dynamic QR Scan', val: 28, color: 'var(--color-secondary)' },
                    { name: 'Face Recognition', val: 17, color: 'var(--color-success)' }
                  ].map((m, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                        <span>{m.name}</span>
                        <span style={{ fontWeight: 'bold' }}>{m.val}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'hsla(0,0%,100%,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${m.val}%`, height: '100%', background: m.color, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dashboard role dependent views */}
            {currentRole === 'FACULTY' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Quick Actions (Faculty)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setActiveTab('sessions')} className="glass-button">➕ Schedule Session</button>
                  <button onClick={() => setActiveTab('attendance')} className="glass-button">🎟️ Launch Barcode Scanner</button>
                  <button onClick={() => setActiveTab('malpractice')} className="glass-button">🚨 Stream Exam Feed</button>
                </div>
              </div>
            )}

            {currentRole === 'STUDENT' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Student Attendance Snapshot</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '16px', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Subject</span>
                    <p style={{ fontWeight: 'bold', margin: '4px 0' }}>Machine Learning</p>
                    <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>88.2% Present</span>
                  </div>
                  <div style={{ padding: '16px', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Subject</span>
                    <p style={{ fontWeight: 'bold', margin: '4px 0' }}>Compiler Design</p>
                    <span style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>92.0% Present</span>
                  </div>
                  <div style={{ padding: '16px', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Subject</span>
                    <p style={{ fontWeight: 'bold', margin: '4px 0' }}>Computer Networks</p>
                    <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>74.5% (Warning)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ATTENDANCE SCANNER TAB
            ======================================================== */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px' }}>Barcode / QR Scanner Simulator</h3>
              
              <form onSubmit={handleAttendanceScan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Verification Method</label>
                  <select 
                    value={scanMethod}
                    onChange={e => setScanMethod(e.target.value as any)}
                    className="glass-input"
                    style={{ background: 'var(--bg-base)' }}
                  >
                    <option value="BARCODE">Barcode Scan (Student ID)</option>
                    <option value="QR">Dynamic Rotating QR Code</option>
                    <option value="FACE">Facial Verification</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Select Active Session</label>
                  <select className="glass-input" style={{ background: 'var(--bg-base)' }}>
                    {activeSessions.map(s => (
                      <option key={s.id} value={s.id}>{s.subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Scan Value (Enter Roll Number / Barcode string)</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="e.g. 22AG1A05B5" 
                    value={scanRollNumber}
                    onChange={e => setScanRollNumber(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="glass-button" style={{ justifyContent: 'center' }}>
                  Simulate Scan Scan
                </button>

                {attendanceMessage && (
                  <div style={{
                    padding: '12px', 
                    borderRadius: '6px', 
                    textAlign: 'center',
                    background: attendanceMessage.startsWith('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${attendanceMessage.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)'}`,
                    color: attendanceMessage.startsWith('✅') ? 'var(--color-success)' : 'var(--color-danger)',
                    fontWeight: 600
                  }}>
                    {attendanceMessage}
                  </div>
                )}
              </form>
            </div>

            <div className="glass-panel scan-animation" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ border: '3px dashed var(--border-glass)', borderRadius: '12px', width: '220px', height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '4rem' }}>📷</span>
                <span style={{ fontSize: '0.8rem', marginTop: '12px' }}>Camera Scanner Feed Active</span>
              </div>
              <span style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Methods supported: Code128, QR Codes, and Face Recognition algorithms
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            MALPRACTICE MONITOR TAB
            ======================================================== */}
        {activeTab === 'malpractice' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              
              {/* Webcam Feed Mockup */}
              <div className="glass-panel" style={{ padding: '24px', background: '#000', border: '1px solid var(--border-glass-active)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '380px' }}>
                {/* Detected phone bounding box simulation */}
                <div style={{
                  position: 'absolute',
                  top: '120px',
                  left: '180px',
                  width: '90px',
                  height: '140px',
                  border: '3px solid var(--color-danger)',
                  boxShadow: '0 0 10px var(--color-danger)',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '4px',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)'
                }}>
                  <span>Cell Phone</span>
                  <span>95% conf</span>
                </div>

                <div style={{
                  position: 'absolute',
                  top: '40px',
                  left: '140px',
                  width: '320px',
                  height: '280px',
                  border: '2px solid var(--color-success)',
                  zIndex: 1,
                  display: 'flex',
                  justifyContent: 'flex-start',
                  padding: '4px',
                  color: '#fff',
                  fontSize: '0.75rem'
                }}>
                  <span>Person</span>
                </div>

                <span style={{ fontSize: '4rem', zIndex: 0, opacity: 0.15 }}>🎥</span>
                <p style={{ zIndex: 0, opacity: 0.5, marginTop: '12px' }}>Live AI Exam Feed Simulation Running</p>
                <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--color-danger)', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', animation: 'pulse-glow 2s infinite' }}>
                  🔴 LIVE FEED (YOLOv8 Active)
                </div>
              </div>

              {/* Malpractice Metrics Panel */}
              <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3>Integrity Analysis</h3>
                
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', borderRadius: '8px', padding: '16px' }}>
                  <h4 style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚨 HIGH RISK RISK DETECTED
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Classroom camera CS-02 flagged mobile phone usage. Incident logged at 11:05 AM.
                  </p>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI Risk Evaluation Score</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <div style={{ flex: 1, height: '12px', background: 'hsla(0,0%,100%,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ width: '88%', height: '100%', background: 'var(--color-danger)' }}></div>
                    </div>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-danger)' }}>88%</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: 'auto' }}>
                  <button className="glass-button" style={{ width: '100%', justifyContent: 'center' }}>
                    Send Immediate Proctor Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Event logs table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Malpractice Incident Log</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px' }}>Student</th>
                    <th style={{ padding: '12px' }}>Roll Number</th>
                    <th style={{ padding: '12px' }}>Incident Type</th>
                    <th style={{ padding: '12px' }}>AI Confidence</th>
                    <th style={{ padding: '12px' }}>Time</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {malpracticeLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{log.studentName}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{log.rollNumber}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: log.incidentType === 'MOBILE_PHONE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: log.incidentType === 'MOBILE_PHONE' ? 'var(--color-danger)' : 'var(--color-warning)',
                        }}>
                          {log.incidentType}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.confidence}%</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ color: log.status === 'PENDING' ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            PLAGIARISM CHECK TAB
            ======================================================== */}
        {activeTab === 'plagiarism' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '20px' }}>Semantic Plagiarism Evaluator</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Document A (Original / Reference Text)</label>
                  <textarea 
                    className="glass-input" 
                    style={{ height: '220px', resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                    placeholder="Paste student submission or reference material here..."
                    value={docA}
                    onChange={e => setDocA(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Document B (Target Submission)</label>
                  <textarea 
                    className="glass-input" 
                    style={{ height: '220px', resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                    placeholder="Paste submission to verify comparison against..."
                    value={docB}
                    onChange={e => setDocB(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Uses TF-IDF Tokenizer vectorization and cosine similarity calculations.
                </span>
                <button 
                  onClick={handlePlagiarismCheck} 
                  className="glass-button" 
                  disabled={checkingPlag || !docA || !docB}
                >
                  {checkingPlag ? 'Analyzing Documents...' : 'Run Similarity Match'}
                </button>
              </div>
            </div>

            {plagResult && (
              <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-glass)', paddingRight: '30px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Similarity Index</span>
                  <h2 style={{
                    fontSize: '3.5rem',
                    color: plagResult.similarity > 50 ? 'var(--color-danger)' : plagResult.similarity > 20 ? 'var(--color-warning)' : 'var(--color-success)'
                  }}>
                    {plagResult.similarity}%
                  </h2>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    background: plagResult.similarity > 50 ? 'rgba(239, 68, 68, 0.15)' : plagResult.similarity > 20 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                    color: plagResult.similarity > 50 ? 'var(--color-danger)' : plagResult.similarity > 20 ? 'var(--color-warning)' : 'var(--color-success)'
                  }}>
                    {plagResult.status}
                  </span>
                </div>

                <div>
                  <h4 style={{ marginBottom: '12px' }}>Structural Analysis Insights</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '20px' }}>
                    <li>Matches found in word order vector distributions.</li>
                    <li>{plagResult.similarity > 50 ? 'High probability of verbatim copy-paste operations.' : 'Acceptable level of shared standard academic terminology.'}</li>
                    <li>Recommended action: {plagResult.similarity > 50 ? 'Flag for manual instructor evaluation.' : 'Approve assignment score.'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SESSIONS TAB
            ======================================================== */}
        {activeTab === 'sessions' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            {/* Create Session Form */}
            <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '20px' }}>Schedule Active Class Session</h3>
              <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Subject / Course Title</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="e.g. Distributed Databases" 
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ color: 'var(--text-secondary)' }}>Enable Security Features</label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useGPS} 
                      onChange={e => setUseGPS(e.target.checked)} 
                    />
                    GPS Geofencing Lockout
                  </label>

                  {useGPS && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Geofence Radius (meters)</label>
                      <input 
                        type="number" 
                        className="glass-input" 
                        value={geofenceRadius}
                        onChange={e => setGeofenceRadius(e.target.value)}
                        style={{ padding: '8px 12px' }}
                      />
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useQR} 
                      onChange={e => setUseQR(e.target.checked)} 
                    />
                    Dynamic Rotating QR Verification
                  </label>
                </div>

                <button type="submit" className="glass-button" style={{ justifyContent: 'center', marginTop: '10px' }}>
                  Schedule & Open Attendance
                </button>
              </form>
            </div>

            {/* List Active Sessions */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Active Class Session Registry</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeSessions.map(session => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'hsla(0,0%,100%,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-primary)' }}>{session.subject}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduled: {session.date}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{session.present} / {session.enrolled} Present</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {Math.round((session.present / session.enrolled) * 100)}% attendance rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SETTINGS TAB
            ======================================================== */}
        {activeTab === 'settings' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Portal Settings & Integrations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>FastAPI AI Service Base URL</label>
                <input type="text" className="glass-input" defaultValue="http://localhost:8000" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>OpenAI / Gemini API Key Config</label>
                <input type="password" className="glass-input" defaultValue="sk-**********************" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Twilio Notification Alerts (SMS)</label>
                <select className="glass-input" style={{ background: 'var(--bg-base)' }}>
                  <option>Enabled (Real-time parent logs)</option>
                  <option>Disabled (Local dashboards only)</option>
                </select>
              </div>

              <button className="glass-button" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                Save Configurations
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
