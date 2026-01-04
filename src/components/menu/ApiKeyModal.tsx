import { useState, useEffect, useRef } from 'react'
import { Button as RetroButton } from '@/components/ui/8bit/button'
import { Spinner } from '@/components/ui/8bit/spinner'
import { getSavedApiKey, saveApiKey, verifyApiKey } from '@/services/geminiService'
import './ApiKeyModal.css'

type ApiKeyModalProps = {
  onVerified: (apiKey: string) => void
  onCancel: () => void
}

export function ApiKeyModal({ onVerified, onCancel }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const savedKey = getSavedApiKey()
    savedKeyRef.current = savedKey
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setApiKey(text.trim())
      setError(null)
    } catch {
      setError('Could not access clipboard')
    }
  }

  const handleVerify = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      setError('Please enter an API key')
      return
    }

    // Skip verification if key hasn't changed from saved key
    if (trimmedKey === savedKeyRef.current) {
      onVerified(trimmedKey)
      return
    }

    setIsVerifying(true)
    setError(null)

    const result = await verifyApiKey(trimmedKey)

    setIsVerifying(false)

    if (result.valid) {
      saveApiKey(trimmedKey)
      onVerified(trimmedKey)
    } else {
      setError(result.error || 'Invalid API key')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify()
    }
  }

  return (
    <div className="api-key-modal-backdrop" onClick={onCancel}>
      <div className="api-key-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="api-key-modal-title">GEMINI API KEY</h2>

        <p className="api-key-modal-description">
          Enter your Google Gemini API key to generate quizzes
        </p>

        <div className="api-key-input-row">
          <input
            type="password"
            className="api-key-input"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter API key..."
            disabled={isVerifying}
            autoFocus
          />
          <RetroButton
            font="retro"
            variant="secondary"
            className="paste-btn"
            onClick={handlePasteFromClipboard}
            disabled={isVerifying}
          >
            PASTE
          </RetroButton>
        </div>

        {error && (
          <div className="api-key-error">{error}</div>
        )}

        <div className="api-key-modal-actions">
          <RetroButton
            font="retro"
            variant="destructive"
            className="api-key-cancel-btn"
            onClick={onCancel}
            disabled={isVerifying}
          >
            CANCEL
          </RetroButton>
          <RetroButton
            font="retro"
            className="api-key-verify-btn"
            onClick={handleVerify}
            disabled={isVerifying || !apiKey.trim()}
          >
            {isVerifying ? (
              <span className="verify-loading">
                <Spinner variant="classic" className="verify-spinner" />
                VERIFYING
              </span>
            ) : apiKey.trim() === savedKeyRef.current ? (
              'CONTINUE'
            ) : (
              'VERIFY'
            )}
          </RetroButton>
        </div>
      </div>
    </div>
  )
}
