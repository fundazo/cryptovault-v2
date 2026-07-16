from pathlib import Path
import struct
import zlib

W, H = 64, 64


def point_in_polygon(px, py, points):
    inside = False
    n = len(points)
    for i in range(n):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % n]
        if ((y1 > py) != (y2 > py)):
            xinters = (x2 - x1) * (py - y1) / (y2 - y1) + x1
            if px < xinters:
                inside = not inside
    return inside

points = [(32, 8), (48, 16), (50, 28), (44, 44), (32, 56), (20, 44), (14, 28), (16, 16)]
inner = [(32, 18), (42, 24), (42, 36), (32, 46), (22, 36), (22, 24)]

pixels = bytearray()
for y in range(H):
    for x in range(W):
        r = 8
        g = 17
        b = 31
        a = 255
        if point_in_polygon(x, y, points):
            r = 59
            g = 130
            b = 246
            if point_in_polygon(x, y, inner):
                r, g, b = 255, 255, 255
                if 24 <= x <= 40 and 18 <= y <= 46:
                    r, g, b = 8, 17, 31
        if 20 <= x <= 44 and 18 <= y <= 46 and point_in_polygon(x, y, points) and not point_in_polygon(x, y, inner):
            r = min(255, r + 15)
            g = min(255, g + 10)
            b = min(255, b + 20)
        pixels.extend([r, g, b, a])

raw = b''.join([b'\x00' + pixels[i:i + W * 4] for i in range(0, len(pixels), W * 4)])


def chunk(chunk_type, data):
    return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xFFFFFFFF)

png = bytearray(b'\x89PNG\r\n\x1a\n')
png.extend(chunk(b'IHDR', struct.pack('>I', W) + struct.pack('>I', H) + b'\x08\x06\x00\x00\x00'))
png.extend(chunk(b'IDAT', zlib.compress(raw, 9)))
png.extend(chunk(b'IEND', b''))
Path('logo.png').write_bytes(png)
print('created logo.png')
