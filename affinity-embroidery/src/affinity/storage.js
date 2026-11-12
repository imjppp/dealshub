// Per-object stitch settings.
//
// SDK finding (affinity.d.ts 3.3.3): there is NO write API for per-node custom data, tags or user
// descriptions on EXISTING nodes (TagInterfaceApi is read-only; NodeDefinitionApi.setUserDescription only
// works on definitions of nodes that are about to be created). So settings live in a sidecar JSON file next
// to the document, keyed by node id, with a geometry signature as a fallback match.
//
//   <document>.embroidery.json   { version, defaults:{...}, export:{...}, objects:{ "<nodeId>": {sig, params} } }
// Unsaved documents: <Desktop>/untitled.embroidery.json.

export const SIDECAR_VERSION = 1;

export function sidecarPath(info) {
  if (info.path) return info.path.replace(/\.[^./\\]+$/, '') + '.embroidery.json';
  const base = (info.desktop || '').replace(/[/\\]$/, '');
  return (base ? base + '/' : '') + 'untitled.embroidery.json';
}

export function emptyStore() { return { version: SIDECAR_VERSION, defaults: {}, export: {}, objects: {} }; }

export function loadStore(sdk, info) {
  const p = sidecarPath(info);
  try {
    if (sdk.fileExists(p)) {
      const j = JSON.parse(sdk.readText(p));
      if (j && j.version === SIDECAR_VERSION) return { ...emptyStore(), ...j };
    }
  } catch (e) { /* corrupt sidecar: start fresh rather than fail */ }
  return emptyStore();
}

export function saveStore(sdk, info, store) {
  sdk.writeText(sidecarPath(info), JSON.stringify(store, null, 1));
}

/** Params for a shape: defaults < stored-by-id < stored-by-signature. */
export function paramsFor(store, id, sig) {
  const byId = store.objects[String(id)];
  if (byId && byId.sig === sig) return { ...store.defaults, ...byId.params };
  const bySig = Object.values(store.objects).find((o) => o.sig === sig);
  return { ...store.defaults, ...((byId && byId.params) || (bySig && bySig.params) || {}) };
}

export function setParams(store, id, sig, params) {
  store.objects[String(id)] = { sig, params: { ...params } };
}
