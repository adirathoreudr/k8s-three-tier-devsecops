#!/bin/bash
# Jenkins server bootstrap script
# Run this ONCE after Terraform creates the EC2 instance
# Usage: ssh ec2-user@<jenkins-ip> && sudo bash jenkins-setup.sh

set -euo pipefail
echo "══════════════════════════════════════════"
echo "  Jenkins Bootstrap — Three-Tier DevSecOps"
echo "══════════════════════════════════════════"

# ── System update ─────────────────────────────────────────────────
yum update -y

# ── Java 17 (required by Jenkins) ────────────────────────────────
yum install -y java-17-amazon-corretto
java -version

# ── Jenkins ──────────────────────────────────────────────────────
wget -O /etc/yum.repos.d/jenkins.repo \
    https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
yum install -y jenkins
systemctl enable jenkins
systemctl start jenkins
echo "✅ Jenkins installed"

# ── Docker ────────────────────────────────────────────────────────
yum install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker jenkins
echo "✅ Docker installed"

# ── Git ───────────────────────────────────────────────────────────
yum install -y git
echo "✅ Git installed"

# ── kubectl ───────────────────────────────────────────────────────
curl -LO "https://dl.k8s.io/release/v1.29.0/bin/linux/amd64/kubectl"
chmod +x kubectl && mv kubectl /usr/local/bin/
kubectl version --client
echo "✅ kubectl installed"

# ── Helm ──────────────────────────────────────────────────────────
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
echo "✅ Helm installed"

# ── Trivy ─────────────────────────────────────────────────────────
TRIVY_VERSION="0.50.0"
rpm -ivh "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.rpm"
trivy --version
echo "✅ Trivy installed"

# ── SonarQube Scanner ─────────────────────────────────────────────
SONAR_VERSION="5.0.1.3006"
wget "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_VERSION}-linux.zip"
unzip "sonar-scanner-cli-${SONAR_VERSION}-linux.zip" -d /opt/
ln -sf "/opt/sonar-scanner-${SONAR_VERSION}-linux/bin/sonar-scanner" /usr/local/bin/sonar-scanner
sonar-scanner --version
echo "✅ SonarQube Scanner installed"

# ── SonarQube (Docker container) ─────────────────────────────────
docker run -d \
    --name sonarqube \
    --restart unless-stopped \
    -p 9000:9000 \
    -v sonarqube_data:/opt/sonarqube/data \
    -v sonarqube_logs:/opt/sonarqube/logs \
    sonarqube:10-community
echo "✅ SonarQube container started on :9000"

# ── AWS CLI ───────────────────────────────────────────────────────
yum install -y awscli
aws --version
echo "✅ AWS CLI installed"

# ── Print initial Jenkins password ────────────────────────────────
echo "══════════════════════════════════════════"
echo "  Setup complete!"
echo "  Jenkins UI:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo "  SonarQube UI: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):9000"
echo ""
echo "  Jenkins initial admin password:"
cat /var/lib/jenkins/secrets/initialAdminPassword
echo "══════════════════════════════════════════"
