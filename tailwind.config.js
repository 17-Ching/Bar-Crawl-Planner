/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── 品牌主色 ──────────────────────────────
        neon: {
          purple:  '#C084FC', // 霓虹紫（主色）
          pink:    '#F472B6', // 電光粉（輔助）
          cyan:    '#22D3EE', // 冷光藍（地圖 accent）
          amber:   '#FBBF24', // 微醺金（CTA / 徽章）
          red:     '#F87171', // 危險紅（酒精警示）
        },
        // ── 深色背景系統 ──────────────────────────
        dark: {
          950: '#080810', // 最深背景（主畫面底色）
          900: '#0F0F1A', // 卡片底色
          800: '#161625', // 次要元素背景
          700: '#1E1E33', // Hover 底色
          600: '#2A2A45', // Border / Divider
          500: '#3D3D5C', // Placeholder 文字背景
        },
        // ── 文字系統 ─────────────────────────────
        text: {
          primary:   '#FFFFFF',
          secondary: '#C4BFE0',
          muted:     '#8B83A8',
        },
      },

      fontFamily: {
        // 主要 UI 字體（繁中 + 英）
        sans:    ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
        // 數字 / 標題用等寬感字體
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        // 等寬（debug / 座標顯示）
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      boxShadow: {
        // 霓虹光暈效果
        'neon-purple': '0 0 20px -2px rgba(192, 132, 252, 0.5)',
        'neon-pink':   '0 0 20px -2px rgba(244, 114, 182, 0.5)',
        'neon-cyan':   '0 0 20px -2px rgba(34, 211, 238, 0.5)',
        'neon-amber':  '0 0 20px -2px rgba(251, 191, 36, 0.5)',
        // 卡片深度陰影
        'card':        '0 4px 24px 0 rgba(8, 8, 16, 0.8)',
        'card-hover':  '0 8px 40px 0 rgba(192, 132, 252, 0.2)',
      },

      backgroundImage: {
        // 品牌漸層
        'gradient-brand':    'linear-gradient(135deg, #C084FC 0%, #F472B6 100%)',
        'gradient-night':    'linear-gradient(180deg, #080810 0%, #0F0F1A 100%)',
        'gradient-card':     'linear-gradient(145deg, rgba(30,30,51,0.9) 0%, rgba(15,15,26,0.95) 100%)',
        'gradient-neon-glow':'radial-gradient(ellipse at 50% 0%, rgba(192,132,252,0.15) 0%, transparent 60%)',
        // CTA 按鈕漸層
        'btn-primary':       'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        'btn-primary-hover': 'linear-gradient(135deg, #C084FC 0%, #F472B6 100%)',
      },

      backdropBlur: {
        xs: '2px',
      },

      animation: {
        'pulse-neon':   'pulseNeon 2.5s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'fade-in-up':   'fadeInUp 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'ping-slow':    'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },

      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 20px -2px rgba(192,132,252,0.4)' },
          '50%':      { boxShadow: '0 0 32px 2px rgba(192,132,252,0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
