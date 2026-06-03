// Definitions.jsx — Category guide for DP Work App

const CATEGORIES = [
  {
    key: 'PROSPECT',
    step: 1,
    label: 'Prospect',
    tagline: 'The beginning of the journey',
    dot:   'bg-purple-500',
    ring:  'border-purple-200',
    bg:    'bg-purple-50',
    hdr:   'bg-purple-500',
    text:  'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    icon:  '🌱',
    description: `Prospects are people who have not yet taken Dikhya. They are the starting point of our mission — people we are actively trying to introduce to the path and convince to take Dikhya.

These are individuals who may already know of the Mission through friends, family, or a Satsang they attended, but have not yet made the commitment. Our approach with Prospects is one of warmth, patience, and no pressure. We visit them at home, listen to them, share our own experiences, and gently answer their questions.

The goal is not to push them but to help them feel the love of the Mission so that they feel ready to take that first step on their own.`,
    milestones: [],
  },
  {
    key: 'DEFAULTER',
    step: 2,
    label: 'Defaulter',
    tagline: 'Reconnecting those who have drifted away',
    dot:   'bg-red-500',
    ring:  'border-red-200',
    bg:    'bg-red-50',
    hdr:   'bg-red-500',
    text:  'text-red-700',
    badge: 'bg-red-100 text-red-700',
    icon:  '🔄',
    description: `Defaulters are initiates — people who have taken Dikhya — but who have stopped practising for some reason. Life circumstances, work pressure, misunderstandings, or simply losing touch with the community can pull someone away from the path.

This group requires special care and sensitivity. Our role is not to judge them but to understand why they stopped, to listen with empathy, and to gently rekindle their connection to the Mission. We help them understand the enduring importance of Dikhya and guide them back with love.

The mission target for this group is Punahscharan — helping them restart their practice and, once ready, bringing them into the Super New or Semi-Active category where they can grow again.`,
    milestones: [],
  },
  {
    key: 'SUPER_NEW',
    step: 3,
    label: 'Super New',
    tagline: 'The most critical and tender phase',
    dot:   'bg-teal-500',
    ring:  'border-teal-200',
    bg:    'bg-teal-50',
    hdr:   'bg-teal-500',
    text:  'text-teal-700',
    badge: 'bg-teal-100 text-teal-700',
    icon:  '✨',
    description: `Super New members have recently taken Dikhya and are in the most delicate phase of their spiritual journey. The risk of dropping out is highest here, which is why this group needs maximum attention, love, and inclusion.

Our approach must be gentle — we must never overwhelm them with too many expectations at once. Instead, we guide them step by step, celebrating every small milestone and making them feel deeply included in the family of the Mission.

The journey for a Super New member follows a natural progression:`,
    milestones: [
      'Create their Family Code (FC) and begin sending Ishtabhrity regularly',
      'Attend the SUK prayer gathering every week',
      'Visit the Bangalore temple once a month',
      'Host a morning or evening prayer at home once a month',
      'Contribute to the Annual Utsav',
      'Make the pilgrimage to Deoghar',
    ],
  },
  {
    key: 'SEMI_ACTIVE',
    step: 4,
    label: 'Semi-Active / New',
    tagline: 'Needs consistent attention and gentle engagement',
    dot:   'bg-sky-500',
    ring:  'border-sky-200',
    bg:    'bg-sky-50',
    hdr:   'bg-sky-500',
    text:  'text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
    icon:  '⚠️',
    description: `Semi-Active members make up a large part of most SUKs. They have a genuine love for the Mission and admire the path — they do send Ishtabhrity but not consistently. When we pay attention, they are regular; when we stop following up, they tend to slip.

This group can be a little tricky to engage. They may avoid our visits, make excuses when we want to host a prayer at their home, or seem unavailable. Yet underneath, the connection is there. We must approach them with patience, sensitivity, and persistence — never with pressure.

The greatest risk for this group is becoming Defaulters. Sustained, warm engagement is the single most effective way to prevent that. A missed month of Ishtabhrity is a signal to reach out — not to scold, but to reconnect.`,
    milestones: [],
  },
  {
    key: 'REGULAR_CONTRIBUTOR',
    step: 5,
    label: 'Regular Contributor',
    tagline: 'The heart of the SUK',
    dot:   'bg-blue-500',
    ring:  'border-blue-200',
    bg:    'bg-blue-50',
    hdr:   'bg-blue-500',
    text:  'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    icon:  '💙',
    description: `Regular Contributors are the heart of our SUK family. These are the Gurubhais whose faces we know, whose names we say with affection, and who we look for whenever there is a Satsang or gathering.

They send Ishtabhrity regularly, attend SUK prayers, visit the temple, go to Deoghar, host prayers at home, and contribute to Utsavs and Satsang activities. They are spiritually committed and emotionally invested in the Mission.

While they are not yet active in DP Work — going out to meet Prospects or following up with Defaulters — they are the backbone that keeps the energy of the SUK alive. With the right encouragement and opportunity, many Regular Contributors can grow into Active DP Workers.`,
    milestones: [],
  },
  {
    key: 'ACTIVE_DP_WORKER',
    step: 6,
    label: 'Active DP Worker',
    tagline: 'The essence of the SUK — this app is for them',
    dot:   'bg-green-500',
    ring:  'border-green-200',
    bg:    'bg-green-50',
    hdr:   'bg-green-500',
    text:  'text-green-700',
    badge: 'bg-green-100 text-green-700',
    icon:  '🙏',
    description: `Active DP Workers are the engine that makes the SUK run. They are not only spiritually committed but actively give their time, energy, and heart to the work of the Mission.

These are the Gurubhais who volunteer at Satsangs and Utsavs, support the SUK POCs, do regular DP Work — visiting Prospects, following up with Defaulters, and nurturing Super New members. They are always looking for ways to bring more people to the path of Dikhya.

This app is built for them. It is their tool for tracking, planning, and coordinating the work they do with such dedication. They are the reason this SUK exists and grows.`,
    milestones: [],
  },
];

export default function Definitions() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Category Definitions</h1>
        <p className="text-sm text-gray-500 mt-1">
          The six stages of the DP Work journey — from first contact to active service
        </p>
      </div>

      {/* Journey path indicator */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">The Journey</p>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {CATEGORIES.map((cat, i) => (
            <div key={cat.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full ${cat.dot} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                  {cat.step}
                </div>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight max-w-[56px]">
                  {cat.label}
                </span>
              </div>
              {i < CATEGORIES.length - 1 && (
                <div className="w-6 h-0.5 bg-gradient-to-r from-gray-200 to-gray-300 mx-1 flex-shrink-0 -mt-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category cards */}
      {CATEGORIES.map(cat => (
        <div key={cat.key} className={`bg-white rounded-2xl border-2 ${cat.ring} shadow-sm overflow-hidden`}>
          {/* Card header */}
          <div className={`${cat.hdr} px-5 py-4 flex items-center gap-3`}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {cat.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  Stage {cat.step}
                </span>
              </div>
              <h2 className="text-white font-bold text-lg leading-tight">{cat.label}</h2>
              <p className="text-white/80 text-xs mt-0.5">{cat.tagline}</p>
            </div>
          </div>

          {/* Description */}
          <div className={`${cat.bg} px-5 py-4`}>
            <div className="space-y-3">
              {cat.description.trim().split('\n\n').map((para, i) => (
                <p key={i} className={`text-sm leading-relaxed ${cat.text}`}>{para}</p>
              ))}
            </div>

            {/* Milestones (Super New only) */}
            {cat.milestones.length > 0 && (
              <div className="mt-4 space-y-2">
                {cat.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/60 rounded-xl px-3 py-2.5">
                    <div className={`w-5 h-5 rounded-full ${cat.dot} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                      {i + 1}
                    </div>
                    <span className={`text-sm font-medium ${cat.text}`}>{m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
