import { ImageResponse } from 'next/og';

export const alt = 'Attendly — attendance calculator for placement drives';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLE = 'You might not be a defaulter.';
const TITLE_2 = 'You just don’t know yet.';
const SUB =
  'Upload your hour-wise PDF, tick the lectures you missed for a placement drive, and get an adjusted estimate in seconds.';

const mono = 'ui-monospace, Menlo, monospace';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#010102',
          color: '#f7f8f8',
          padding: '76px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            opacity: 0.4,
            backgroundImage:
              'linear-gradient(to right, #23252a 1px, transparent 1px)',
            backgroundSize: '84px 84px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            display: 'flex',
            background: 'linear-gradient(to right, transparent, #22d3ee, transparent)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>
            Attendly<span style={{ color: '#22d3ee' }}>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 19,
              color: '#8a8f98',
              fontFamily: mono,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: '#22d3ee',
                display: 'flex',
              }}
            />
            no account · nothing uploaded
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -3.5,
            }}
          >
            {TITLE}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              lineHeight: 1.05,
              fontWeight: 700,
              letterSpacing: -3.5,
              color: '#8a8f98',
            }}
          >
            {TITLE_2}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 27,
              lineHeight: 1.45,
              color: '#d0d6e0',
              maxWidth: 900,
              marginTop: 10,
            }}
          >
            {SUB}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#22d3ee',
              color: '#010102',
              fontSize: 24,
              fontWeight: 600,
              padding: '16px 30px',
              borderRadius: 10,
            }}
          >
            Calculate my attendance →
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              color: '#62666d',
              fontFamily: mono,
            }}
          >
            attendance, without the guesswork
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
