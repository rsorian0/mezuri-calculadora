// Campos de formulário reutilizados nos parâmetros e na proposta

export function NumberField({ id, label, hint, value, onChange, prefix, suffix, step = 1, min = 0, small }) {
  const cls = ['input-wrap', prefix && 'has-pre', suffix && 'has-suf'].filter(Boolean).join(' ')
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {small && <small>{small}</small>}
      </label>
      <div className={cls}>
        {prefix && <span className="pre">{prefix}</span>}
        <input
          type="number"
          id={id}
          inputMode="decimal"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(id, e.target.value)}
          style={prefix && prefix.length > 2 ? { paddingLeft: '2.8rem' } : undefined}
        />
        {suffix && <span className="suf">{suffix}</span>}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export function TextField({ id, label, value, onChange, type = 'text', placeholder, required, error, full, small, autoComplete = 'off', inputMode }) {
  return (
    <div className={'field' + (full ? ' full' : '')}>
      <label htmlFor={id}>
        <span>
          {label}
          {required && <span className="req" aria-hidden="true"> *</span>}
        </span>
        {small && <small>{small}</small>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? id + '-err' : undefined}
        className={error ? 'invalid' : undefined}
        onChange={(e) => onChange(id, e.target.value)}
      />
      {error && <p className="field-err" id={id + '-err'}>{error}</p>}
    </div>
  )
}
