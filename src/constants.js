export const SUKS = [
  { id: 'bngg', name: 'Bannerghatta',    city: 'Bangalore' },
  { id: 'bnas', name: 'Banashankari',    city: 'Bangalore' },
  { id: 'ejip', name: 'Ejipura',         city: 'Bangalore' },
  { id: 'garb', name: 'Garebhabipalya', city: 'Bangalore' },
];

// Order represents the journey: Prospect → Defaulter → Super New → Semi-Active → Regular Contributor → Active DP Worker
export const MEMBER_CATEGORIES = {
  PROSPECT:            { label: 'Prospect',             color: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  DEFAULTER:           { label: 'Defaulter',            color: 'red',    bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-200'    },
  SUPER_NEW:           { label: 'Super New',            color: 'teal',   bg: 'bg-teal-100',   text: 'text-teal-800',   border: 'border-teal-200'   },
  SEMI_ACTIVE:         { label: 'Semi-Active / New',    color: 'sky',    bg: 'bg-sky-100',    text: 'text-sky-800',    border: 'border-sky-200'    },
  REGULAR_CONTRIBUTOR: { label: 'Regular Contributor',  color: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-200'   },
  ACTIVE_DP_WORKER:    { label: 'Active DP Worker',     color: 'green',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200'  },
};

export const DP_STATUSES = {
  FW_PENDING:      { label: 'FW Pending',     bg: 'bg-sky-100',    text: 'text-sky-800'    },
  FW_COMPLETED:    { label: 'FW Completed',   bg: 'bg-blue-100',   text: 'text-blue-800'   },
  DA_APPROVED:     { label: 'DA Approved',    bg: 'bg-green-100',  text: 'text-green-800'  },
  NOT_APPLICABLE:  { label: 'N/A',            bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

export const ISHTABHRITY_STATUSES = {
  REGULAR:         { label: 'Regular',        bg: 'bg-green-100',  text: 'text-green-800'  },
  IRREGULAR:       { label: 'Irregular',      bg: 'bg-sky-100',    text: 'text-sky-800'    },
  NEW:             { label: 'New',            bg: 'bg-sky-100',    text: 'text-sky-800'    },
  INACTIVE:        { label: 'Inactive',       bg: 'bg-red-100',    text: 'text-red-800'    },
  NOT_APPLICABLE:  { label: 'N/A',            bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

export const VISIT_OUTCOMES = [
  'Responsive & willing',
  'Not at home',
  'Listened but non-committal',
  'Will resume Ishtabhrity',
  'Agreed to start prayer at home',
  'Not interested currently',
  'Moving soon',
  'Health issues',
  'Dikhya taken',
  'Other',
];

// ─── Songs Module ────────────────────────────────────────────────────────────
export const SONG_CATEGORIES = {
  BHAJAN: { label: 'Bhajan', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  KORA:   { label: 'Koras',   color: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  KIRTAN: { label: 'Kirtan', color: 'green',  bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-200'  },
};

export const SONG_LANGUAGES = [
  'Odia', 'Hindi', 'Bengali', 'English', 'Kannada', 'Telugu', 'Tamil', 'Marathi', 'Other'
];

export const SONG_TAGS = [
  'Krishna', 'Ram', 'Shiva', 'Durga', 'Ganesh', 'Radha',
  'Morning', 'Evening', 'Aarti', 'Prarthana', 'Bhakti',
  'Dashakam', 'Chalisa', 'Stotram', 'Kavach', 'Satsang'
];

export const SONG_BOOKS = [
  'Ishi Chetana',
  'Other'
];
