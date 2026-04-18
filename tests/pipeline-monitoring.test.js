/**
 * PHASE 4 + 5 — Pipeline & Monitoring Validation Tests
 * Validates Jenkinsfiles have all 9 stages, security gates are present,
 * Prometheus rules are valid, Helm values are complete.
 */
const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');

// ══════════════════════════════════════════════════════════════════
// JENKINSFILE VALIDATION
// ══════════════════════════════════════════════════════════════════
describe('Jenkinsfile — Backend', () => {
  let jf;
  beforeAll(() => {
    jf = fs.readFileSync(path.join(ROOT, 'Jenkins-Pipeline-Code/Jenkinsfile-Backend'), 'utf8');
  });

  // All 9 stages present
  const stages = [
    '1. Checkout',
    '2. SonarQube Analysis',
    '3. Quality Gate',
    '4. OWASP Dependency Check',
    '5. Unit Tests',
    '6. Docker Build',
    '7. Trivy Security Scan',
    '8. Push to ECR',
    '9. Update Helm Values',
  ];
  for (const s of stages) {
    test(`has stage: ${s}`, () => expect(jf).toContain(s));
  }

  test('aborts pipeline on Quality Gate fail',     () => expect(jf).toContain('abortPipeline: true'));
  test('Trivy exits with code 1 on CRITICAL',      () => expect(jf).toContain('--exit-code 1'));
  test('OWASP fails on CVSS >= 7',                 () => expect(jf).toContain('--failOnCVSS 7'));
  test('uses ECR credentials',                     () => expect(jf).toContain('ecr-registry'));
  test('uses AWS credentials',                     () => expect(jf).toContain('aws-credentials'));
  test('uses github-token for push',               () => expect(jf).toContain('github-token'));
  test('cleans workspace on completion',           () => expect(jf).toContain('cleanWs()'));
  test('removes docker images after push',         () => expect(jf).toContain('docker rmi'));
  test('sends failure email',                      () => expect(jf).toContain('mail to:'));
  test('[skip ci] in git commit to avoid loop',    () => expect(jf).toContain('[skip ci]'));
  test('has timeout option',                       () => expect(jf).toContain('timeout('));
  test('IMAGE_TAG includes BUILD_NUMBER',          () => expect(jf).toContain('BUILD_NUMBER'));
  test('IMAGE_TAG includes GIT_COMMIT',            () => expect(jf).toContain('GIT_COMMIT'));
  test('archives Trivy report',                    () => expect(jf).toContain('trivy-backend-report.html'));
  test('updates helm/values.yaml for GitOps',      () => expect(jf).toContain('helm/values.yaml'));
});

describe('Jenkinsfile — Frontend', () => {
  let jf;
  beforeAll(() => {
    jf = fs.readFileSync(path.join(ROOT, 'Jenkins-Pipeline-Code/Jenkinsfile-Frontend'), 'utf8');
  });

  const stages = [
    '1. Checkout',
    '2. SonarQube Analysis',
    '3. Quality Gate',
    '4. OWASP Dependency Check',
    '5. Build React App',
    '6. Docker Build',
    '7. Trivy Security Scan',
    '8. Push to ECR',
    '9. Update Helm Values',
  ];
  for (const s of stages) {
    test(`has stage: ${s}`, () => expect(jf).toContain(s));
  }

  test('aborts on Quality Gate fail', () => expect(jf).toContain('abortPipeline: true'));
  test('Trivy exits 1 on CRITICAL',   () => expect(jf).toContain('--exit-code 1'));
  test('builds React app',            () => expect(jf).toContain('npm run build'));
  test('cleans workspace',            () => expect(jf).toContain('cleanWs()'));
  test('[skip ci] commit tag',        () => expect(jf).toContain('[skip ci]'));
});

// ══════════════════════════════════════════════════════════════════
// TERRAFORM FILES
// ══════════════════════════════════════════════════════════════════
describe('Terraform — main.tf', () => {
  let tf;
  beforeAll(() => {
    tf = fs.readFileSync(path.join(ROOT, 'terraform/main.tf'), 'utf8');
  });

  test('requires terraform >= 1.5.0',      () => expect(tf).toContain('>= 1.5.0'));
  test('uses AWS provider ~> 5.0',         () => expect(tf).toContain('~> 5.0'));
  test('has S3 backend configured',        () => expect(tf).toContain('backend "s3"'));
  test('state is encrypted',               () => expect(tf).toContain('encrypt        = true'));
  test('has dynamodb_table for locking',   () => expect(tf).toContain('dynamodb_table'));
  test('calls vpc module',                 () => expect(tf).toContain('module "vpc"'));
  test('calls eks module',                 () => expect(tf).toContain('module "eks"'));
  test('calls jenkins module',             () => expect(tf).toContain('module "jenkins"'));
  test('calls ecr module',                 () => expect(tf).toContain('module "ecr"'));
  test('calls iam module',                 () => expect(tf).toContain('module "iam"'));
  test('eks depends on vpc',               () => expect(tf).toContain('depends_on = [module.vpc]'));
  test('has default_tags for all resources',() => expect(tf).toContain('default_tags'));
});

describe('Terraform — variables.tf', () => {
  let tf;
  beforeAll(() => {
    tf = fs.readFileSync(path.join(ROOT, 'terraform/variables.tf'), 'utf8');
  });

  const vars = ['aws_region','project_name','environment','vpc_cidr','cluster_name',
                 'kubernetes_version','node_instance_type','node_desired_size',
                 'node_min_size','node_max_size','jenkins_instance_type','key_pair_name'];
  for (const v of vars) {
    test(`declares variable: ${v}`, () => expect(tf).toContain(`variable "${v}"`));
  }

  test('environment has validation', () => expect(tf).toContain('validation'));
  test('project_name has validation',() => expect(tf).toContain('can(regex('));
  test('env default is dev',         () => expect(tf).toContain('"dev"'));
});

describe('Terraform — VPC module', () => {
  let tf;
  beforeAll(() => {
    tf = fs.readFileSync(path.join(ROOT, 'terraform/modules/vpc/main.tf'), 'utf8');
  });

  test('creates aws_vpc',                    () => expect(tf).toContain('resource "aws_vpc"'));
  test('enables DNS support',                () => expect(tf).toContain('enable_dns_support   = true'));
  test('enables DNS hostnames',              () => expect(tf).toContain('enable_dns_hostnames = true'));
  test('creates 2 public subnets',           () => expect(tf).toContain('count                   = 2'));
  test('creates 2 private subnets',          () => expect(tf).toContain('count             = 2'));
  test('creates internet gateway',           () => expect(tf).toContain('resource "aws_internet_gateway"'));
  test('creates NAT gateways',               () => expect(tf).toContain('resource "aws_nat_gateway"'));
  test('creates elastic IPs for NAT',        () => expect(tf).toContain('resource "aws_eip"'));
  test('creates public route table',         () => expect(tf).toContain('resource "aws_route_table" "public"'));
  test('creates private route tables',       () => expect(tf).toContain('resource "aws_route_table" "private"'));
  test('public subnet tags ELB role',        () => expect(tf).toContain('"kubernetes.io/role/elb"'));
  test('private subnet tags internal-elb',  () => expect(tf).toContain('"kubernetes.io/role/internal-elb"'));
});

describe('Terraform — EKS module', () => {
  let tf;
  beforeAll(() => {
    tf = fs.readFileSync(path.join(ROOT, 'terraform/modules/eks/main.tf'), 'utf8');
  });

  test('creates EKS cluster',              () => expect(tf).toContain('resource "aws_eks_cluster"'));
  test('creates node group',               () => expect(tf).toContain('resource "aws_eks_node_group"'));
  test('enables cluster audit logging',    () => expect(tf).toContain('"audit"'));
  test('creates cluster IAM role',         () => expect(tf).toContain('resource "aws_iam_role" "eks_cluster"'));
  test('creates node IAM role',            () => expect(tf).toContain('resource "aws_iam_role" "eks_node"'));
  test('attaches ECR read policy to nodes',() => expect(tf).toContain('AmazonEC2ContainerRegistryReadOnly'));
  test('endpoint private access true',     () => expect(tf).toContain('endpoint_private_access = true'));
  test('has security group',               () => expect(tf).toContain('resource "aws_security_group" "eks_cluster"'));
  test('update_config maxUnavailable=1',   () => expect(tf).toContain('max_unavailable = 1'));
});

describe('Terraform — ECR module', () => {
  let tf;
  beforeAll(() => {
    tf = fs.readFileSync(path.join(ROOT, 'terraform/modules/ecr/main.tf'), 'utf8');
  });

  test('scan_on_push is true',           () => expect(tf).toContain('scan_on_push = true'));
  test('uses AES256 encryption',         () => expect(tf).toContain('AES256'));
  test('has lifecycle policy',           () => expect(tf).toContain('resource "aws_ecr_lifecycle_policy"'));
  test('keeps last 10 images',           () => expect(tf).toContain('countNumber = 10'));
  test('uses for_each for repos',        () => expect(tf).toContain('for_each'));
});

// ══════════════════════════════════════════════════════════════════
// PROMETHEUS ALERT RULES
// ══════════════════════════════════════════════════════════════════
describe('Prometheus Alert Rules', () => {
  let rules;
  beforeAll(() => {
    const f = path.join(ROOT, 'monitoring/alerts/prometheus-rules.yaml');
    rules = yaml.load(fs.readFileSync(f, 'utf8'));
  });

  test('kind is PrometheusRule',           () => expect(rules.kind).toBe('PrometheusRule'));
  test('namespace is monitoring',          () => expect(rules.metadata.namespace).toBe('monitoring'));
  test('has 3 rule groups',               () => expect(rules.spec.groups.length).toBe(3));

  test('pod-health group exists',          () => {
    expect(rules.spec.groups.find(g => g.name === 'pod-health')).toBeDefined();
  });
  test('node-health group exists',         () => {
    expect(rules.spec.groups.find(g => g.name === 'node-health')).toBeDefined();
  });
  test('app-health group exists',          () => {
    expect(rules.spec.groups.find(g => g.name === 'app-health')).toBeDefined();
  });

  test('PodCrashLooping alert defined',    () => {
    const pod = rules.spec.groups.find(g => g.name === 'pod-health');
    expect(pod.rules.find(r => r.alert === 'PodCrashLooping')).toBeDefined();
  });

  test('NodeHighCPU alert defined',        () => {
    const node = rules.spec.groups.find(g => g.name === 'node-health');
    expect(node.rules.find(r => r.alert === 'NodeHighCPU')).toBeDefined();
  });

  test('MongoDBDown alert defined',        () => {
    const app = rules.spec.groups.find(g => g.name === 'app-health');
    expect(app.rules.find(r => r.alert === 'MongoDBDown')).toBeDefined();
  });

  test('all alerts have severity label',   () => {
    for (const group of rules.spec.groups) {
      for (const rule of group.rules) {
        if (rule.alert) {
          expect(rule.labels?.severity).toMatch(/^(critical|warning)$/);
        }
      }
    }
  });

  test('all alerts have summary annotation', () => {
    for (const group of rules.spec.groups) {
      for (const rule of group.rules) {
        if (rule.alert) {
          expect(rule.annotations?.summary).toBeDefined();
        }
      }
    }
  });

  test('critical alerts have short "for" duration', () => {
    for (const group of rules.spec.groups) {
      for (const rule of group.rules) {
        if (rule.labels?.severity === 'critical') {
          // Should fire within 2m not 10m
          expect(rule.for).toBeDefined();
          expect(rule.for).toMatch(/^[1-5]m$/);
        }
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// HELM VALUES
// ══════════════════════════════════════════════════════════════════
describe('Helm values.yaml', () => {
  let values;
  beforeAll(() => {
    const f = path.join(ROOT, 'helm/values.yaml');
    values  = yaml.load(fs.readFileSync(f, 'utf8'));
  });

  test('has global section',              () => expect(values.global).toBeDefined());
  test('has global namespace',            () => expect(values.global.namespace).toBe('three-tier'));
  test('has frontend section',            () => expect(values.frontend).toBeDefined());
  test('has backend section',             () => expect(values.backend).toBeDefined());
  test('has mongodb section',             () => expect(values.mongodb).toBeDefined());
  test('backend port is 3500',            () => expect(values.backend.port).toBe(3500));
  test('frontend has image tag',          () => expect(values.frontend.image.tag).toBeDefined());
  test('backend has image tag',           () => expect(values.backend.image.tag).toBeDefined());
  test('mongodb storage defined',         () => expect(values.mongodb.storage).toBeDefined());
  test('backend replicas >= 2',           () => expect(values.backend.replicas).toBeGreaterThanOrEqual(2));
  test('frontend replicas >= 2',          () => expect(values.frontend.replicas).toBeGreaterThanOrEqual(2));
});

// ══════════════════════════════════════════════════════════════════
// DOCKERFILES
// ══════════════════════════════════════════════════════════════════
describe('Backend Dockerfile', () => {
  let df;
  beforeAll(() => {
    df = fs.readFileSync(path.join(ROOT, 'Application-Code/backend/Dockerfile'), 'utf8');
  });

  test('uses node:18-alpine base',       () => expect(df).toContain('node:18-alpine'));
  test('multi-stage build',              () => expect(df).toContain('AS deps'));
  test('runs npm ci (not npm install)',   () => expect(df).toContain('npm ci'));
  test('cleans npm cache',               () => expect(df).toContain('npm cache clean'));
  test('runs as non-root user',          () => expect(df).toContain('USER appuser'));
  test('creates non-root user',          () => expect(df).toContain('adduser'));
  test('exposes port 3500',              () => expect(df).toContain('EXPOSE 3500'));
  test('has HEALTHCHECK',                () => expect(df).toContain('HEALTHCHECK'));
  test('copies only production modules', () => expect(df).toContain('--only=production'));
  test('chowns files to appuser',        () => expect(df).toContain('--chown=appuser'));
});

describe('Frontend Dockerfile', () => {
  let df;
  beforeAll(() => {
    df = fs.readFileSync(path.join(ROOT, 'Application-Code/frontend/Dockerfile'), 'utf8');
  });

  test('uses node:18-alpine for build',  () => expect(df).toContain('node:18-alpine'));
  test('multi-stage: builder stage',     () => expect(df).toContain('AS builder'));
  test('multi-stage: production stage',  () => expect(df).toContain('AS production'));
  test('serves with nginx',              () => expect(df).toContain('nginx'));
  test('copies built files from builder',() => expect(df).toContain('--from=builder'));
  test('exposes port 80',               () => expect(df).toContain('EXPOSE 80'));
  test('has HEALTHCHECK',               () => expect(df).toContain('HEALTHCHECK'));
  test('copies custom nginx.conf',      () => expect(df).toContain('nginx.conf'));
});

describe('Nginx config', () => {
  let nc;
  beforeAll(() => {
    nc = fs.readFileSync(path.join(ROOT, 'Application-Code/frontend/nginx.conf'), 'utf8');
  });

  test('listens on port 80',                  () => expect(nc).toContain('listen       80'));
  test('SPA fallback to index.html',          () => expect(nc).toContain('try_files $uri $uri/ /index.html'));
  test('proxies /api to backend',             () => expect(nc).toContain('proxy_pass') && expect(nc).toContain('/api/'));
  test('X-Frame-Options header',              () => expect(nc).toContain('X-Frame-Options'));
  test('X-Content-Type-Options header',       () => expect(nc).toContain('X-Content-Type-Options'));
  test('static asset caching',                () => expect(nc).toContain('expires 1y'));
  test('gzip enabled',                        () => expect(nc).toContain('gzip on'));
  test('blocks hidden files',                 () => expect(nc).toContain('deny all'));
});
