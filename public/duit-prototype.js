const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  activity: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  split: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
  camera: '<path d="M3 8V6a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v2M3 16v2a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-2"/><circle cx="12" cy="12" r="3"/>',
  receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  warning: '<path d="m12 3 10 18H2L12 3zM12 9v5M12 18h.01"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  chart: '<path d="M4 20V12M10 20V5M16 20v-9M22 20V7"/>',
  spark: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  badge: '<path d="M12 2 20 6v8l-8 8-8-8V6zM9 12l2 2 4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
  settings: '<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
}

const icon = (name, large = false) => `<svg class="icon${large ? ' icon-lg' : ''}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.info}</svg>`
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const money = amount => Number(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const amount = (value, hero = false) => {
  const [whole, cents] = money(value).split('.')
  return hero
    ? `<div class="hero-amount"><span class="currency">RM</span>${whole}<span class="cents">.${cents}</span></div>`
    : `<span class="row-amount"><span class="rm">RM</span> ${whole}.${cents}</span>`
}

const categoryStyle = {
  Groceries: ['#e4ede7', '#2f5e45', '#4c8466'],
  Shopping: ['#f2e6ea', '#7a3a50', '#a0566e'],
  Food: ['#f6e8da', '#8a4e17', '#c9772e'],
  Transport: ['#e3eaf2', '#2f527a', '#3f6c98'],
  Bills: ['#eae7f2', '#4f4778', '#7468a0'],
  Fun: ['#f1ecd8', '#6b5a1a', '#a88f2e'],
  Other: ['#efece5', '#57534c', '#b5afa4'],
}
const initialTransactions = [
  { id: 'vg', merchant: 'Village Grocer', initials: 'VG', category: 'Groceries', day: 'Today · 2 Nov', time: '6:42 pm', amount: 142.30, source: 'Maybank debit', note: '' },
  { id: 'sh', merchant: 'Shopee', initials: 'S', category: 'Shopping', day: 'Sun · 1 Nov', time: '11:48 pm', amount: 389.00, source: 'Maybank Visa', note: '', unusual: true },
  { id: 'km', merchant: 'Kedai Makan Ah Seng', initials: 'KM', category: 'Food', day: 'Sun · 1 Nov', time: '1:15 pm', amount: 18.50, source: "Touch 'n Go eWallet", note: '', suggested: true },
  { id: 'gr', merchant: 'Grab', initials: 'G', category: 'Transport', day: 'Sun · 1 Nov', time: '9:02 am', amount: 23.00, source: "Touch 'n Go eWallet", note: '' },
  { id: 'hk', merchant: 'Hakka Kitchen', initials: 'HK', category: 'Food', day: 'Sat · 31 Oct', time: '8:10 pm', amount: 286.40, source: 'Maybank Visa', note: 'Split with 4 friends' },
  { id: 'tl', merchant: 'Tealive', initials: 'T', category: 'Food', day: 'Sat · 31 Oct', time: '4:30 pm', amount: 9.90, source: "Touch 'n Go eWallet", note: '' },
  { id: 'pt', merchant: 'Petronas', initials: 'P', category: 'Transport', day: 'Sat · 31 Oct', time: '10:20 am', amount: 60.00, source: 'Maybank debit', note: '' },
  { id: 'nf', merchant: 'Netflix', initials: 'N', category: 'Fun', day: 'Fri · 30 Oct', time: '9:00 am', amount: 55.00, source: 'Maybank Visa', note: '' },
]
const billItems = [
  { id: 'noodles', name: 'Dry chilli noodles', price: 18.90 },
  { id: 'rice', name: 'Chicken rice', price: 16.50 },
  { id: 'tofu', name: 'Crispy tofu', price: 12.00 },
  { id: 'drink', name: 'Iced lemon tea', price: 6.90 },
]
const participants = [
  { id: 'you', name: 'You', initials: 'YT', total: 52.10, state: 'Confirmed', items: '3 items' },
  { id: 'aisyah', name: 'Aisyah', initials: 'A', total: 61.40, state: 'Confirmed', items: '4 items' },
  { id: 'mei', name: 'Mei Ling', initials: 'ML', total: 50.10, state: 'Confirmed', items: '3 items' },
  { id: 'jun', name: 'Jun Wei', initials: 'JW', total: 58.40, state: 'Waiting', items: '3 items' },
  { id: 'arjun', name: 'Arjun', initials: 'AR', total: 64.40, state: 'Marked paid', items: '4 items' },
]

const state = {
  view: location.hash.slice(1) || 'home',
  sheet: null,
  toast: null,
  transactions: structuredClone(initialTransactions),
  selectedTransaction: 'sh',
  filter: 'All',
  query: '',
  categoryFilter: 'All',
  editField: '',
  editDraft: '',
  receipt: { merchant: 'Jaya Grocer', date: '2026-11-02', amount: '82.61', category: 'Groceries', itemName: 'Household items', itemChecked: false },
  readStep: 0,
  xp: 1280,
  weekReviewed: false,
  challengeStarted: true,
  challengeSteps: 2,
  participant: 'arjun',
  guestName: '',
  guestStage: 'join',
  guestSelected: new Set(),
  guestPaid: false,
  onboardingStep: 0,
  authMode: 'login',
}

const root = document.getElementById('app')
const roots = ['home', 'activity', 'splits', 'progress']
const isRoot = () => roots.includes(state.view)
const selectedTx = () => state.transactions.find(item => item.id === state.selectedTransaction) || state.transactions[0]
const avatar = (initials, category, round = false) => {
  const [background, color] = categoryStyle[category] || categoryStyle.Other
  return `<span class="avatar${round ? ' round' : ''}" style="background:${background};color:${color}">${esc(initials)}</span>`
}
const statusTag = (label, tone) => `<span class="status ${tone}">${esc(label)}</span>`
const topbar = (title, back = 'home', right = '') => `<header class="topbar"><button type="button" class="icon-button" aria-label="Back" data-action="go" data-view="${back}">${icon('back', true)}</button><h1>${esc(title)}</h1>${right || '<span></span>'}</header>`
const sectionHeading = (title, action = '', view = '') => `<div class="section-heading"><h2>${esc(title)}</h2>${action ? `<button type="button" class="text-link" data-action="go" data-view="${view}">${esc(action)} →</button>` : ''}</div>`
const transactionRow = tx => `<button type="button" class="list-row" data-action="transaction" data-id="${esc(tx.id)}" aria-label="${esc(tx.merchant)}, ${money(tx.amount)} ringgit, ${esc(tx.category)}${tx.unusual ? ', unusual for you' : ''}">
  ${avatar(tx.initials, tx.category)}<span class="row-main"><strong>${esc(tx.merchant)}</strong><small>${tx.unusual ? 'Unusual for you' : tx.suggested ? 'Suggested: ' + esc(tx.category) + ' · tap to confirm' : esc(tx.category) + ' · ' + esc(tx.time)}</small></span>${amount(tx.amount)}</button>`
const bottomNav = () => `<nav class="mobile-nav" aria-label="Main navigation">
  ${navItem('home', 'Home', 'home')}${navItem('activity', 'Activity', 'activity')}
  <button type="button" class="nav-item nav-add" data-action="sheet" data-sheet="add" aria-label="Add expense, scan, or split">${icon('plus', true)}</button>
  ${navItem('splits', 'Split', 'split', participants.filter(person => person.state !== 'Confirmed' && person.id !== 'you').length)}${navItem('progress', 'You', 'person')}</nav>`
const navItem = (view, label, symbol, badge = 0) => `<button type="button" class="nav-item${state.view === view ? ' active' : ''}" data-action="go" data-view="${view}" ${state.view === view ? 'aria-current="page"' : ''}>${icon(symbol, true)}<span>${label}</span>${badge ? `<span class="nav-badge">${badge}</span>` : ''}</button>`
const desktopNav = () => `<aside class="desktop-sidebar"><div class="brand-logo">du<span class="dot">ı</span>t</div><button type="button" class="button primary" data-action="sheet" data-sheet="add">${icon('plus')} Add spending</button><nav aria-label="Main navigation">
  ${[['home','Home','home'],['activity','Activity','activity'],['splits','Split','split'],['progress','You','person']].map(([view,label,symbol]) => `<button type="button" class="desktop-nav-item${state.view === view ? ' active' : ''}" data-action="go" data-view="${view}">${icon(symbol)} ${label}</button>`).join('')}
  </nav><small>Interactive design prototype<br>Sample values only · no account changes</small></aside>`

function spendingSummary() {
  const totals = { Food: 420, Shopping: 389, Groceries: 250, Transport: 180, Fun: 55, Other: 92.40 }
  for (const original of initialTransactions) {
    const current = state.transactions.find(tx => tx.id === original.id)
    if (!current) continue
    totals[original.category] -= original.amount
    totals[current.category] = (totals[current.category] || 0) + current.amount
  }
  for (const tx of state.transactions.filter(item => !initialTransactions.some(original => original.id === item.id))) {
    totals[tx.category] = (totals[tx.category] || 0) + tx.amount
  }
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)
  const categories = ['Food', 'Shopping', 'Groceries', 'Transport'].map(name => ({ name, value: totals[name] || 0 }))
  categories.push({ name: 'Other', value: total - categories.reduce((sum, item) => sum + item.value, 0) })
  return { total, comparedWithLastCycle: total - 1290.40, categories }
}

function home() {
  const review = state.transactions.find(tx => tx.unusual || tx.suggested)
  const spending = spendingSummary()
  const pending = participants.filter(person => person.state !== 'Confirmed' && person.id !== 'you').length
  return `<div class="screen"><header class="page-head"><div><h1>November</h1><div class="subline">25 Oct – 24 Nov · day 9 of 31</div></div><button type="button" class="icon-button" aria-label="Notifications, 2 new" data-action="go" data-view="notifications">${icon('bell', true)}</button></header>
    <div class="home-grid"><div><section class="summary" aria-labelledby="spent-title"><div class="eyebrow" id="spent-title">Spent so far · recorded in Duit</div>${amount(spending.total, true)}<div class="comparison">RM ${money(Math.abs(spending.comparedWithLastCycle))} ${spending.comparedWithLastCycle >= 0 ? 'more' : 'less'} than this point last cycle</div>
      <div class="category-bar" role="img" aria-label="${spending.categories.map(item=>`${item.name} ${Math.round(item.value/spending.total*100)}%`).join(', ')}">${spending.categories.map(item=>`<span style="width:${Math.max(0,item.value/spending.total*100)}%;background:${categoryStyle[item.name][2]}"></span>`).join('')}</div>
      <div class="category-legend">${spending.categories.slice(0,4).map(item => `<span class="legend-item"><i class="legend-dot" style="background:${categoryStyle[item.name][2]}"></i>${item.name}<b>${Math.round(item.value/spending.total*100)}%</b></span>`).join('')}</div></section>
      <section class="section">${sectionHeading('Needs a look', 'See all', 'activity')}${review ? `<div class="attention" style="${review.suggested ? 'background:#e2ecf5;border-color:#cbdde8' : ''}"><div class="attention-top" style="${review.suggested ? 'color:#2d5b85' : ''}">${icon(review.unusual?'warning':'info')} ${review.unusual ? 'Unusual for you' : 'Suggested category'}</div><p>${review.unusual ? `${esc(review.merchant)} was about 4× your usual purchase there.` : `${esc(review.merchant)} looks like ${esc(review.category)}. Check the suggestion.`}</p><button type="button" data-action="transaction" data-id="${esc(review.id)}">Review this →</button></div>` : '<p class="quiet-note">All caught up. Nothing needs your attention today.</p>'}</section>
      <section class="section">${sectionHeading('This week', 'Open review', 'insights')}<div class="insight"><span class="eyebrow">A useful pattern</span><p>You spent RM 84 more on eating out than a usual week.</p><small>Mostly dinners · compared with your last 8 weeks</small></div></section></div>
      <div><section class="section">${sectionHeading('Coming up', 'Open split', 'bill')}<div class="list-group"><button class="list-row" data-action="go" data-view="bill" type="button">${avatar('HK','Food')}<span class="row-main"><strong>Hakka Kitchen split</strong><small>${pending ? `${pending} ${pending===1?'person':'people'} still to settle` : 'Everyone settled'}</small></span>${icon('chevron')}</button></div></section>
      <section class="section">${sectionHeading('Recent activity', 'See all', 'activity')}<div class="list-group">${state.transactions.slice(0,3).map(transactionRow).join('')}</div></section>
      <section class="section"><button type="button" class="list-row" style="padding:0;min-height:44px" data-action="go" data-view="progress"><span class="row-main"><strong>Level 4 · Planner</strong><small>${state.xp.toLocaleString()} / 1,500 XP</small></span>${icon('chevron')}</button><div class="progress-track" aria-label="Progress to Level 5"><span style="width:${Math.min(100, state.xp / 1500 * 100)}%"></span></div></section></div></div><p class="prototype-note">Prototype sample data. Comparisons and progress require future server contracts.</p></div>`
}

function activity() {
  const filtered = state.transactions.filter(tx => {
    const text = `${tx.merchant} ${tx.category} ${tx.source} ${money(tx.amount)}`.toLowerCase()
    return text.includes(state.query.toLowerCase()) && (state.filter !== 'To review' || tx.unusual || tx.suggested) && (state.categoryFilter === 'All' || tx.category === state.categoryFilter)
  })
  const days = [...new Set(filtered.map(tx => tx.day))]
  return `<div class="screen"><header class="page-head"><div><h1>Activity</h1><div class="subline">Your recorded spending, in order</div></div><button type="button" class="icon-button" aria-label="Add spending" data-action="sheet" data-sheet="add">${icon('plus', true)}</button></header>
    <label class="field-label" for="activity-search">Search activity</label><div class="search">${icon('search')}<input id="activity-search" type="search" data-model="query" value="${esc(state.query)}" placeholder="Merchant, category or amount" autocomplete="off"></div>
    <div class="chip-scroll" aria-label="Activity filters"><button type="button" class="chip${state.filter === 'All' ? ' active' : ''}" data-action="filter" data-filter="All" aria-pressed="${state.filter === 'All'}">All</button><button type="button" class="chip${state.filter === 'To review' ? ' active' : ''}" data-action="filter" data-filter="To review" aria-pressed="${state.filter === 'To review'}">To review · ${state.transactions.filter(tx=>tx.unusual||tx.suggested).length}</button><button type="button" class="chip${state.categoryFilter !== 'All' ? ' active' : ''}" data-action="sheet" data-sheet="filter-category">${state.categoryFilter === 'All' ? 'Category' : esc(state.categoryFilter)} ${icon('filter')}</button></div>
    ${filtered.length ? days.map(day => `<section><div class="day-heading"><span>${esc(day)}</span><small>RM ${money(filtered.filter(tx => tx.day === day).reduce((sum,tx)=>sum+tx.amount,0))}</small></div><div class="list-group">${filtered.filter(tx => tx.day === day).map(transactionRow).join('')}</div></section>`).join('') : `<div class="empty-state">${icon('search')}<h2>No matching activity</h2><p>Try another merchant or clear the current filters.</p><button type="button" class="button secondary" data-action="clear-filters">Clear filters</button></div>`}
    <p class="prototype-note">Search and filters apply to this prototype's sample records. The live app uses server-backed cursor pagination.</p></div>`
}

function detail() {
  const tx = selectedTx()
  return `<div class="screen focused">${topbar('Transaction', 'activity', `<button class="icon-button" type="button" aria-label="Edit transaction" data-action="edit" data-field="merchant">${icon('edit')}</button>`)}
    <div class="detail-hero">${avatar(tx.initials, tx.category)}<h2>${esc(tx.merchant)}</h2>${amount(tx.amount,true)}<div class="period">${esc(tx.day)} · ${esc(tx.time)}</div></div>
    ${tx.unusual ? `<section class="section attention"><div class="attention-top">${icon('warning')} Unusual for you</div><p>This is about 4× what you usually spend at ${esc(tx.merchant)}, and later than your usual purchases there.</p><button type="button" data-action="sheet" data-sheet="resolve">Choose what happened →</button></section>` : ''}
    ${tx.suggested ? `<section class="section attention" style="background:#e2ecf5;border-color:#cbdde8"><div class="attention-top" style="color:#2d5b85">${icon('info')} Suggested category</div><p>Food fits similar purchases. Check it before you save this category.</p><button type="button" data-action="confirm-category">Confirm Food →</button></section>` : ''}
    <section class="section">${sectionHeading('Details')}<div class="detail-list"><button type="button" class="detail-line" data-action="sheet" data-sheet="category"><span>Category</span><strong>${esc(tx.category)} ${icon('chevron')}</strong></button><div class="detail-line"><span>Account</span><strong>${esc(tx.source)}</strong></div><div class="detail-line"><span>Date</span><strong>${esc(tx.day)}</strong></div><button type="button" class="detail-line" data-action="edit" data-field="note"><span>Note</span><strong>${esc(tx.note || 'Add a note')} ${icon('chevron')}</strong></button></div></section>
    <div class="button-row"><button type="button" class="button secondary" data-action="edit" data-field="amount">Edit amount</button><button type="button" class="button secondary" data-action="go" data-view="bill">Split this</button></div><p class="prototype-note">Changes here affect sample data in this browser only.</p></div>`
}

function scan() {
  return `<div class="screen focused">${topbar('Scan receipt','home')}<h2 class="page-title">Fit the full receipt in view</h2><p class="quiet-note">Keep the text sharp and the edges visible. You can check everything before saving.</p>
    <div class="camera-stage" aria-label="Illustrative camera preview"><div class="receipt-paper"><strong>JAYA GROCER</strong><hr>Milk &nbsp; 12.90<br>Fruit &nbsp; 18.50<br>Household &nbsp; 51.21<hr><strong>TOTAL &nbsp; 82.61</strong></div></div>
    <p class="camera-hint">Prototype camera preview · no photo is uploaded</p><div class="button-row"><button type="button" class="button secondary" data-action="start-processing">Choose image</button><button type="button" class="button primary" data-action="start-processing">Use demo receipt</button></div></div>`
}

function processing() {
  const steps = ['Reading receipt','Finding items','Preparing your review']
  return `<div class="screen no-nav">${topbar('Reading receipt','scan')}<div class="processing"><div class="loader" aria-hidden="true"></div><h2>Reading your receipt</h2><p class="quiet-note">You'll review the details before anything is saved.</p><div class="processing-list">${steps.map((step,index)=>`<p class="${index < state.readStep ? 'done' : index === state.readStep ? 'active' : ''}">${icon(index < state.readStep ? 'check' : 'receipt')} ${step}</p>`).join('')}</div></div></div>`
}

function review() {
  const r = state.receipt
  const difference = Number(r.amount) - 82.61
  return `<div class="screen focused">${topbar('Review receipt','scan')}<div class="eyebrow">Please check before saving</div><h2 class="page-title" style="margin:6px 0 8px">Did we read this correctly?</h2><p class="quiet-note" style="margin-bottom:24px">Tap a field to correct it. The item total should match the receipt.</p>
    <label class="field"><span class="field-label">Merchant</span><input class="field-control" data-receipt="merchant" value="${esc(r.merchant)}" autocomplete="off"></label>
    <div class="two-col"><label class="field"><span class="field-label">Date</span><input class="field-control" type="date" data-receipt="date" value="${esc(r.date)}"></label><label class="field"><span class="field-label">Total · RM</span><input class="field-control" type="text" inputmode="decimal" data-receipt="amount" value="${esc(r.amount)}"></label></div>
    <button type="button" class="detail-line" data-action="sheet" data-sheet="receipt-category"><span>Category</span><strong>${esc(r.category)} ${icon('chevron')}</strong></button>
    <section class="section" style="margin-top:24px">${sectionHeading('Items')}<div class="receipt-list"><div class="receipt-line"><span>1×</span><span>Fresh milk</span><strong>12.90</strong></div><div class="receipt-line"><span>2×</span><span>Fruit & vegetables</span><strong>18.50</strong></div><button class="receipt-line receipt-edit" type="button" data-action="sheet" data-sheet="receipt-item"><span>1×</span><span>${esc(r.itemName)} <small class="check">${r.itemChecked ? 'Checked' : 'Check'}</small></span><strong>51.21</strong></button></div><p class="quiet-note">${r.itemChecked ? 'Item name checked against the receipt.' : 'One item name needs a look. Tap the row to check it.'}</p>${Math.abs(difference)>0.005 ? `<p class="field-error" role="alert">The total differs from the item sum by RM ${money(Math.abs(difference))}. Check the amount before saving.</p>` : ''}</section>
    <div class="sticky-action no-nav"><button type="button" class="button primary" data-action="save-receipt">Save expense</button><button type="button" class="button tertiary" data-action="save-receipt-split">Split this bill instead</button></div></div>`
}

function splits() {
  const pending = participants.filter(person => person.state !== 'Confirmed' && person.id !== 'you').length
  return `<div class="screen"><header class="page-head"><div><h1>Split</h1><div class="subline">Shared bills you are managing</div></div><button type="button" class="icon-button" aria-label="Create split" data-action="sheet" data-sheet="add">${icon('plus',true)}</button></header>
    <section class="section">${sectionHeading('Waiting on people')}<div class="list-group"><button type="button" class="list-row" data-action="go" data-view="bill">${avatar('HK','Food')}<span class="row-main"><strong>Hakka Kitchen</strong><small>${pending} of 5 people still to settle · Sun, 1 Nov</small></span>${icon('chevron')}</button></div></section>
    <section class="section">${sectionHeading('Settled')}<div class="list-group"><div class="list-row">${avatar('G','Transport')}<span class="row-main"><strong>Grab ride home</strong><small>Everyone paid · 28 Oct</small></span>${statusTag('Done','paid')}</div></div></section>
    <div class="empty-state" style="padding-top:8px">${icon('receipt')}<h2>Next meal together?</h2><p>Scan the receipt and let everyone choose their items without creating an account.</p><button class="button secondary" type="button" data-action="go" data-view="scan">Scan a receipt</button></div></div>`
}

function bill() {
  const settled = participants.filter(person => person.state === 'Confirmed').length
  const toCollect = participants.filter(person => person.state !== 'Confirmed').reduce((sum, person) => sum + person.total, 0)
  return `<div class="screen focused">${topbar('Hakka Kitchen','splits',`<button type="button" class="icon-button" aria-label="Invite people" data-action="sheet" data-sheet="invite">${icon('share')}</button>`)}
    <div class="eyebrow">Shared bill · Sun, 1 Nov</div>${amount(286.40,true)}<div class="comparison">RM ${money(toCollect)} still to collect</div><div class="bill-progress" aria-label="${settled} of 5 people confirmed">${participants.map((person)=>`<span class="${person.state === 'Confirmed' ? 'done' : ''}"></span>`).join('')}</div><p class="quiet-note">${settled} of 5 people confirmed · tax and service shared by item value</p>
    <section class="section" style="margin-top:32px">${sectionHeading('People')}<div class="list-group">${participants.map(person=>`<button type="button" class="list-row" data-action="participant" data-id="${person.id}">${avatar(person.initials,'Other',true)}<span class="row-main"><strong>${esc(person.name)}</strong><small>${esc(person.items)} · ${esc(person.state)}</small></span>${amount(person.total)}</button>`).join('')}</div></section>
    <section class="section">${sectionHeading('Receipt items')}<div class="receipt-list">${billItems.map(item=>`<div class="receipt-line"><span>1×</span><span>${esc(item.name)}</span><strong>RM ${money(item.price)}</strong></div>`).join('')}</div><p class="quiet-note">The sample shows selected lines. The real bill total also includes other receipt items and charges.</p></section>
    <div class="sticky-action no-nav"><button type="button" class="button primary" data-action="sheet" data-sheet="invite">${icon('share')} Share link</button></div></div>`
}

function guest() {
  const subtotal = billItems.filter(item => state.guestSelected.has(item.id)).reduce((sum,item)=>sum+item.price,0)
  const tax = Math.round(subtotal*.06*100)/100
  const service = Math.round(subtotal*.1*100)/100
  const total = subtotal+tax+service
  let content = ''
  if (state.guestStage === 'join') content = `<h2 class="page-title">Join this split</h2><p class="quiet-note" style="margin-bottom:24px">No Duit account needed. Your name helps the organiser recognise you.</p><label class="field"><span class="field-label">Your name</span><input class="field-control" id="guest-name" data-model="guestName" value="${esc(state.guestName)}" placeholder="e.g. Aisyah" autocomplete="name" maxlength="60"></label><button type="button" class="button primary" data-action="guest-join">Continue</button>`
  if (state.guestStage === 'select') content = `<h2 class="page-title">Choose your items</h2><p class="quiet-note" style="margin-bottom:20px">Tap everything you had. You'll review your share before saving.</p><div class="list-group">${billItems.map(item=>`<button type="button" class="list-row" data-action="guest-toggle" data-id="${item.id}" aria-pressed="${state.guestSelected.has(item.id)}"><span class="item-check${state.guestSelected.has(item.id) ? ' checked' : ''}">${state.guestSelected.has(item.id) ? icon('check') : ''}</span><span class="row-main"><strong>${esc(item.name)}</strong></span>${amount(item.price)}</button>`).join('')}</div><p class="quiet-note">Tax and service charge are added in proportion to the items you choose.</p><div class="sticky-action no-nav"><button type="button" class="button primary" data-action="guest-next" ${!state.guestSelected.size ? 'disabled' : ''}>Review my share · RM ${money(total)}</button></div>`
  if (state.guestStage === 'summary') content = `<h2 class="page-title">Your share</h2><p class="quiet-note" style="margin-bottom:22px">Check the breakdown before saving your choices.</p><div class="detail-list"><div class="detail-line"><span>Selected items</span><strong>RM ${money(subtotal)}</strong></div><div class="detail-line"><span>Tax · 6%</span><strong>RM ${money(tax)}</strong></div><div class="detail-line"><span>Service · 10%</span><strong>RM ${money(service)}</strong></div><div class="summary-total"><span>Total</span><span>RM ${money(total)}</span></div></div><button type="button" class="text-link" data-action="guest-back-select" style="margin-top:12px">Change items</button><div class="sticky-action no-nav"><button type="button" class="button primary" data-action="guest-save">Save my choices</button></div>`
  if (state.guestStage === 'payment') content = `<h2 class="page-title">Pay the organiser</h2><p class="quiet-note">Your share is RM ${money(total)}. Use the payment details the organiser provided, then mark this split as paid.</p><div class="qr-preview">Owner's bank-provided payment QR image appears here</div><div class="attention" style="background:#e2eeea;border-color:#c8ded5"><div class="attention-top" style="color:#0e5a52">${icon('info')} Payment happens outside Duit</div><p>Duit only shows the owner's image. It cannot verify a transfer. The organiser will confirm your payment.</p></div><div class="sticky-action no-nav"><button type="button" class="button primary" data-action="guest-paid">I've paid the organiser</button></div>`
  if (state.guestStage === 'done') content = `<div class="empty-state">${icon('check')}<h2>Marked as paid</h2><p>The organiser can now confirm your payment. Duit has not processed or verified a transfer.</p><button type="button" class="button secondary" data-action="guest-reset">Review my choices</button></div>`
  return `<div class="screen no-nav">${state.guestStage !== 'join' ? topbar('Hakka Kitchen split','splits') : ''}<div class="guest-banner"><div class="brand-logo">du<span class="dot">ı</span>t</div><h1>Hakka Kitchen</h1><div>Shared by Wai · Sun, 1 Nov · RM 286.40 total</div></div>${content}<p class="prototype-note">Guest journey preview. This sample link does not join a live bill.</p></div>`
}

function insights() {
  return `<div class="screen focused">${topbar('Weekly review','home')}<div class="eyebrow">27 Oct – 2 Nov</div><h2 class="page-title" style="margin-top:8px">A quick look at your week</h2><p class="quiet-note">RM 514.20 recorded · RM 84 more on eating out than your usual week.</p>
    <div class="chart" role="img" aria-label="Daily spending Monday to Sunday. Saturday was highest at RM 186.">${[32,54,42,76,63,130,80].map((height,index)=>`<div class="chart-col${index===5?' peak':''}"><div style="height:${height}px"></div><span>${['M','T','W','T','F','S','S'][index]}</span></div>`).join('')}</div><p class="quiet-note" style="margin-bottom:28px">Saturday was your biggest day: RM 186.</p>
    <section class="section">${sectionHeading('What stood out')}<div class="list-group"><button type="button" class="list-row" data-action="go" data-view="insight-detail"><span class="row-main"><strong>Eating out was higher than usual</strong><small>RM 84 more · mostly dinners</small></span>${icon('chevron')}</button><button type="button" class="list-row" data-action="insight-transport"><span class="row-main"><strong>Transport spending dropped</strong><small>18% below your usual week</small></span>${icon('chevron')}</button></div></section>
    <div class="sticky-action no-nav"><button type="button" class="button primary" data-action="finish-review" ${state.weekReviewed?'disabled':''}>${state.weekReviewed ? 'Review completed' : 'Finish weekly review'}</button></div></div>`
}

function insightDetail() {
  return `<div class="screen focused">${topbar('Spending insight','insights')}<div class="eyebrow">This week · Food</div><h2 class="page-title" style="margin:12px 0">You spent RM 84 more on eating out than a usual week.</h2><p class="quiet-note">Five of your seven food purchases were dinner. This compares with your last eight weeks of recorded spending.</p>
    <section class="section" style="margin-top:32px">${sectionHeading('Transactions behind this')}<div class="list-group">${state.transactions.filter(tx=>tx.category==='Food').map(transactionRow).join('')}</div></section><button type="button" class="button secondary" data-action="go" data-view="activity">See all activity</button><button type="button" class="button tertiary" data-action="dismiss-insight">Dismiss for now</button></div>`
}

function progress() {
  return `<div class="screen"><header class="page-head"><div><h1>You</h1><div class="subline">Your habits and preferences</div></div><button class="icon-button" type="button" aria-label="Settings" data-action="sheet" data-sheet="settings">${icon('settings',true)}</button></header>
    <section class="section"><div class="eyebrow">Level 4 · Planner</div><div class="hero-amount" style="font-size:32px">${state.xp.toLocaleString()} <span class="currency" style="font-size:16px;margin-left:8px">/ 1,500 XP</span></div><div class="progress-track" aria-label="${state.xp} of 1500 XP"><span style="width:${Math.min(100,state.xp/1500*100)}%"></span></div><p class="quiet-note">Notice, review, and plan. XP reflects useful habits, not how much you spend.</p></section>
    <section class="section">${sectionHeading('Your challenge')}<div class="challenge"><div class="eyebrow">Weekly · +30 XP</div><h3>Every transaction, seen</h3><p>Review each of this week's recorded transactions. No spending target.</p><div class="progress-line"><strong>${state.challengeSteps} of 3 steps</strong><span>Ends Sunday</span></div><div class="step-track"><span class="done"></span><span class="${state.challengeSteps>1?'done':''}"></span><span class="${state.challengeSteps>2?'done':''}"></span></div><button type="button" class="text-link" data-action="challenge" style="margin-top:12px">${state.challengeSteps===3?'Completed':'Review next step'} →</button></div></section>
    <section class="section">${sectionHeading('Badges', 'See all', 'badges')}<div class="badge-grid">${badge('First week reviewed','Earned','circle','check')}${badge('4 weekly reviews','Earned','diamond','calendar')}${badge('Goal setter','Earned','shield','badge')}</div></section>
    <section class="section">${sectionHeading('Manage')}<div class="list-group"><button class="list-row" type="button" data-action="go" data-view="insights">${icon('chart')}<span class="row-main"><strong>Past reviews</strong></span>${icon('chevron')}</button><button class="list-row" type="button" data-action="sheet" data-sheet="settings">${icon('settings')}<span class="row-main"><strong>Preferences and privacy</strong></span>${icon('chevron')}</button><button class="list-row" type="button" data-action="go" data-view="onboarding">${icon('info')}<span class="row-main"><strong>View onboarding preview</strong></span>${icon('chevron')}</button></div></section></div>`
}
const badge = (title, sub, shape, symbol, locked = false) => `<div class="badge"><span class="badge-mark ${shape}${locked?' locked':''}">${icon(symbol)}</span><strong>${esc(title)}</strong><small>${esc(sub)}</small></div>`
function badges() { return `<div class="screen">${topbar('Badges','progress')}<h2 class="page-title">Small habits add up</h2><p class="quiet-note" style="margin-bottom:28px">Earned for reviewing, planning, and settling up. No badge depends on spending less.</p>
  ${[['Awareness',badge('First week reviewed','Earned · 28 Oct','circle','check')+badge('Monthly check-in','0 of 1','circle','calendar',true)+badge('Category cleanup','3 of 5','circle','filter',true)],['Consistency',badge('4 weekly reviews','Earned · 30 Oct','diamond','calendar')+badge('6-week streak','4 of 6','diamond','spark',true)],['Planning',badge('Goal setter','Earned · 1 Sep','shield','badge')+badge('Limit keeper','1 of 4 weeks','shield','chart',true)],['Splitting',badge('First split','Earned · 15 Oct','circle','split')+badge('Everyone paid','Earned · 28 Oct','circle','check')]].map(([title,items])=>`<section class="section">${sectionHeading(title)}<div class="badge-grid">${items}</div></section>`).join('')}</div>` }

function notifications() { return `<div class="screen">${topbar('Notifications','home')}<section class="section">${sectionHeading('Today')}<div class="list-group"><button class="list-row" type="button" data-action="transaction" data-id="sh">${icon('warning')}<span class="row-main"><strong>One purchase looks unusual for you</strong><small>Shopee · Review when you have a moment</small></span>${icon('chevron')}</button><button class="list-row" type="button" data-action="go" data-view="bill">${icon('split')}<span class="row-main"><strong>Arjun marked his share paid</strong><small>Hakka Kitchen · Confirm if you've received it</small></span>${icon('chevron')}</button></div></section><section class="section">${sectionHeading('Earlier')}<p class="quiet-note">You're up to date.</p></section></div>` }

function onboarding() {
  const steps = [
    ['Your spending, in one clear view','Capture expenses, notice patterns, and keep shared bills moving.'],
    ['Make the period yours','Start with MYR and a calendar month. Payday cycles can be added when your account supports them.'],
    ['Start with one small habit','A weekly review helps you understand where money went. You can add a goal later.'],
  ]
  const [title,desc] = steps[state.onboardingStep]
  return `<div class="screen no-nav">${topbar('Welcome to Duit','progress')}<div class="onboarding-step"><div class="brand-logo">du<span class="dot">ı</span>t</div><div class="onboarding-number" style="margin-top:32px">${state.onboardingStep+1} of 3</div><h1>${title}</h1><p>${desc}</p><div class="illustration-quiet">${icon(['activity','calendar','chart'][state.onboardingStep])}</div></div><div class="sticky-action no-nav"><button type="button" class="button primary" data-action="onboarding-next">${state.onboardingStep===2?'Start using Duit':'Continue'}</button><button type="button" class="button tertiary" data-action="go" data-view="progress">Skip preview</button></div></div>`
}

function auth() { return `<div class="screen no-nav"><div class="auth-panel"><div class="brand-logo">du<span class="dot">ı</span>t</div><h1>${state.authMode==='login'?'Good to see you':'Create your Duit account'}</h1><p>Keep your spending clear and your shared bills simple.</p><label class="field"><span class="field-label">Email</span><input class="field-control" type="email" placeholder="you@example.com" autocomplete="email"></label><label class="field"><span class="field-label">Password</span><input class="field-control" type="password" placeholder="Your password" autocomplete="${state.authMode==='login'?'current-password':'new-password'}"></label><button type="button" class="button primary" data-action="auth-demo">${state.authMode==='login'?'Sign in':'Create account'}</button><button type="button" class="button tertiary" data-action="auth-toggle">${state.authMode==='login'?'New to Duit? Sign up':'Already have an account? Sign in'}</button><p class="prototype-note">Authentication preview only. This page does not submit credentials.</p></div></div>` }

const screenFor = () => ({ home, activity, detail, scan, processing, review, splits, bill, guest, insights, 'insight-detail': insightDetail, progress, badges, notifications, onboarding, auth })[state.view]?.() || home()

function sheetContent() {
  if (!state.sheet) return ''
  const header = title => `<div class="grab"></div><div class="sheet-head"><h2 id="sheet-title">${title}</h2><button type="button" class="icon-button" aria-label="Close sheet" data-action="close-sheet">${icon('close')}</button></div>`
  let body = ''
  if (state.sheet === 'add') body = header('Add to Duit') + `<button class="option" type="button" data-action="go" data-view="scan"><span class="option-icon">${icon('camera')}</span><span><strong>Scan a receipt</strong><small>Review the details before saving</small></span></button><button class="option" type="button" data-action="manual"><span class="option-icon">${icon('edit')}</span><span><strong>Add manually</strong><small>Amount, merchant, category</small></span></button><button class="option" type="button" data-action="go" data-view="bill"><span class="option-icon">${icon('split')}</span><span><strong>Split a bill</strong><small>Friends choose their items</small></span></button>`
  if (state.sheet === 'category' || state.sheet === 'receipt-category' || state.sheet === 'filter-category') body = header(state.sheet === 'filter-category' ? 'Filter category' : 'Choose category') + `<div>${['All','Food','Groceries','Transport','Shopping','Bills','Fun','Other'].filter(cat=>state.sheet==='filter-category'||cat!=='All').map(cat=>`<button class="option" type="button" data-action="choose-category" data-category="${cat}"><span class="legend-dot" style="width:12px;height:12px;background:${(categoryStyle[cat]||categoryStyle.Other)[2]}"></span><strong style="flex:1">${cat}</strong>${(state.sheet==='filter-category'?state.categoryFilter:state.sheet==='receipt-category'?state.receipt.category:selectedTx().category)===cat?icon('check'):''}</button>`).join('')}</div>`
  if (state.sheet === 'resolve') body = header('What was this?') + `<p class="quiet-note" style="margin-bottom:10px">Shopee · RM 389.00 · Sun, 11:48 pm</p>${[['Expected','I made this purchase'],['Wrong category','Choose a better category'],["I don't recognise it",'See what to do next'],['Ignore similar activity','Hide this kind of notice']].map(([title,sub])=>`<button class="option" type="button" data-action="resolve" data-resolution="${esc(title)}"><span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span></button>`).join('')}`
  if (state.sheet === 'edit') body = header(`Edit ${esc(state.editField)}`) + `<label class="field"><span class="field-label">${esc(state.editField)}</span><input class="field-control" id="edit-input" data-model="editDraft" value="${esc(state.editDraft)}" ${state.editField==='amount'?'inputmode="decimal"':''}></label><button type="button" class="button primary" data-action="save-edit">Save change</button>`
  if (state.sheet === 'receipt-item') body = header('Check item name') + `<p class="quiet-note" style="margin-bottom:18px">Compare this line with the printed receipt. The amount stays RM 51.21 in this sample.</p><label class="field"><span class="field-label">Item name</span><input class="field-control" id="receipt-item-name" data-receipt="itemName" value="${esc(state.receipt.itemName)}"></label><button type="button" class="button primary" data-action="check-receipt-item">Looks right</button>`
  if (state.sheet === 'manual') body = header('Add an expense') + `<label class="field"><span class="field-label">Merchant</span><input class="field-control" data-manual="merchant" placeholder="e.g. Tealive"></label><label class="field"><span class="field-label">Amount · RM</span><input class="field-control" data-manual="amount" inputmode="decimal" placeholder="0.00"></label><button type="button" class="button primary" data-action="save-manual">Save expense</button>`
  if (state.sheet === 'invite') body = header('Invite people') + `<p class="quiet-note">Send the guest link. They can choose items without creating an account.</p><label class="field" style="margin-top:18px"><span class="field-label">Prototype guest link</span><input class="field-control" id="share-link" readonly value="${esc(location.href.split('#')[0]+'#guest')}"></label><div class="button-row"><button type="button" class="button secondary" data-action="copy-link">Copy link</button><button type="button" class="button primary" data-action="go" data-view="guest">Preview guest</button></div><div class="qr-preview" style="margin-bottom:4px">Share-link QR appears here in the live bill. This prototype link can be copied above.</div>`
  if (state.sheet === 'participant') { const person=participants.find(p=>p.id===state.participant); body=header(person.name)+`<p class="quiet-note" style="margin-bottom:18px">${person.items} · RM ${money(person.total)}</p><div class="detail-list"><div class="detail-line"><span>Items picked</span><strong>Done</strong></div><div class="detail-line"><span>Marked paid</span><strong>${person.state==='Waiting'?'Waiting':'Done'}</strong></div><div class="detail-line"><span>Owner confirmed</span><strong>${person.state==='Confirmed'?'Done':'Waiting'}</strong></div></div><p class="quiet-note" style="margin:16px 0">Only confirm after you receive the payment outside Duit.</p>${person.id!=='you'&&person.state!=='Confirmed'?`<button type="button" class="button primary" data-action="confirm-participant">${person.state==='Marked paid'?'Confirm payment':'Mark as paid'}</button>`:''}` }
  if (state.sheet === 'settings') body = header('Preferences and privacy') + `<button class="option" type="button" data-action="settings-demo"><span class="option-icon">${icon('calendar')}</span><span><strong>Spending period</strong><small>Calendar month in the current live app</small></span></button><button class="option" type="button" data-action="settings-demo"><span class="option-icon">${icon('bell')}</span><span><strong>Notifications</strong><small>Unusual activity and split updates</small></span></button><button class="option" type="button" data-action="go" data-view="auth"><span class="option-icon">${icon('person')}</span><span><strong>Authentication preview</strong><small>Explore sign in and sign up</small></span></button>`
  if (state.sheet === 'bank-help') body = header("Don't recognise this purchase?") + `<p class="quiet-note" style="margin-bottom:20px">Check the merchant and amount against your bank or e-wallet. If it is not yours, contact that provider using its official app or card number. Duit cannot freeze a card or report a payment.</p><button type="button" class="button primary" data-action="close-sheet">Done</button>`
  return `<button type="button" class="sheet-scrim" aria-label="Close sheet" data-action="close-sheet"></button><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">${body}</section>`
}

function render() {
  const active = document.activeElement
  const id = active?.id
  const start = active instanceof HTMLInputElement ? active.selectionStart : null
  const end = active instanceof HTMLInputElement ? active.selectionEnd : null
  root.innerHTML = `<div class="app-shell">${desktopNav()}<div class="mobile-app"><main id="prototype-main" tabindex="-1">${screenFor()}</main>${isRoot() ? bottomNav() : ''}</div></div>${sheetContent()}${state.toast ? `<div class="toast${state.toast.reward?' reward':''}${isRoot()?'':' no-nav'}" role="status" aria-live="polite"><span>${esc(state.toast.text)}</span>${state.toast.undo ? '<button type="button" data-action="undo">Undo</button>' : ''}</div>` : ''}`
  if (id) { const next = document.getElementById(id); if (next instanceof HTMLInputElement) { next.focus(); if (start !== null && end !== null && next.type !== 'date') next.setSelectionRange(start,end) } }
}

function navigate(view) {
  state.sheet = null
  state.view = view
  location.hash = view
  window.scrollTo({ top: 0, behavior: 'instant' })
  render()
}
let toastTimer
function toast(text, undo, reward = false) {
  clearTimeout(toastTimer)
  state.toast = { text, undo, reward }
  render()
  toastTimer = setTimeout(() => { state.toast = null; render() }, undo ? 6000 : 4000)
}
function beginProcessing() {
  state.receipt = { merchant: 'Jaya Grocer', date: '2026-11-02', amount: '82.61', category: 'Groceries', itemName: 'Household items', itemChecked: false }
  navigate('processing')
  state.readStep = 0
  for (const index of [1,2]) setTimeout(() => { if (state.view === 'processing') { state.readStep = index; render() } }, index * 950)
  setTimeout(() => { if (state.view === 'processing') navigate('review') }, 2900)
}

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]')
  if (!target) return
  const action = target.dataset.action
  if (action === 'go') return navigate(target.dataset.view)
  if (action === 'sheet') { state.sheet = target.dataset.sheet; render(); document.querySelector('.sheet .icon-button')?.focus(); return }
  if (action === 'close-sheet') { state.sheet = null; render(); return }
  if (action === 'transaction') { state.selectedTransaction = target.dataset.id; return navigate('detail') }
  if (action === 'filter') { state.filter = target.dataset.filter; return render() }
  if (action === 'clear-filters') { state.filter='All'; state.categoryFilter='All'; state.query=''; return render() }
  if (action === 'choose-category') {
    const category = target.dataset.category
    if (state.sheet === 'filter-category') state.categoryFilter = category
    else if (state.sheet === 'receipt-category') state.receipt.category = category
    else { const tx=selectedTx(), previous=tx.category; tx.category=category; tx.suggested=false; toast(`${tx.merchant} saved as ${category}`,()=>{tx.category=previous;render()}) }
    state.sheet=null; return render()
  }
  if (action === 'confirm-category') { selectedTx().suggested=false; state.xp+=5; return toast('Category confirmed · +5 XP',null,true) }
  if (action === 'resolve') {
    const choice=target.dataset.resolution, tx=selectedTx(), old=tx.unusual
    state.sheet=null
    if (choice === "I don't recognise it") { state.sheet='bank-help'; return render() }
    if (choice === 'Wrong category') { state.sheet='category'; return render() }
    tx.unusual=false; state.xp+=10
    return toast(choice === 'Expected' ? 'Marked as expected · +10 XP' : 'Similar activity will be quieter · +10 XP',()=>{tx.unusual=old;state.xp-=10;render()},true)
  }
  if (action === 'edit') { state.editField=target.dataset.field; state.editDraft=String(selectedTx()[state.editField] ?? ''); state.sheet='edit'; return render() }
  if (action === 'save-edit') { const tx=selectedTx(), key=state.editField, previous=tx[key], value=state.editDraft.trim(); if (!value) return toast('Enter a value before saving'); if (key==='amount' && (!Number.isFinite(Number(value))||Number(value)<=0)) return toast('Enter an amount above RM 0'); tx[key]=key==='amount'?Number(value):value; state.sheet=null; return toast('Transaction updated',()=>{tx[key]=previous;render()}) }
  if (action === 'manual') { state.sheet='manual'; return render() }
  if (action === 'save-manual') { const merchant=document.querySelector('[data-manual="merchant"]')?.value.trim(), value=Number(document.querySelector('[data-manual="amount"]')?.value); if (!merchant||!Number.isFinite(value)||value<=0) return toast('Enter a merchant and amount above RM 0'); const id='new'+Date.now(); state.transactions.unshift({id,merchant,initials:merchant.slice(0,2).toUpperCase(),category:'Other',day:'Today · 2 Nov',time:'Just now',amount:value,source:'Manual',note:''}); state.sheet=null; navigate('activity'); return toast('Expense added to sample activity') }
  if (action === 'start-processing') return beginProcessing()
  if (action === 'check-receipt-item') { if (!state.receipt.itemName.trim()) return toast('Enter an item name'); state.receipt.itemChecked=true; state.sheet=null; return render() }
  if (action === 'save-receipt' || action === 'save-receipt-split') { const value=Number(state.receipt.amount); if (!state.receipt.merchant.trim()||!Number.isFinite(value)||value<=0) return toast('Check the merchant and enter a valid total'); if (Math.abs(value-82.61)>0.005) return toast('The total does not match the receipt items'); if (!state.receipt.itemChecked) return toast('Check the uncertain item before saving'); if (action === 'save-receipt-split') { navigate('bill'); return toast('Sample bill prepared for review') } const id='receipt'+Date.now(); state.transactions.unshift({id,merchant:state.receipt.merchant,initials:'JG',category:state.receipt.category,day:'Today · 2 Nov',time:'Just now',amount:value,source:'Receipt',note:''}); state.xp+=5; navigate('activity'); return toast('Receipt saved · +5 XP',null,true) }
  if (action === 'participant') { state.participant=target.dataset.id; state.sheet='participant'; return render() }
  if (action === 'confirm-participant') { const person=participants.find(p=>p.id===state.participant), previous=person.state; person.state=person.state==='Marked paid'?'Confirmed':'Marked paid'; state.sheet=null; return toast(`${person.name}: ${person.state.toLowerCase()}`,()=>{person.state=previous;render()}) }
  if (action === 'copy-link') { const value=document.getElementById('share-link')?.value; try { await navigator.clipboard.writeText(value); toast('Prototype guest link copied') } catch { document.getElementById('share-link')?.select(); toast('Select and copy the link above') } return }
  if (action === 'guest-join') { if (!state.guestName.trim()) return toast('Enter your name to continue'); state.guestStage='select'; return render() }
  if (action === 'guest-toggle') { const id=target.dataset.id; state.guestSelected.has(id)?state.guestSelected.delete(id):state.guestSelected.add(id); return render() }
  if (action === 'guest-next') { state.guestStage='summary'; return render() }
  if (action === 'guest-back-select') { state.guestStage='select'; return render() }
  if (action === 'guest-save') { state.guestStage='payment'; return render() }
  if (action === 'guest-paid') { state.guestStage='done'; state.guestPaid=true; return render() }
  if (action === 'guest-reset') { state.guestStage='summary'; return render() }
  if (action === 'finish-review') { if (state.weekReviewed) return; state.weekReviewed=true; state.xp+=15; toast('Weekly review complete · +15 XP',null,true); return }
  if (action === 'dismiss-insight') { navigate('home'); return toast('Insight moved to past reviews') }
  if (action === 'insight-transport') return toast('Transport was 18% below your usual week')
  if (action === 'challenge') { if (state.challengeSteps>=3) return toast('Challenge already complete'); state.challengeSteps=3; state.xp+=30; return toast('Challenge complete · +30 XP',null,true) }
  if (action === 'settings-demo') return toast('Settings are represented in the design specification')
  if (action === 'onboarding-next') { state.onboardingStep++; if (state.onboardingStep>2) { state.onboardingStep=0; return navigate('home') } return render() }
  if (action === 'auth-toggle') { state.authMode=state.authMode==='login'?'register':'login'; return render() }
  if (action === 'auth-demo') return toast('Authentication is not connected in this prototype')
  if (action === 'undo') { state.toast?.undo?.(); state.toast=null; clearTimeout(toastTimer); return render() }
})

document.addEventListener('input', event => {
  const input=event.target
  if (input.dataset.model) { state[input.dataset.model]=input.value; if (input.dataset.model==='query') render() }
  if (input.dataset.receipt) state.receipt[input.dataset.receipt]=input.value
})
document.addEventListener('keydown', event => { if (event.key==='Escape' && state.sheet) { state.sheet=null; render() } })
window.addEventListener('hashchange', () => { const view=location.hash.slice(1); if (view && view!==state.view) { state.view=view; state.sheet=null; render() } })
render()
