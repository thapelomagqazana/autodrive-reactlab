# Security Policy

## Supported Versions

AutoDrive Lab is an active learning, engineering, and portfolio project.

Security fixes are applied to the latest version of the `main` branch.

| Version / Branch  | Supported |
| ----------------- | --------- |
| `main`            | Yes       |
| Feature branches  | No        |
| Archived branches | No        |

---

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately by emailing:

```text
tapsmcgzee8@gmail.com
```

Please include:

- A clear description of the issue
- Steps to reproduce it
- Affected files, components, or workflows
- Expected impact
- Screenshots, logs, or proof-of-concept details where safe
- Suggested fix, if available

---

## Response Expectations

This project is independently maintained, so response times may vary.

| Step                      | Target                                 |
| ------------------------- | -------------------------------------- |
| Acknowledge report        | Within 7 days                          |
| Investigate issue         | Within 14 days                         |
| Provide fix or mitigation | As soon as practical                   |
| Public disclosure         | After a fix or mitigation is available |

---

## Security Scope

In scope:

- React frontend code
- TypeScript source files
- Zustand state management
- Canvas rendering logic
- Keyboard input handling
- GitHub Actions workflows
- Build and test configuration
- Dependency vulnerabilities
- Secret exposure in repository history

Out of scope:

- Social engineering
- Physical access attacks
- Browser extensions interfering with the app
- Issues caused by modified local builds
- Denial-of-service against GitHub, GitHub Pages, or hosting providers
- Test-only mock data with no production impact

---

## Secrets Policy

Do not commit secrets to this repository.

Never commit:

```text
.env
.env.local
API keys
Access tokens
Private keys
Passwords
Database URLs
OAuth secrets
Cloud credentials
```

Recommended `.gitignore` entries:

```gitignore
.env
.env.local
.env.*.local
```

If a secret is accidentally committed:

1. Revoke the secret immediately.
2. Rotate it with a new value.
3. Remove it from repository history if necessary.
4. Review GitHub secret scanning alerts.
5. Open a private security report if the exposure may affect users.

---

## Dependency Security

This repository uses npm dependencies.

Recommended protections:

- Dependabot alerts
- Dependabot security updates
- GitHub dependency graph
- CodeQL scanning
- Secret scanning
- Push protection

Check dependencies locally:

```bash
npm audit
```

Install dependencies safely:

```bash
npm ci
```

---

## Secure Development Practices

Contributors should:

- Use pull requests for all changes.
- Keep `main` protected.
- Require CI before merging.
- Avoid unsafe dynamic code execution.
- Avoid storing sensitive data in frontend state.
- Avoid exposing private credentials in logs.
- Validate inputs in pure helper functions.
- Keep dependencies updated.

Before merging, run:

```bash
npm test
npm run test:e2e
npm run build
```

---

## Repository Protection Checklist

Recommended GitHub settings:

- CodeQL enabled
- Secret scanning enabled
- Push protection enabled
- Dependabot alerts enabled
- Dependabot security updates enabled
- Dependency graph enabled
- Branch protection enabled for `main`
- Pull requests required before merging
- Required status checks enabled
- Force pushes disabled
- Branch deletion disabled

---

## Disclosure Policy

Security reports should remain private until:

1. The issue has been confirmed.
2. A fix or mitigation is available.
3. Public disclosure is safe.

Public disclosure may include:

- GitHub Security Advisory
- Release note
- Changelog entry
- Pull request reference

---

## Thank You

Responsible disclosure helps make AutoDrive Lab safer, more reliable, and more professional.

Thank you for helping improve the project.
