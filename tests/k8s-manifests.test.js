/**
 * PHASE 3 — Kubernetes Manifest Validation Tests
 * Validates every YAML file is well-formed, has required fields,
 * follows security best practices, and is wired correctly.
 */
const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const MANIFESTS = path.join(__dirname, '../Kubernetes-Manifests');

// ── Helpers ───────────────────────────────────────────────────────
function loadYaml(relPath) {
  const full = path.join(MANIFESTS, relPath);
  const raw  = fs.readFileSync(full, 'utf8');
  // Handle multi-doc YAML (--- separator)
  return yaml.loadAll(raw).filter(Boolean);
}

function loadAll() {
  const files = [];
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) { walk(full); continue; }
      if (f.endsWith('.yaml') || f.endsWith('.yml')) files.push(full);
    }
  }
  walk(MANIFESTS);
  return files;
}

// ══════════════════════════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════════════════════════
describe('Manifest files exist', () => {
  const required = [
    'database/statefulset.yaml',
    'database/service.yaml',
    'database/secret.yaml',
    'backend/deployment.yaml',
    'backend/service-hpa.yaml',
    'frontend/deployment.yaml',
    'frontend/service-hpa.yaml',
    'networking/ingress.yaml',
    'networking/network-policies.yaml',
    'networking/namespaces-rbac.yaml',
  ];
  for (const f of required) {
    test(`exists: ${f}`, () => {
      expect(fs.existsSync(path.join(MANIFESTS, f))).toBe(true);
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// ALL YAMLS PARSE WITHOUT ERROR
// ══════════════════════════════════════════════════════════════════
describe('All YAML files are valid', () => {
  for (const file of loadAll()) {
    const rel = path.relative(MANIFESTS, file);
    test(`parses: ${rel}`, () => {
      expect(() => loadYaml(rel.replace(/\\/g, '/'))).not.toThrow();
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// MONGODB STATEFULSET
// ══════════════════════════════════════════════════════════════════
describe('MongoDB StatefulSet', () => {
  let docs, ss;
  beforeAll(() => {
    docs = loadYaml('database/statefulset.yaml');
    ss   = docs.find(d => d.kind === 'StatefulSet');
  });

  test('kind is StatefulSet',          () => expect(ss.kind).toBe('StatefulSet'));
  test('namespace is three-tier',      () => expect(ss.metadata.namespace).toBe('three-tier'));
  test('has serviceName',              () => expect(ss.spec.serviceName).toBeDefined());
  test('container image is mongo:6',   () => expect(ss.spec.template.spec.containers[0].image).toMatch(/mongo:6/));
  test('has liveness probe',           () => expect(ss.spec.template.spec.containers[0].livenessProbe).toBeDefined());
  test('has readiness probe',          () => expect(ss.spec.template.spec.containers[0].readinessProbe).toBeDefined());
  test('has resource requests',        () => expect(ss.spec.template.spec.containers[0].resources.requests).toBeDefined());
  test('has resource limits',          () => expect(ss.spec.template.spec.containers[0].resources.limits).toBeDefined());
  test('has volumeClaimTemplates',     () => expect(ss.spec.volumeClaimTemplates.length).toBeGreaterThan(0));
  test('PVC requests storage',         () => {
    const pvc = ss.spec.volumeClaimTemplates[0];
    expect(pvc.spec.resources.requests.storage).toBeDefined();
  });
  test('runs as non-root',             () => expect(ss.spec.template.spec.securityContext.runAsNonRoot).toBe(true));
  test('container port is 27017',      () => {
    const port = ss.spec.template.spec.containers[0].ports[0].containerPort;
    expect(port).toBe(27017);
  });
});

// ══════════════════════════════════════════════════════════════════
// MONGODB SERVICE
// ══════════════════════════════════════════════════════════════════
describe('MongoDB Service', () => {
  let svc;
  beforeAll(() => {
    svc = loadYaml('database/service.yaml').find(d => d.kind === 'Service');
  });

  test('name is mongodb-service',   () => expect(svc.metadata.name).toBe('mongodb-service'));
  test('namespace is three-tier',   () => expect(svc.metadata.namespace).toBe('three-tier'));
  test('headless (clusterIP None)', () => expect(svc.spec.clusterIP).toBe('None'));
  test('port 27017',                () => expect(svc.spec.ports[0].port).toBe(27017));
  test('selects app: mongodb',      () => expect(svc.spec.selector.app).toBe('mongodb'));
});

// ══════════════════════════════════════════════════════════════════
// BACKEND DEPLOYMENT
// ══════════════════════════════════════════════════════════════════
describe('Backend Deployment', () => {
  let dep;
  beforeAll(() => {
    dep = loadYaml('backend/deployment.yaml').find(d => d.kind === 'Deployment');
  });

  test('kind is Deployment',                () => expect(dep.kind).toBe('Deployment'));
  test('namespace is three-tier',           () => expect(dep.metadata.namespace).toBe('three-tier'));
  test('replicas >= 2',                     () => expect(dep.spec.replicas).toBeGreaterThanOrEqual(2));
  test('strategy is RollingUpdate',         () => expect(dep.spec.strategy.type).toBe('RollingUpdate'));
  test('maxUnavailable is 0',               () => expect(dep.spec.strategy.rollingUpdate.maxUnavailable).toBe(0));
  test('container port is 3500',            () => {
    expect(dep.spec.template.spec.containers[0].ports[0].containerPort).toBe(3500);
  });
  test('has liveness probe',                () => expect(dep.spec.template.spec.containers[0].livenessProbe).toBeDefined());
  test('liveness probe uses /health',       () => {
    expect(dep.spec.template.spec.containers[0].livenessProbe.httpGet.path).toBe('/health');
  });
  test('has readiness probe',               () => expect(dep.spec.template.spec.containers[0].readinessProbe).toBeDefined());
  test('readiness probe uses /health/ready',() => {
    expect(dep.spec.template.spec.containers[0].readinessProbe.httpGet.path).toBe('/health/ready');
  });
  test('resource requests defined',         () => expect(dep.spec.template.spec.containers[0].resources.requests).toBeDefined());
  test('resource limits defined',           () => expect(dep.spec.template.spec.containers[0].resources.limits).toBeDefined());
  test('runs as non-root',                  () => expect(dep.spec.template.spec.securityContext.runAsNonRoot).toBe(true));
  test('no privilege escalation',           () => {
    const sc = dep.spec.template.spec.containers[0].securityContext;
    expect(sc.allowPrivilegeEscalation).toBe(false);
  });
  test('drops ALL capabilities',            () => {
    const drop = dep.spec.template.spec.containers[0].securityContext.capabilities.drop;
    expect(drop).toContain('ALL');
  });
  test('reads env from mongo-secret',       () => {
    const envFrom = dep.spec.template.spec.containers[0].envFrom;
    expect(envFrom.some(e => e.secretRef?.name === 'mongo-secret')).toBe(true);
  });
  test('has topology spread constraints',   () => {
    expect(dep.spec.template.spec.topologySpreadConstraints.length).toBeGreaterThan(0);
  });
  test('prometheus scrape annotation',      () => {
    expect(dep.spec.template.metadata.annotations['prometheus.io/scrape']).toBe('true');
  });
});

// ══════════════════════════════════════════════════════════════════
// BACKEND HPA
// ══════════════════════════════════════════════════════════════════
describe('Backend HPA', () => {
  let hpa;
  beforeAll(() => {
    hpa = loadYaml('backend/service-hpa.yaml').find(d => d.kind === 'HorizontalPodAutoscaler');
  });

  test('targets backend deployment',   () => expect(hpa.spec.scaleTargetRef.name).toBe('backend'));
  test('minReplicas >= 2',             () => expect(hpa.spec.minReplicas).toBeGreaterThanOrEqual(2));
  test('maxReplicas > minReplicas',    () => expect(hpa.spec.maxReplicas).toBeGreaterThan(hpa.spec.minReplicas));
  test('has CPU metric',               () => {
    const cpu = hpa.spec.metrics.find(m => m.resource?.name === 'cpu');
    expect(cpu).toBeDefined();
  });
  test('has scale-down stabilization', () => {
    expect(hpa.spec.behavior.scaleDown.stabilizationWindowSeconds).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// FRONTEND DEPLOYMENT
// ══════════════════════════════════════════════════════════════════
describe('Frontend Deployment', () => {
  let dep;
  beforeAll(() => {
    dep = loadYaml('frontend/deployment.yaml').find(d => d.kind === 'Deployment');
  });

  test('replicas >= 2',           () => expect(dep.spec.replicas).toBeGreaterThanOrEqual(2));
  test('container port is 80',    () => expect(dep.spec.template.spec.containers[0].ports[0].containerPort).toBe(80));
  test('has liveness probe',      () => expect(dep.spec.template.spec.containers[0].livenessProbe).toBeDefined());
  test('runs as non-root',        () => expect(dep.spec.template.spec.securityContext.runAsNonRoot).toBe(true));
  test('no privilege escalation', () => {
    expect(dep.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation).toBe(false);
  });
  test('drops ALL capabilities',  () => {
    expect(dep.spec.template.spec.containers[0].securityContext.capabilities.drop).toContain('ALL');
  });
  test('has emptyDir volumes for nginx', () => {
    const vols = dep.spec.template.spec.volumes.map(v => v.name);
    expect(vols).toContain('nginx-cache');
    expect(vols).toContain('nginx-run');
  });
});

// ══════════════════════════════════════════════════════════════════
// NETWORK POLICIES
// ══════════════════════════════════════════════════════════════════
describe('NetworkPolicies', () => {
  let policies;
  beforeAll(() => {
    policies = loadYaml('networking/network-policies.yaml');
  });

  test('4 policies defined', () => {
    const nps = policies.filter(d => d.kind === 'NetworkPolicy');
    expect(nps.length).toBe(4);
  });

  test('default-deny-all exists', () => {
    const deny = policies.find(d => d.metadata?.name === 'default-deny-all');
    expect(deny).toBeDefined();
  });

  test('default-deny covers both Ingress and Egress', () => {
    const deny = policies.find(d => d.metadata?.name === 'default-deny-all');
    expect(deny.spec.policyTypes).toContain('Ingress');
    expect(deny.spec.policyTypes).toContain('Egress');
  });

  test('frontend-policy exists',  () => {
    expect(policies.find(d => d.metadata?.name === 'frontend-policy')).toBeDefined();
  });

  test('backend-policy exists',   () => {
    expect(policies.find(d => d.metadata?.name === 'backend-policy')).toBeDefined();
  });

  test('mongodb-policy exists',   () => {
    expect(policies.find(d => d.metadata?.name === 'mongodb-policy')).toBeDefined();
  });

  test('mongodb-policy only allows port 27017 ingress', () => {
    const mongo = policies.find(d => d.metadata?.name === 'mongodb-policy');
    const port  = mongo.spec.ingress[0].ports[0].port;
    expect(port).toBe(27017);
  });

  test('backend-policy allows from frontend', () => {
    const backend = policies.find(d => d.metadata?.name === 'backend-policy');
    const fromLabels = backend.spec.ingress[0].from[0].podSelector.matchLabels;
    expect(fromLabels.app).toBe('frontend');
  });
});

// ══════════════════════════════════════════════════════════════════
// NAMESPACES & RBAC
// ══════════════════════════════════════════════════════════════════
describe('Namespaces and RBAC', () => {
  let docs;
  beforeAll(() => {
    docs = loadYaml('networking/namespaces-rbac.yaml');
  });

  test('three-tier namespace defined', () => {
    const ns = docs.find(d => d.kind === 'Namespace' && d.metadata.name === 'three-tier');
    expect(ns).toBeDefined();
  });

  test('argocd namespace defined', () => {
    const ns = docs.find(d => d.kind === 'Namespace' && d.metadata.name === 'argocd');
    expect(ns).toBeDefined();
  });

  test('monitoring namespace defined', () => {
    const ns = docs.find(d => d.kind === 'Namespace' && d.metadata.name === 'monitoring');
    expect(ns).toBeDefined();
  });

  test('ServiceAccounts have automountServiceAccountToken: false', () => {
    const sas = docs.filter(d => d.kind === 'ServiceAccount');
    expect(sas.length).toBeGreaterThan(0);
    for (const sa of sas) {
      expect(sa.automountServiceAccountToken).toBe(false);
    }
  });

  test('Role only allows get on secrets', () => {
    const role = docs.find(d => d.kind === 'Role');
    expect(role.rules[0].verbs).toContain('get');
    expect(role.rules[0].verbs).not.toContain('list');
    expect(role.rules[0].verbs).not.toContain('*');
  });

  test('RoleBinding exists', () => {
    expect(docs.find(d => d.kind === 'RoleBinding')).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════
// ARGOCD APPLICATION
// ══════════════════════════════════════════════════════════════════
describe('ArgoCD Application', () => {
  let app;
  beforeAll(() => {
    const f = path.join(__dirname, '../argocd/application.yaml');
    app = yaml.loadAll(fs.readFileSync(f, 'utf8')).filter(Boolean)[0];
  });

  test('kind is Application',             () => expect(app.kind).toBe('Application'));
  test('namespace is argocd',             () => expect(app.metadata.namespace).toBe('argocd'));
  test('has source repoURL',              () => expect(app.spec.source.repoURL).toMatch(/github\.com/));
  test('targetRevision is main',          () => expect(app.spec.source.targetRevision).toBe('main'));
  test('destination is three-tier',       () => expect(app.spec.destination.namespace).toBe('three-tier'));
  test('automated sync enabled',          () => expect(app.spec.syncPolicy.automated).toBeDefined());
  test('selfHeal is true',                () => expect(app.spec.syncPolicy.automated.selfHeal).toBe(true));
  test('prune is true',                   () => expect(app.spec.syncPolicy.automated.prune).toBe(true));
  test('has finalizer for cleanup',       () => {
    expect(app.metadata.finalizers).toContain('resources-finalizer.argocd.argoproj.io');
  });
  test('has retry config',                () => expect(app.spec.syncPolicy.retry).toBeDefined());
});

// ══════════════════════════════════════════════════════════════════
// SECURITY — ALL DEPLOYMENTS
// ══════════════════════════════════════════════════════════════════
describe('Security posture — all Deployments', () => {
  const deploymentFiles = [
    'backend/deployment.yaml',
    'frontend/deployment.yaml',
  ];

  for (const file of deploymentFiles) {
    describe(file, () => {
      let dep;
      beforeAll(() => {
        dep = loadYaml(file).find(d => d.kind === 'Deployment');
      });

      test('runAsNonRoot: true',             () => expect(dep.spec.template.spec.securityContext.runAsNonRoot).toBe(true));
      test('allowPrivilegeEscalation: false',() => expect(dep.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation).toBe(false));
      test('capabilities.drop includes ALL', () => expect(dep.spec.template.spec.containers[0].securityContext.capabilities.drop).toContain('ALL'));
      test('has resource limits',            () => expect(dep.spec.template.spec.containers[0].resources.limits).toBeDefined());
      test('has resource requests',          () => expect(dep.spec.template.spec.containers[0].resources.requests).toBeDefined());
      test('has liveness probe',             () => expect(dep.spec.template.spec.containers[0].livenessProbe).toBeDefined());
      test('has readiness probe',            () => expect(dep.spec.template.spec.containers[0].readinessProbe).toBeDefined());
      test('image pull policy is Always',    () => expect(dep.spec.template.spec.containers[0].imagePullPolicy).toBe('Always'));
    });
  }
});
