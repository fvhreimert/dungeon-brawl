import './PuppetMasterCategoryModal.css'

export type PuppetMasterCategoryOption = {
  name: string
  availableCount: number
}

type PuppetMasterCategoryModalProps = {
  options: PuppetMasterCategoryOption[]
  onSelect: (category: string) => void
  onCancel: () => void
}

export function PuppetMasterCategoryModal({
  options,
  onSelect,
  onCancel,
}: PuppetMasterCategoryModalProps) {
  return (
    <div className="puppet-category-backdrop" onClick={onCancel}>
      <div className="puppet-category-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="puppet-category-title">Pick their doom</div>
        <p className="puppet-category-subtitle">
          Choose the category that will bind the target&apos;s next selection. Empty categories break
          the curse immediately, so pick wisely.
        </p>
        <div className="puppet-category-grid">
          {options.map((option) => (
            <button
              key={option.name}
              type="button"
              className={`puppet-category-btn ${
                option.availableCount === 0 ? 'puppet-category-btn-disabled' : ''
              }`}
              disabled={option.availableCount === 0}
              onClick={() => onSelect(option.name)}
            >
              <span className="puppet-category-name">{option.name}</span>
              <span className="puppet-category-remaining">
                {option.availableCount} open tile{option.availableCount === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="puppet-category-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
