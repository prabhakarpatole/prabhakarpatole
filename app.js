const DATA_PATH = 'data.json'

const levelDefs = {
  1: 'Level 1: Awareness – Engineers know about code assistants but rarely use them.',
  2: 'Level 2: Initial Adoption – Occasional use for simple tasks.',
  3: 'Level 3: Integrated Usage – Regular use for complex tasks, documented best practices.',
  4: 'Level 4: Optimization & Innovation – Advanced usage, continuous improvement.'
}

async function loadData(){
  const resp = await fetch(DATA_PATH)
  return resp.json()
}

function formatUsage(metrics){
  return `Accepted: ${metrics.suggestionsAccepted}, Time Saved: ${metrics.timeSavedHours}h`;
}

function computeSummary(engineers){
  const total = engineers.length
  const counts = {1:0,2:0,3:0,4:0}
  engineers.forEach(e => { counts[e.currentLevel] = (counts[e.currentLevel]||0) + 1 })
  const pct = {1:0,2:0,3:0,4:0}
  for(let i=1;i<=4;i++) pct[i] = total? Math.round((counts[i]/total)*100):0
  return {total,counts,pct}
}

function renderTable(engineers){
  const tbody = document.querySelector('#engineersTable tbody')
  tbody.innerHTML = ''
  engineers.forEach(e =>{
    const tr = document.createElement('tr')
    tr.classList.add(`level-${e.currentLevel}`)
    const progressPct = e.targetLevel ? Math.round(Math.min(e.currentLevel / e.targetLevel, 1) * 100) : 0

    tr.innerHTML = `
      <td>${e.project}</td>
      <td>${e.name}</td>
      <td>${e.currentLevel}</td>
      <td>${levelDefs[e.currentLevel] || ''}</td>
      <td>${formatUsage(e.usageMetrics)}</td>
      <td>${e.trainingCompleted ? 'Yes' : 'No'}</td>
      <td>${e.nextAction || ''}</td>
      <td>${e.targetLevel}</td>
      <td>${e.timeline || ''}</td>
      <td>
        <div class="progress-bar" title="${progressPct}%">
          <span class="progress-fill" style="width:${progressPct}%"></span>
        </div>
        <div style="font-size:11px;margin-top:4px">${progressPct}%</div>
      </td>
    `
    tbody.appendChild(tr)
  })
}

function renderDashboard(summary){
  for(let i=1;i<=4;i++){
    const el = document.querySelector(`#card-level-${i} .val`)
    if(el) el.textContent = `${summary.pct[i]}%`;
  }
  const pending = document.querySelector('#card-pending .val')
  pending.textContent = document.querySelectorAll('#engineersTable tbody tr td:nth-child(7)').length
}

function renderPending(engineers){
  const list = document.getElementById('pendingList')
  list.innerHTML = ''
  const pending = engineers.filter(e => e.nextAction && e.nextAction.trim() !== '')
  pending.forEach(p =>{
    const li = document.createElement('li')
    li.textContent = `${p.name} (${p.project}) — ${p.nextAction} — Target: L${p.targetLevel} by ${p.timeline || 'TBD'}`
    list.appendChild(li)
  })
}

function drawTrend(history){
  const canvas = document.getElementById('trendCanvas')
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  ctx.clearRect(0,0,w,h)

  // Build series for each level
  const labels = history.map(s => s.date)
  const series = {1:[],2:[],3:[],4:[]}
  history.forEach(s =>{
    for(let i=1;i<=4;i++) series[i].push(s.counts[i] || 0)
  })

  // scale
  const maxVal = Math.max(...Object.values(series).flat(),1)
  const margin = 30
  const plotW = w - margin*2
  const plotH = h - margin*2

  // axes
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(margin,margin); ctx.lineTo(margin,margin+plotH); ctx.lineTo(margin+plotW,margin+plotH); ctx.stroke()

  const colors = {1:'#ef4444',2:'#f59e0b',3:'#10b981',4:'#6366f1'}
  for(let i=1;i<=4;i++){
    ctx.beginPath()
    ctx.strokeStyle = colors[i]
    ctx.lineWidth = 2
    series[i].forEach((v,idx)=>{
      const x = margin + (idx/(labels.length-1 || 1))*plotW
      const y = margin + plotH - (v/maxVal)*plotH
      if(idx===0) ctx.moveTo(x,y)
      else ctx.lineTo(x,y)
    })
    ctx.stroke()
  }

  // labels
  ctx.fillStyle = '#333'
  ctx.font = '11px sans-serif'
  labels.forEach((lab,idx)=>{
    const x = margin + (idx/(labels.length-1 || 1))*plotW
    ctx.fillText(lab, x-14, margin+plotH+16)
  })
}

async function init(){
  const data = await loadData()
  const engineers = data.engineers || []
  renderTable(engineers)
  const summary = computeSummary(engineers)
  renderDashboard(summary)
  renderPending(engineers)
  drawTrend(data.history || [])
}

document.addEventListener('DOMContentLoaded', init)
