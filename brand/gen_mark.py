"""Generates the Entropy mark: a grid of squares whose top-left is perfect
order and whose bottom-right breaks apart, drifting, turning and shrinking.
Run: python gen_mark.py  (writes mark*.svg, prints the big mark as JSON)."""
import math, random, json

def mix(c1, c2, t):
    a = [int(c1[i:i+2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i+2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02X}' for x, y in zip(a, b))

def squares(n, cell, gap, start, drift, spin, seed, box):
    rnd = random.Random(seed)
    out = []
    for i in range(n):
        for j in range(n):
            t = (i + j) / (2 * (n - 1))
            k = t ** 1.7
            ang = rnd.uniform(-1, 1) * math.pi
            s = cell * (1 - 0.55 * k)
            cx = start + j * (cell + gap) + cell / 2 + drift * k * (0.75 + 0.35 * math.cos(ang))
            cy = start + i * (cell + gap) + cell / 2 + drift * k * (0.75 + 0.35 * math.sin(ang))
            m = s * 0.75
            cx = min(max(cx, m), box - m); cy = min(max(cy, m), box - m)
            out.append((round(s, 2), t, round(cx, 2), round(cy, 2), round(rnd.uniform(-1, 1) * spin * k, 1)))
    return out

def svg(sq, box, c1, c2, note):
    rects = '\n'.join(
        f'  <rect x="{-s/2:.2f}" y="{-s/2:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{s*0.18:.2f}" '
        f'fill="{mix(c1, c2, t)}" transform="translate({x} {y}) rotate({r})"/>' for s, t, x, y, r in sq)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" width="{box}" height="{box}">\n'
            f'  <!-- {note} -->\n{rects}\n</svg>\n')

DARK, LIGHT = ('#F2EDCF', '#A8955A'), ('#8F7E44', '#5A4C22')  # Mutexa-style cream-gold (#E8E2BD) fading deeper
big = squares(4, 8, 3.5, 3, 17, 70, 11, 64)
small = squares(3, 7.5, 2.5, 1.5, 6, 50, 5, 32)
note = 'Entropy mark: an ordered grid breaking apart into disorder.'
open('mark.svg', 'w').write(svg(big, 64, *DARK, note + ' For dark backgrounds.'))
open('mark-light.svg', 'w').write(svg(big, 64, *LIGHT, note + ' For light backgrounds.'))
open('mark-small.svg', 'w').write(svg(small, 32, *DARK, 'Small-size Entropy mark (favicon, <=32px). For dark backgrounds.'))
open('mark-small-light.svg', 'w').write(svg(small, 32, *LIGHT, 'Small-size Entropy mark (favicon, <=32px). For light backgrounds.'))
print(json.dumps({'big': [[s, mix(*DARK, t), x, y, r] for s, t, x, y, r in big],
                  'small': [[s, mix(*DARK, t), x, y, r] for s, t, x, y, r in small]}))
