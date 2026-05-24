import Modal from './Modal';
import { MEMBER_CATEGORIES } from '../constants';

// Colour map: maps category key → Tailwind border + bg + text classes
const CARD_STYLES = {
  ACTIVE_DP_WORKER:    { ring: 'border-green-300  bg-green-50  hover:bg-green-100',  dot: 'bg-green-400',   text: 'text-green-800'  },
  REGULAR_CONTRIBUTOR: { ring: 'border-blue-300   bg-blue-50   hover:bg-blue-100',   dot: 'bg-blue-400',    text: 'text-blue-800'   },
  SEMI_ACTIVE:         { ring: 'border-sky-300  bg-sky-50  hover:bg-sky-100',  dot: 'bg-sky-400',   text: 'text-sky-800'  },
  DEFAULTER:           { ring: 'border-red-300    bg-red-50    hover:bg-red-100',    dot: 'bg-red-400',     text: 'text-red-800'    },
  PROSPECT:            { ring: 'border-purple-300 bg-purple-50 hover:bg-purple-100', dot: 'bg-purple-400',  text: 'text-purple-800' },
  SUPER_NEW:           { ring: 'border-teal-300   bg-teal-50   hover:bg-teal-100',   dot: 'bg-teal-400',    text: 'text-teal-800'   },
};

const CARD_DESC = {
  ACTIVE_DP_WORKER:    'Regularly participates in DP work',
  REGULAR_CONTRIBUTOR: 'Consistent in Ishtabhrity & Satsang',
  SEMI_ACTIVE:         'Occasional participation, needs follow-up',
  DEFAULTER:           'Has stopped or gone irregular',
  PROSPECT:            'Not yet initiated, being approached',
  SUPER_NEW:           'Recently joined, within first few months',
};

/**
 * CategoryPickerModal
 * Props:
 *   open        – boolean
 *   onClose     – () => void
 *   onSelect    – (categoryKey: string) => void
 *   current     – currently selected key (optional, highlights it)
 *   title       – modal title (default "Select Category")
 */
export default function CategoryPickerModal({ open, onClose, onSelect, current, title = 'Select Category' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(MEMBER_CATEGORIES).map(([key, cat]) => {
          const style   = CARD_STYLES[key] || {};
          const isActive = key === current;
          return (
            <button
              key={key}
              onClick={() => { onSelect(key); onClose(); }}
              className={`
                relative text-left p-4 rounded-xl border-2 transition-all
                ${style.ring}
                ${isActive ? 'ring-2 ring-offset-1 ring-sky-400' : ''}
              `}
            >
              {isActive && (
                <span className="absolute top-2 right-2 text-sky-500 text-xs font-bold">Current</span>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <span className={`font-semibold text-sm ${style.text}`}>{cat.label}</span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">{CARD_DESC[key]}</p>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
