import { MEMBER_CATEGORIES } from '../constants';

// Detect whether a visit outcome or action should trigger a category-change prompt.
// Returns a trigger key string or null.
export function getCategoryChangeTrigger(memberCategory, outcome, tookDikhya) {
  if (
    memberCategory === 'PROSPECT' &&
    (outcome === 'Dikhya taken' || outcome === 'Took Dikhya' || tookDikhya)
  ) {
    return 'DIKHYA';
  }
  if (
    memberCategory === 'DEFAULTER' &&
    (outcome === 'Will resume Ishtabhrity' || outcome === 'Agreed to start prayer at home')
  ) {
    return 'RESUMING';
  }
  return null;
}

const TRIGGER_CONFIG = {
  DIKHYA: {
    emoji: '🎉',
    title: 'Dikhya Taken — Journey Complete!',
    color: 'from-green-50 to-emerald-50 border-green-100',
    textColor: 'text-green-900',
    subColor: 'text-green-700',
    message: (name) =>
      `${name} has taken Dikhya 🙏 and completed their journey as a Prospect. Move them to the right category to continue guiding them on the path.`,
    suggestedCats: ['SUPER_NEW', 'SEMI_ACTIVE', 'REGULAR_CONTRIBUTOR'],
  },
  RESUMING: {
    emoji: '🙏',
    title: 'Resuming Practice!',
    color: 'from-blue-50 to-sky-50 border-blue-100',
    textColor: 'text-blue-900',
    subColor: 'text-blue-700',
    message: (name) =>
      `${name} is resuming their practice. Consider updating their category to reflect their renewed commitment.`,
    suggestedCats: ['SEMI_ACTIVE', 'REGULAR_CONTRIBUTOR', 'SUPER_NEW'],
  },
};

const CAT_BUTTON = {
  ACTIVE_DP_WORKER:    'bg-green-50 border-green-200 hover:bg-green-100 text-green-800',
  REGULAR_CONTRIBUTOR: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800',
  SEMI_ACTIVE:         'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-800',
  DEFAULTER:           'bg-red-50 border-red-200 hover:bg-red-100 text-red-800',
  PROSPECT:            'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800',
  SUPER_NEW:           'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-800',
};

export default function CategoryChangePromptModal({ open, onClose, member, triggerKey, onSelect }) {
  if (!open || !member || !triggerKey) return null;

  const config = TRIGGER_CONFIG[triggerKey];
  if (!config) return null;

  const currentCatLabel = MEMBER_CATEGORIES[member.memberCategory]?.label || member.memberCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">

        {/* Coloured header */}
        <div className={`bg-gradient-to-r ${config.color} border-b px-5 pt-5 pb-4`}>
          <div className="text-3xl mb-2">{config.emoji}</div>
          <h2 className={`text-base font-bold ${config.textColor}`}>{config.title}</h2>
          <p className={`text-sm mt-1 leading-relaxed ${config.subColor}`}>
            {config.message(member.name)}
          </p>
        </div>

        {/* Category options */}
        <div className="p-5 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Move to new category
          </p>

          {config.suggestedCats.map(key => {
            const cat = MEMBER_CATEGORIES[key];
            return (
              <button
                key={key}
                onClick={() => { onSelect(key); onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-xl border font-semibold text-sm transition-all ${CAT_BUTTON[key]}`}
              >
                {cat.label}
              </button>
            );
          })}

          {/* Divider + dismiss */}
          <div className="pt-1 border-t border-gray-100 mt-3">
            <button
              onClick={onClose}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2.5 transition-colors"
            >
              Not now — keep as {currentCatLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}