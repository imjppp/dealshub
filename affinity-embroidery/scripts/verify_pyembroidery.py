#!/usr/bin/env python3
"""Cross-check the JS writers against pyembroidery (dev-only dependency).

For each fixture pattern and format:
  1. read the JS-written file with pyembroidery (stitches, commands, threads)
  2. build the identical pattern in pyembroidery, write it with pyembroidery, read that back
  3. compare (a) raw bytes and (b) the parsed result of the two files.

Usage: verify_pyembroidery.py <fixture-dir produced by dump-fixtures.mjs> [--json out.json]
Exit code 1 if any parsed comparison fails.
"""
import json, os, sys, tempfile
import pyembroidery as pe

CMD = {0: pe.STITCH, 1: pe.JUMP, 2: pe.TRIM, 3: pe.COLOR_CHANGE, 4: pe.STOP, 5: pe.END}
NAME = {pe.STITCH: 'STITCH', pe.JUMP: 'JUMP', pe.TRIM: 'TRIM', pe.COLOR_CHANGE: 'COLOR_CHANGE', pe.STOP: 'STOP', pe.END: 'END'}
FORMATS = {  # key -> (ext, settings)
    'dst': ('dst', {}), 'exp': ('exp', {}), 'jef': ('jef', {'date': '20240101000000'}),
    'pec': ('pec', {}), 'pes1': ('pes', {'version': 1.0}), 'pes6': ('pes', {'version': 6.0}),
    'vp3': ('vp3', {}), 'xxx': ('xxx', {}), 'u01': ('u01', {}),
}

def build(spec):
    p = pe.EmbPattern()
    p.extras['name'] = spec['name']
    for t in spec['threads']:
        th = pe.EmbThread(); th.color = t['color']; th.description = t['name']
        th.brand = t.get('brand') or None; th.catalog_number = t.get('catalog') or None
        p.add_thread(th)
    for x, y, c in spec['stitches']:
        p.add_stitch_absolute(CMD[c], x, y)
    return p

def parsed(path):
    p = pe.read(path)
    if p is None:
        return None
    st = [(round(s[0], 3), round(s[1], 3), NAME.get(s[2] & pe.COMMAND_MASK, str(s[2] & pe.COMMAND_MASK))) for s in p.stitches]
    return {'stitches': st, 'threads': [t.color for t in p.threadlist]}

def summarize(a):
    c = {}
    for _, _, k in a['stitches']:
        c[k] = c.get(k, 0) + 1
    return c

TOL = {'vp3': 3, 'u01': 1}  # vp3: pyembroidery truncates (and drifts) where the JS writer rounds; u01: long jumps split with different rounding of intermediate points

def close(x, y, tol):
    return x[2] == y[2] and abs(x[0] - y[0]) <= tol and abs(x[1] - y[1]) <= tol

def first_diff(a, b, tol=0):
    for i, (x, y) in enumerate(zip(a, b)):
        if not close(x, y, tol):
            return i, x, y
    return (min(len(a), len(b)), None, None) if len(a) != len(b) else None

def main():
    d = sys.argv[1]
    out = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
    specs = json.load(open(os.path.join(d, 'patterns.json')))
    results, bad = [], 0
    tmp = tempfile.mkdtemp()
    for name, spec in specs.items():
        for key, (ext, settings) in FORMATS.items():
            jsfile = os.path.join(d, f'{name}-{key}.{ext}')
            pyfile = os.path.join(tmp, f'{name}-{key}-py.{ext}')
            r = {'pattern': name, 'format': key}
            try:
                pe.write(build(spec), pyfile, settings)
                jsb, pyb = open(jsfile, 'rb').read(), open(pyfile, 'rb').read()
                r['bytes_equal'] = jsb == pyb
                r['js_size'], r['py_size'] = len(jsb), len(pyb)
                a, b = parsed(jsfile), parsed(pyfile)
                if a is None or b is None:
                    r['parse'] = 'READ FAILED'; r['ok'] = False
                else:
                    r['js_counts'], r['py_counts'] = summarize(a), summarize(b)
                    fd = first_diff(a['stitches'], b['stitches'], TOL.get(key, 0) if name == 'stress' else 0)
                    r['stitches_equal'] = fd is None
                    r['threads_equal'] = a['threads'] == b['threads']
                    if fd: r['first_stitch_diff'] = [fd[0], fd[1], fd[2]]
                    if not r['threads_equal']: r['threads'] = [a['threads'], b['threads']]
                    r['ok'] = r['stitches_equal'] and r['threads_equal']
            except Exception as e:
                r['error'] = repr(e); r['ok'] = False
            bad += 0 if r['ok'] else 1
            results.append(r)
            tag = 'BYTES-EQUAL' if r.get('bytes_equal') else ('PARSE-EQUAL ' if r['ok'] else 'FAIL       ')
            print(f"{tag} {name:7s} {key:5s} js={r.get('js_size')} py={r.get('py_size')}" + ('' if r['ok'] else '  ' + json.dumps({k: v for k, v in r.items() if k in ('error','first_stitch_diff','js_counts','py_counts','threads','parse')})))
    if out:
        json.dump(results, open(out, 'w'), indent=1)
    print(f"\n{len(results) - bad}/{len(results)} parsed-equal; {sum(1 for r in results if r.get('bytes_equal'))} byte-identical")
    sys.exit(1 if bad else 0)

main()
