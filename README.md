<div id="readme-top" align="center">

# ☸️ End-to-End Kubernetes Three-Tier DevSecOps Project

**A production-grade DevSecOps platform** — React frontend + Node.js API + MongoDB, deployed on AWS EKS with full CI/CD, GitOps, security scanning, and real-time monitoring.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://your-vercel-url.vercel.app)
[![Tests](https://img.shields.io/badge/Tests-282_passing-brightgreen?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

![AWS](https://img.shields.io/badge/AWS-FF9900?style=flat&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=flat&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat&logo=jenkins&logoColor=white)
![ArgoCD](https://img.shields.io/badge/ArgoCD-EF7B4D?style=flat&logo=argo&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)

</div>

---

## 📋 Table of Contents

<details>
<summary>Expand</summary>

1. [Problem Statement](#problem-statement)
2. [Live Demo](#live-demo)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Credentials You Need](#credentials-you-need)
6. [Quick Start — Vercel (No Setup)](#quick-start--vercel-no-setup)
7. [Full AWS Deployment](#full-aws-deployment)
   - [Phase 1: Terraform Infrastructure](#phase-1-terraform-infrastructure)
   - [Phase 2: Dockerize & Push](#phase-2-dockerize--push)
   - [Phase 3: Kubernetes Deployment](#phase-3-kubernetes-deployment)
   - [Phase 4: Jenkins CI/CD](#phase-4-jenkins-cicd)
   - [Phase 5: Monitoring](#phase-5-monitoring)
8. [Project Structure](#project-structure)
9. [Running Tests](#running-tests)
10. [Security Controls](#security-controls)
11. [What I'd Improve Next](#what-id-improve-next)
12. [License](#license)

</details>

---

## ❗ Problem Statement

Traditional deployments bolt security on at the end, use manual infrastructure, and have no automated delivery. This causes:

- Vulnerabilities found **late** — expensive to fix
- **Snowflake environments** that can't be reproduced
- **Manual deployments** — slow, error-prone
- **No observability** when things break in production

**This project solves all four** — security gates in every pipeline stage, 100% infrastructure-as-code, automated GitOps delivery, and real-time Prometheus/Grafana monitoring.

---

## 🌐 Live Demo

The full three-tier app (React + Node.js API) is deployed on Vercel — no setup needed. Tasks are stored in-memory; connect a MongoDB Atlas URL via the `MONGO_URI` environment variable for persistence.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    INTERNET / USER                    │
└─────────────────────────┬────────────────────────────┘
                          │ HTTPS
                    AWS ALB (Ingress)
                          │
        ┌─────────────────┴─────────────────┐
        │           EKS CLUSTER             │
        │                                   │
        │  [TIER 1]  frontend pods (nginx)  │
        │       ↓ /api/* proxy              │
        │  [TIER 2]  backend pods (Node.js) │
        │       ↓ MongoDB driver            │
        │  [TIER 3]  MongoDB StatefulSet    │
        │            EBS Persistent Volume  │
        └───────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  CI/CD PIPELINE                      │
│                                                      │
│  git push → Jenkins → SonarQube → OWASP Dep-Check   │
│           → Docker Build → Trivy Scan → ECR Push     │
│           → Update Helm values → ArgoCD syncs EKS   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                     │
│  Terraform → VPC → EKS → ECR → Jenkins EC2 → IAM   │
│  Prometheus + Grafana → cluster metrics + alerts    │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Cloud | AWS | All infrastructure |
| IaC | Terraform 1.5+ | VPC, EKS, EC2, ECR, IAM |
| Orchestration | Amazon EKS (K8s 1.29) | Container runtime |
| CI/CD | Jenkins | Build, test, scan, push |
| GitOps | ArgoCD | Deploy from Git to cluster |
| Packaging | Helm | Templated K8s deployments |
| SAST | SonarQube | Static code analysis |
| Image Scan | Trivy | CVE scanning |
| Dep Scan | OWASP Dependency-Check | OSS vulnerabilities |
| Metrics | Prometheus | Time-series monitoring |
| Dashboards | Grafana | Visualisation + alerting |
| Frontend | React 18 | Task manager UI |
| Backend | Node.js / Express 4 | REST API |
| Database | MongoDB 6 | Document store |
| Containers | Docker | Multi-stage builds |
| Delivery | Vercel | Public demo deployment |

---

## 🔑 Credentials You Need

> **Everything you need to provide, and exactly where to put it.**

### For Vercel Deployment (minimal)

| Credential | Where to set it | How to get it |
|---|---|---|
| `MONGO_URI` | Vercel → Project → Settings → Environment Variables | [MongoDB Atlas](https://cloud.mongodb.com) → free cluster → Connect → Driver URI |

That's it for Vercel. The app runs without MongoDB too (in-memory).

---

### For Full AWS Deployment

#### 1. AWS Credentials

```bash
aws configure
# AWS Access Key ID:     your IAM key
# AWS Secret Access Key: your IAM secret
# Default region:        us-east-1
# Output format:         json
```

Get from: AWS Console → IAM → Your user → Security credentials → Create access key.
Attach policies: `AmazonEC2FullAccess`, `AmazonEKSFullAccess`, `AmazonECRFullAccess`, `IAMFullAccess`, `AmazonS3FullAccess`, `AmazonDynamoDBFullAccess`.

---

#### 2. `terraform/terraform.tfvars` — copy from example, fill in

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

```hcl
# terraform/terraform.tfvars
aws_region        = "us-east-1"
project_name      = "three-tier"
key_pair_name     = "YOUR-EC2-KEY-PAIR-NAME"   # ← EC2 → Key Pairs → create one
```

---

#### 3. Terraform backend — one-time manual setup

```bash
# Create S3 bucket for state
aws s3api create-bucket --bucket YOUR-UNIQUE-BUCKET-NAME --region us-east-1
aws s3api put-bucket-versioning --bucket YOUR-UNIQUE-BUCKET-NAME \
  --versioning-configuration Status=Enabled

# Create DynamoDB lock table
aws dynamodb create-table --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

Then update `terraform/main.tf` backend block:
```hcl
backend "s3" {
  bucket         = "YOUR-UNIQUE-BUCKET-NAME"   # ← change this
  ...
}
```

---

#### 4. Jenkins Credentials (add via Jenkins UI → Manage Jenkins → Credentials)

| ID | Type | Value |
|---|---|---|
| `aws-credentials` | AWS Credentials | Your AWS Access Key + Secret |
| `ecr-registry` | Secret Text | `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com` |
| `github-token` | Secret Text | GitHub → Settings → Developer settings → Personal access tokens |
| `sonar-token-backend` | Secret Text | SonarQube UI → My Account → Security → Generate Token |
| `sonar-token-frontend` | Secret Text | Same as above, different project |

---

#### 5. K8s manifests — replace these placeholders

| File | Placeholder | Replace with |
|---|---|---|
| `Kubernetes-Manifests/backend/deployment.yaml` | `ACCOUNT_ID` | Your 12-digit AWS account ID |
| `Kubernetes-Manifests/frontend/deployment.yaml` | `ACCOUNT_ID` | Your 12-digit AWS account ID |
| `Kubernetes-Manifests/networking/ingress.yaml` | `your-domain.com` | Your domain |
| `Kubernetes-Manifests/networking/ingress.yaml` | `ACCOUNT_ID:certificate/YOUR-CERT-ID` | ACM cert ARN |
| `argocd/application.yaml` | `YOUR-ORG` | Your GitHub username/org |
| `helm/values.yaml` | `ACCOUNT_ID` | Your AWS account ID |
| `monitoring/prometheus-grafana-values.yaml` | `yourcompany.com` | Your email domain |

---

## ⚡ Quick Start — Vercel (No Setup)

Deploy the full app publicly in 2 minutes:

```bash
# 1. Fork this repo on GitHub

# 2. Go to vercel.com → New Project → Import your fork

# 3. Vercel auto-detects settings from vercel.json — just click Deploy

# 4. (Optional) Add MONGO_URI env var in Vercel settings for persistence
```

**That's it.** The app is live.

---

## 🚀 Full AWS Deployment

### Phase 1: Terraform Infrastructure

```bash
cd terraform/

# Fill in your values first
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars

terraform init
terraform validate
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars --auto-approve

# Configure kubectl
aws eks update-kubeconfig --name three-tier-eks --region us-east-1
kubectl get nodes   # should show 3 Ready nodes
```

---

### Phase 2: Dockerize & Push

```bash
# Get your ECR URL from Terraform output
export ECR=$(terraform output -raw ecr_backend_url | cut -d/ -f1)

# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR

# Backend
docker build -t $ECR/three-tier-backend:v1.0 Application-Code/backend/
trivy image --severity CRITICAL --exit-code 1 $ECR/three-tier-backend:v1.0
docker push $ECR/three-tier-backend:v1.0

# Frontend
docker build -t $ECR/three-tier-frontend:v1.0 Application-Code/frontend/
trivy image --severity CRITICAL --exit-code 1 $ECR/three-tier-frontend:v1.0
docker push $ECR/three-tier-frontend:v1.0
```

---

### Phase 3: Kubernetes Deployment

```bash
# Namespaces and RBAC (once)
kubectl apply -f Kubernetes-Manifests/networking/namespaces-rbac.yaml

# MongoDB secret (replace the URI with your actual value)
kubectl create secret generic mongo-secret \
  --from-literal=MONGO_URI='mongodb://mongodb-service:27017/taskdb' \
  -n three-tier

# Deploy everything
kubectl apply -f Kubernetes-Manifests/database/     -n three-tier
kubectl apply -f Kubernetes-Manifests/backend/      -n three-tier
kubectl apply -f Kubernetes-Manifests/frontend/     -n three-tier
kubectl apply -f Kubernetes-Manifests/networking/   -n three-tier

# Install ArgoCD
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f argocd/application.yaml -n argocd

# Get app URL
kubectl get ingress -n three-tier
```

---

### Phase 4: Jenkins CI/CD

```bash
# SSH into Jenkins server
ssh -i your-key.pem ec2-user@$(terraform output -raw jenkins_public_ip)

# Run bootstrap script
sudo bash /home/claude/project/scripts/jenkins-setup.sh
```

Then in Jenkins UI (`http://<jenkins-ip>:8080`):
1. Install plugins: Pipeline, Git, Docker Pipeline, SonarQube Scanner, OWASP Dependency-Check, AWS Steps
2. Add credentials (see table above)
3. New Item → Pipeline → script from SCM → `Jenkins-Pipeline-Code/Jenkinsfile-Backend`
4. Repeat for frontend

---

### Phase 5: Monitoring

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  -f monitoring/prometheus-grafana-values.yaml \
  -n monitoring

kubectl apply -f monitoring/alerts/prometheus-rules.yaml -n monitoring

# Get Grafana URL
kubectl get svc -n monitoring kube-prometheus-stack-grafana
```

Import dashboards in Grafana UI: IDs `7249`, `1860`, `13770`, `9614`

---

## 📁 Project Structure

```
k8s-three-tier-devsecops/
├── api/                          # Vercel serverless entry
│   └── index.js
├── Application-Code/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.js            # Express app
│   │   │   ├── index.js          # Server entry
│   │   │   ├── routes/           # tasks.js, health.js
│   │   │   └── models/           # TaskStore.js
│   │   ├── tests/api.test.js     # 35 API tests
│   │   └── Dockerfile
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx           # React UI
│       │   └── index.js
│       ├── public/index.html
│       ├── nginx.conf
│       └── Dockerfile
├── terraform/
│   ├── main.tf                   # Root module
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars.example  # Copy → terraform.tfvars
│   └── modules/
│       ├── vpc/                  # VPC, subnets, IGW, NAT
│       ├── eks/                  # Cluster, node groups, IAM
│       ├── ecr/                  # Container registries
│       ├── jenkins/              # EC2 CI server
│       └── iam/                  # IAM roles
├── Kubernetes-Manifests/
│   ├── database/                 # MongoDB StatefulSet, Service, Secret
│   ├── backend/                  # Deployment, Service, HPA
│   ├── frontend/                 # Deployment, Service, HPA
│   └── networking/               # Ingress, NetworkPolicies, RBAC
├── helm/values.yaml              # Image tags updated by Jenkins
├── argocd/application.yaml       # GitOps — auto-sync to EKS
├── Jenkins-Pipeline-Code/
│   ├── Jenkinsfile-Backend       # 9-stage pipeline
│   └── Jenkinsfile-Frontend
├── monitoring/
│   ├── alerts/prometheus-rules.yaml
│   └── prometheus-grafana-values.yaml
├── scripts/jenkins-setup.sh      # Jenkins EC2 bootstrap
├── tests/
│   ├── k8s-manifests.test.js     # 130 K8s validation tests
│   └── pipeline-monitoring.test.js # 117 pipeline/infra tests
├── vercel.json                   # Vercel deployment config
└── README.md
```

---

## 🧪 Running Tests

```bash
# Install deps
npm install && cd Application-Code/backend && npm install && cd ../..

# All 282 tests
npm test

# API tests only (runs the actual server)
cd Application-Code/backend && NODE_ENV=test npx jest tests/ --forceExit

# Infra/manifest/pipeline tests
npx jest tests/ --forceExit --verbose
```

**Test coverage:**
- 35 API tests — health, CRUD, validation, security headers, error handling
- 130 K8s manifest tests — structure, security posture, resource limits, probes
- 117 pipeline + infra tests — Jenkinsfiles, Terraform modules, Dockerfiles, Prometheus rules

---

## 🔒 Security Controls

| Layer | Control | Enforcement |
|---|---|---|
| Code | SonarQube SAST | Pipeline gate — blocks on Quality Gate fail |
| Dependencies | OWASP Dep-Check | Pipeline gate — blocks on CVSS ≥ 7 |
| Images | Trivy CVE scan | Pipeline gate — blocks on CRITICAL |
| Runtime | Non-root containers | All pods run as non-root, readOnlyRootFilesystem |
| Runtime | Drop ALL capabilities | All containers drop Linux capabilities |
| Network | NetworkPolicy | Default-deny-all + explicit allow per tier |
| Cluster | RBAC | Least-privilege ServiceAccounts, no auto-mount |
| Cloud | IAM least privilege | Scoped roles per component |
| State | Encrypted TF state | S3 server-side encryption + DynamoDB lock |
| Audit | CloudTrail | All AWS API calls logged |

---

## 🔮 What I'd Improve Next

1. **DAST** — OWASP ZAP active scan against staging after deploy
2. **AWS Secrets Manager** — replace K8s Secrets with External Secrets Operator
3. **Karpenter** — replace Cluster Autoscaler for 30-second node scaling
4. **Istio** — mTLS between pods, circuit breaking, distributed tracing
5. **OPA Gatekeeper** — policy-as-code to enforce no-root, image registry rules
6. **Grafana Loki** — centralised log aggregation alongside metrics

---

## 📄 License

MIT © 2026

<p align="right"><a href="#readme-top">back to top ↑</a></p>
