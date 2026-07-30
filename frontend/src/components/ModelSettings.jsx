import { useState } from 'react';

const PROVIDERS = [
  { id: 'local', label: 'Local Python' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Google Gemini' },
];

const MODELS = {
  openai: [
    { id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol' },
    { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra' },
    { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

const DEFAULT_MODELS = {
  local: '',
  openai: 'gpt-5.6-sol',
  gemini: 'gemini-2.5-flash',
};

function getProviderLabel(settings) {
  if (settings.provider === 'openai') return 'OpenAI';
  if (settings.provider === 'gemini') return 'Gemini';
  return 'Python · Local';
}

export default function ModelSettings({ value, onChange }) {
  const [showKey, setShowKey] = useState(false);
  const needsKey = value.provider !== 'local';
  const hasKey = value.apiKey.trim().length > 0;

  const chooseProvider = (provider) => {
    setShowKey(false);
    onChange({
      provider,
      model: DEFAULT_MODELS[provider],
      apiKey: '',
    });
  };

  return (
    <details className="engine-control">
      <summary>
        <span className="engine-control__status" aria-hidden="true" />
        <span>
          <small>Analysis engine</small>
          <strong>{getProviderLabel(value)}</strong>
        </span>
        <span className="engine-control__action">Configure</span>
      </summary>

      <div className="engine-control__panel">
        <div className="engine-control__heading">
          <div>
            <strong>Analysis engine</strong>
            <p>Select one provider. Without an API key, OpenMatch runs locally in Python.</p>
          </div>
          <span>Session only</span>
        </div>

        <div className="engine-control__fields">
          <label>
            Provider
            <select
              value={value.provider}
              onChange={(event) => chooseProvider(event.target.value)}
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.label}</option>
              ))}
            </select>
          </label>

          {needsKey && (
            <>
              <label>
                Model
                <select
                  value={value.model}
                  onChange={(event) => onChange({ ...value, model: event.target.value })}
                >
                  {MODELS[value.provider].map((model) => (
                    <option key={model.id} value={model.id}>{model.label}</option>
                  ))}
                </select>
              </label>

              <label className="engine-control__key">
                {value.provider === 'openai' ? 'OpenAI API key' : 'Gemini API key'}
                <span>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={value.apiKey}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={value.provider === 'openai' ? 'sk-…' : 'Google AI Studio key'}
                    onChange={(event) => onChange({ ...value, apiKey: event.target.value })}
                  />
                  <button type="button" onClick={() => setShowKey((current) => !current)}>
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </span>
              </label>
            </>
          )}
        </div>

        <p className={`engine-control__note ${needsKey && !hasKey ? 'is-warning' : ''}`}>
          {needsKey
            ? hasKey
              ? 'Key ready in browser memory for this session.'
              : 'Add one API key to enable external analysis.'
            : 'Private local matching · no API key · no usage cost.'}
        </p>
      </div>
    </details>
  );
}
