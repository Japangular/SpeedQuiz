# SpeedQuiz deployment — Ansible

Ansible setup that provisions a single Ubuntu host on Hetzner Cloud and
deploys the SpeedQuiz stack (Spring Boot + Postgres + Angular + MeCab) via
Docker Compose, with host-level nginx terminating TLS through Let's Encrypt.

This was built as a personal-project exercise but the patterns are the same
ones the BVA "Application Manager / digitale Beihilfe" role describes:
roles, ansible-vault for secrets, idempotent OS hardening, separate
provisioning vs. release playbooks, Spring Actuator health gating.

---

## What's inside

```
deploy/
├── ansible.cfg
├── inventory.yml                 # one host: the Hetzner VM
├── requirements.yml              # ansible collections (community.general, ansible.posix)
├── site.yml                      # full provision + first deploy
├── deploy.yml                    # release-only (re-runs the speedquiz role)
├── group_vars/all/
│   ├── vars.yml                  # non-secret defaults (domain, user, repo url, ...)
│   └── vault.yml.example         # template for ansible-vault-encrypted secrets
└── roles/
    ├── bootstrap/                # deploy user, SSH hardening, UFW, fail2ban, unattended-upgrades
    ├── docker/                   # Docker Engine + Compose v2 plugin from upstream apt repo
    ├── nginx/                    # host nginx reverse proxy + certbot with auto-renewal
    └── speedquiz/                # git clone, .env from vault, compose.override.yml, docker compose up
```

## One-time setup on your laptop

```bash
# 1. Install Ansible (Ubuntu/Debian)
sudo apt install ansible

# 2. Install required collections
cd deploy
ansible-galaxy collection install -r requirements.yml

# 3. Fill in the TODOs in group_vars/all/vars.yml:
#    - repo_url, domain_name, letsencrypt_email, ssh_public_key
#    Fill in inventory.yml with your Hetzner IP.

# 4. Create the encrypted vault for secrets
cp group_vars/all/vault.yml.example group_vars/all/vault.yml
$EDITOR group_vars/all/vault.yml           # set a real postgres password
ansible-vault encrypt group_vars/all/vault.yml
# (Pick a vault password and remember it; you'll type it on each run, or
#  configure ANSIBLE_VAULT_PASSWORD_FILE for a file-based one.)
```

## First run (provision + deploy)

```bash
ansible-playbook site.yml --ask-vault-pass
```

This will:

1. Harden the box (SSH drop-in disables password + root-password login, UFW
   open only on 22/80/443, fail2ban, unattended security upgrades).
2. Install Docker Engine and the Compose v2 plugin.
3. Install host nginx and obtain a Let's Encrypt cert (the certbot.timer is
   enabled so the cert renews automatically — this is the bit that was
   missing the last time around).
4. Clone the repo, render `.env` and `compose.override.yml`, run
   `docker compose up -d --build --remove-orphans`.
5. Poll `/api/actuator/health` until status is `UP`.

## Subsequent releases

Push to GitHub, then:

```bash
ansible-playbook deploy.yml --ask-vault-pass
```

The release playbook re-clones at the configured branch, re-renders templates,
rebuilds + restarts compose, and re-runs the health check.

## Things to be able to talk about in the Vorstellungsgespräch

- **Roles** as the unit of reuse (`bootstrap`, `docker`, `nginx`,
  `speedquiz`). Roles separate concerns and let one playbook orchestrate them.
- **ansible-vault** for `POSTGRES_PASSWORD`. In a federal setting you'd
  swap this for something like HashiCorp Vault or the customer's internal
  secret store; the *pattern* of "no plaintext credentials in git" is the
  point.
- **compose.override.yml** as a way to keep the application repo immutable
  and configure only the environment. The override `!reset`s every dev port
  binding and binds the public nginx to `127.0.0.1` only — defense in depth
  on top of the UFW firewall.
- **certbot.timer** = systemd timer = the renewal mechanism that was missing
  previously. Renews twice daily if the cert is within 30 days of expiry.
- **Spring Actuator** `/actuator/health` polled by the deploy playbook,
  with a `until/retries/delay` loop — this is the same shape you'd put into
  a CI/CD gate.
- **Idempotency**: every task is safe to re-run, which is *why* you'd use
  Ansible over a shell script. `creates:`, `state: present`, handlers etc.
- **Where this would differ in BVA-land**: artifacts would come from
  Nexus/Artifactory rather than be built on the host; the OS would likely
  be RHEL/SLES rather than Ubuntu (apt -> dnf/zypper); secrets from a
  centralized store; logging shipped to a central aggregator (IsyFact's
  `isy-logging` writes JSON with correlation IDs into MDC, which fits any
  ELK-style sink). The Ansible structure itself is the same.
