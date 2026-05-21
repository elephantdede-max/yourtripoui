export const CATEGORY_CONFIG = {
  bar:        { emoji:'🍸', label:'Bar',        tagBg:'#F0E8F5', tagColor:'#6B2D8B', startMin:17, startMax:23, duration:75  },
  restaurant: { emoji:'🍽️', label:'Restaurant', tagBg:'#FDF0E8', tagColor:'#C4622D', startMin:12, startMax:21, duration:90  },
  cafe:       { emoji:'☕', label:'Café',        tagBg:'#FDF5E8', tagColor:'#8B5E14', startMin:7,  startMax:11, duration:45  },
  musee:      { emoji:'🎨', label:'Musée',       tagBg:'#E8ECF5', tagColor:'#1A2744', startMin:9,  startMax:17, duration:120 },
  parc:       { emoji:'🌿', label:'Parc',        tagBg:'#E8F0E0', tagColor:'#2D5016', startMin:10, startMax:18, duration:60  },
  monument:   { emoji:'🛕', label:'Monument',    tagBg:'#F5F0E8', tagColor:'#8B6914', startMin:9,  startMax:19, duration:45  },
  theatre:    { emoji:'🎭', label:'Théâtre',     tagBg:'#F5E8EC', tagColor:'#8B2D3D', startMin:19, startMax:21, duration:150 },
  marche:     { emoji:'🛒', label:'Marché',      tagBg:'#E8F5EC', tagColor:'#1A6B35', startMin:8,  startMax:13, duration:60  },
}

export const BUDGET_DISPLAY = { low:'€', medium:'€€', high:'€€€' }

export function dotColor(h) {
  if (h < 12) return '#D4A843'
  if (h < 18) return '#C4622D'
  return '#1A2744'
}

export function formatH(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

export function parseHour(str) {
  return parseInt(str?.split(':')[0] || 0)
}

export function isOpenAt(opening_hours, heureH) {
  if (!opening_hours) return true
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const slot = opening_hours[days[new Date().getDay()]]
  if (!slot) return true
  const openH = parseInt(slot.split('-')[0].split(':')[0])
  return heureH >= openH
}
