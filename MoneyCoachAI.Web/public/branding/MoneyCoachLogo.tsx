type MoneyCoachLogoProps = {
  variant?: "symbol" | "horizontal";
  size?: number;
  className?: string;
  showBadge?: boolean;
};

function MoneyCoachLogo({
  variant = "horizontal",
  size = 52,
  className = "",
  showBadge = true,
}: MoneyCoachLogoProps) {
  const isSymbol = variant === "symbol";

  return (
    <svg
      className={className}
      width={isSymbol ? size : size * 4.15}
      height={size}
      viewBox={isSymbol ? "0 0 190 150" : "0 0 620 150"}
      role="img"
      aria-label="MoneyCoachAI"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="mca-purple-gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="45%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>

        <linearGradient
          id="mca-orange-gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#FFF06A" />
          <stop offset="28%" stopColor="#FFB21C" />
          <stop offset="65%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#EA3B00" />
        </linearGradient>

        <linearGradient
          id="mca-gold-gradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#FFF4A8" />
          <stop offset="30%" stopColor="#FFD34F" />
          <stop offset="65%" stopColor="#E69A00" />
          <stop offset="100%" stopColor="#9B5700" />
        </linearGradient>

        <linearGradient
          id="mca-black-gradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#353944" />
          <stop offset="55%" stopColor="#15171D" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>

        <filter
          id="mca-logo-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="5"
            floodColor="#4C1D95"
            floodOpacity="0.22"
          />
        </filter>

        <filter
          id="mca-gold-glow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2.5"
            floodColor="#FFB000"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      <g filter="url(#mca-logo-shadow)">
        {/* Purple M */}
        <path
          d="
            M12 132
            L12 18
            L46 18
            L77 66
            L108 18
            L137 18
            L137 132
            L106 132
            L106 65
            L82 102
            L72 102
            L43 64
            L43 132
            Z
          "
          fill="url(#mca-purple-gradient)"
        />

        {/* Orange C */}
        <path
          d="
            M145 27
            C165 10 198 7 224 20
            C236 26 246 34 254 44
            L230 64
            C222 54 210 49 196 49
            C174 49 159 64 159 84
            C159 105 176 119 197 119
            C215 119 229 111 238 98
            L261 117
            C245 139 222 149 195 147
            C154 144 127 112 132 75
            C135 55 139 38 145 27
            Z
          "
          fill="url(#mca-orange-gradient)"
        />

        {/* Inner C cutout */}
        <path
          d="
            M171 55
            C182 47 198 44 211 50
            C217 53 223 57 227 62
            L211 74
            C206 69 201 67 194 67
            C182 67 173 75 173 85
            C173 96 182 104 194 104
            C203 104 211 100 217 94
            L231 105
            C222 117 209 123 194 123
            C171 123 153 107 153 85
            C153 73 159 62 171 55
            Z
          "
          fill="#FFFDFB"
        />

        {/* Chart bars */}
        <g fill="url(#mca-orange-gradient)">
          <rect x="169" y="92" width="8" height="16" rx="1" />
          <rect x="181" y="84" width="8" height="24" rx="1" />
          <rect x="193" y="75" width="8" height="33" rx="1" />
          <rect x="205" y="65" width="8" height="43" rx="1" />
        </g>

        {/* Growth arrow */}
        <path
          d="
            M165 89
            C179 85 194 77 208 67
            L220 58
            L214 51
            L238 47
            L233 71
            L226 64
            L214 73
            C197 86 181 94 166 97
            Z
          "
          fill="url(#mca-orange-gradient)"
        />

        {/* Sparkles */}
        <g fill="#FFB000">
          <path d="M190 43 L194 52 L203 56 L194 60 L190 69 L186 60 L177 56 L186 52 Z" />
          <path d="M214 31 L217 38 L224 41 L217 44 L214 51 L211 44 L204 41 L211 38 Z" />
        </g>

        {showBadge && (
          <g transform="translate(172 3)">
            <rect
              x="0"
              y="0"
              width="66"
              height="34"
              rx="7"
              fill="#050505"
            />

            {/* Golden A */}
            <path
              d="
                M9 27
                L20 7
                L29 7
                L40 27
                L32 27
                L30 22
                L19 22
                L17 27
                Z

                M22 17
                L27 17
                L24.5 11
                Z
              "
              fill="url(#mca-gold-gradient)"
              fillRule="evenodd"
              filter="url(#mca-gold-glow)"
            />

            {/* Vitthal chandan shaped I */}
            <g
              transform="translate(45 5)"
              filter="url(#mca-gold-glow)"
            >
              <path
                d="
                  M8 0
                  C14 0 18 4 18 9
                  C18 13 15 16 12 19
                  C10.5 21 10 24 10 27
                  L10 29
                  C10 32 9 34 8 34
                  C7 34 6 32 6 29
                  L6 27
                  C6 24 5.5 21 4 19
                  C1 16 -2 13 -2 9
                  C-2 4 2 0 8 0
                  Z
                "
                fill="url(#mca-gold-gradient)"
              />

              <ellipse
                cx="8"
                cy="8.5"
                rx="3.8"
                ry="2.8"
                fill="#060606"
              />

              <path
                d="
                  M6 16
                  C7 18 7.2 21 7.2 24
                  L7.2 30
                  C7.2 31.5 7.6 32.5 8 32.5
                  C8.4 32.5 8.8 31.5 8.8 30
                  L8.8 24
                  C8.8 21 9 18 10 16
                  C8.8 17 7.2 17 6 16
                  Z
                "
                fill="url(#mca-gold-gradient)"
              />
            </g>
          </g>
        )}
      </g>

      {!isSymbol && (
        <g transform="translate(285 44)">
          <text
            x="0"
            y="42"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="49"
            fontWeight="900"
            letterSpacing="-2.8"
            fill="url(#mca-purple-gradient)"
          >
            Money
          </text>

          <text
            x="146"
            y="42"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="49"
            fontWeight="900"
            letterSpacing="-2.8"
            fill="url(#mca-black-gradient)"
          >
            Coach
          </text>

          <text
            x="297"
            y="42"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="49"
            fontWeight="900"
            fill="url(#mca-gold-gradient)"
          >
            A
          </text>

          {/* Wordmark Vitthal chandan I */}
          <g transform="translate(339 7)">
            <path
              d="
                M10 0
                C17 0 22 5 22 11
                C22 16 18 20 15 23
                C13 26 13 31 13 36
                L13 41
                C13 45 11.5 48 10 48
                C8.5 48 7 45 7 41
                L7 36
                C7 31 7 26 5 23
                C2 20 -2 16 -2 11
                C-2 5 3 0 10 0
                Z
              "
              fill="url(#mca-gold-gradient)"
            />

            <ellipse
              cx="10"
              cy="10"
              rx="4.5"
              ry="3.4"
              fill="#FFFDFB"
            />
          </g>

          <text
            x="2"
            y="68"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="14"
            fontWeight="700"
            letterSpacing="1.2"
            fill="#6B7280"
          >
            SMARTER FINANCIAL DECISIONS
          </text>
        </g>
      )}
    </svg>
  );
}

export default MoneyCoachLogo;