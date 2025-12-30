const SettingsPanel = ({
  isOpen,
  onClose,
  providerKey,
  setProviderKey,
  apiKey,
  setApiKey,
  model,
  setModel,
  baseUrl,
  setBaseUrl,
  selectedProvider,
  providerOptions,
}) => (
  <>
    <div
      className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-300 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
    />

    <section
      className={`fixed inset-y-0 right-0 z-40 w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-indigo-400">
            Settings
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Connection</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
          aria-label="Close settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="m12 10.94 4.72-4.72 1.06 1.06L13.06 12l4.72 4.72-1.06 1.06L12 13.06l-4.72 4.72-1.06-1.06L10.94 12 6.22 7.28l1.06-1.06z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Provider
            <select
              value={providerKey}
              onChange={(event) => setProviderKey(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            >
              {providerOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            API key
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Model
            <input
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Base URL (optional)
            <input
              type="text"
              placeholder={
                selectedProvider.endpoint ||
                'https://your-proxy/v1/chat/completions'
              }
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
          <h3 className="text-base font-semibold text-slate-900">Helpful links</h3>
          <p className="mt-2 text-sm text-slate-500">
            Review each vendor&apos;s API docs for their auth headers, quota, and
            available model list before you paste a key.
          </p>
          <a
            className="mt-3 inline-flex items-center gap-1 font-semibold text-indigo-500"
            href={selectedProvider.docsUrl}
            target="_blank"
            rel="noreferrer"
          >
            {selectedProvider.label} docs ↗
          </a>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5">
          <h4 className="text-base font-semibold text-amber-900">Security</h4>
          <p className="mt-2 text-sm text-amber-800">
            Keys stay in browser memory only. Use your own backend when deploying
            publicly, and rotate secrets regularly.
          </p>
        </div>
      </div>
    </section>
  </>
)

export default SettingsPanel
