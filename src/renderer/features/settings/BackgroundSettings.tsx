import { useThemeStore, BgType } from '@/store/theme-store'
import { cn } from '@/lib/cn'

const gradients = [
  'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
  'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #2d1b69 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)'
]

export default function BackgroundSettings() {
  const { bgType, bgColor, bgGradient, bgImage, bgImageSize, bgImageBlur, setBgType, setBgColor, setBgGradient, setBgImage, setBgImageSize, setBgImageBlur } =
    useThemeStore()

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => setBgImage(reader.result as string)
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const types: { key: BgType; label: string }[] = [
    { key: 'theme', label: '跟随主题' },
    { key: 'solid', label: '纯色' },
    { key: 'gradient', label: '渐变' },
    { key: 'image', label: '图片' }
  ]

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">背景设置</h3>

      {/* Type selector */}
      <div className="flex gap-2">
        {types.map((t) => (
          <button
            key={t.key}
            onClick={() => setBgType(t.key)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg border transition-colors',
              bgType === t.key
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-secondary hover:border-text-secondary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Solid color picker */}
      {bgType === 'solid' && (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-border"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="bg-surface-hover text-text rounded-lg px-3 py-2 text-sm border border-border w-32 font-mono"
          />
        </div>
      )}

      {/* Gradient presets */}
      {bgType === 'gradient' && (
        <div className="grid grid-cols-4 gap-2">
          {gradients.map((g) => (
            <button
              key={g}
              onClick={() => setBgGradient(g)}
              className={cn(
                'h-10 rounded-lg border-2 transition-all',
                bgGradient === g ? 'border-accent scale-105' : 'border-transparent'
              )}
              style={{ background: g }}
            />
          ))}
        </div>
      )}

      {/* Image upload */}
      {bgType === 'image' && (
        <div className="space-y-2">
          <button
            onClick={handleImageUpload}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
          >
            选择图片
          </button>
          {bgImage && (
            <>
              <div className="relative">
                <div
                  className="h-24 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
                <button
                  onClick={() => setBgImage('')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-white text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Image size */}
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">图片大小</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { label: '填充', value: 'cover' as const },
                    { label: '适应', value: 'contain' as const },
                    { label: '原始', value: 'auto' as const },
                    { label: '自定义', value: 'custom' as const }
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        if (p.value === 'custom') {
                          if (typeof bgImageSize !== 'number') setBgImageSize(100)
                        } else {
                          setBgImageSize(p.value)
                        }
                      }}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                        p.value === 'custom'
                          ? typeof bgImageSize === 'number'
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-text-secondary hover:border-text-secondary'
                          : bgImageSize === p.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-text-secondary hover:border-text-secondary'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {typeof bgImageSize === 'number' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={1}
                      value={bgImageSize}
                      onChange={(e) => setBgImageSize(Number(e.target.value))}
                      className="flex-1 accent-accent"
                    />
                    <span className="text-xs text-text-secondary w-10 text-right">{bgImageSize}%</span>
                  </div>
                )}
              </div>

              {/* Image blur */}
              <div>
                <label className="text-xs text-text-secondary block mb-1.5">
                  模糊度: {bgImageBlur}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={bgImageBlur}
                  onChange={(e) => setBgImageBlur(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
