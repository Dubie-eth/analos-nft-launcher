# Security Policy

## Reporting a Vulnerability

The Analos team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please DO NOT file a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities through one of these channels:

1. **Email:** security@analos.io
2. **Twitter DM:** [@EWildn](https://twitter.com/EWildn)
3. **Telegram:** [t.me/Dubie_420](https://t.me/Dubie_420)

### What to Include

Please include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a more detailed response within 5 business days
- We will keep you informed of the progress towards fixing the vulnerability
- We may ask for additional information or guidance

### Bug Bounty Program

We are working on establishing a bug bounty program. Until then, we will:

- Publicly acknowledge researchers who report valid vulnerabilities (if desired)
- Provide attribution in our security advisories
- Consider rewards for critical findings on a case-by-case basis

### Scope

This security policy applies to the following Analos programs:

1. **Analos NFT Launchpad** - `5gmaywNK418QzG7eFA7qZLJkCGS8cfcPtm4b2RZQaJHT`
2. **Analos Token Launch** - `CDJZZCSod3YS9crpWAvWSLWEpPyx9QZCRRAcv7xL1FZf`
3. **Analos Rarity Oracle** - `3cnHMbD3Y88BZbxEPzv7WZGkN12X2bwKEP4FFtaVd5B2`
4. **Analos Price Oracle** - `5ihyquuoRJXTocBhjEA48rGQGsM9ZB6HezYE1dQq8NUD`
5. **Analos OTC Enhanced** - `7hnWVgRxu2dNWiNAzNB2jWoubzMcdY6HNysjhLiawXPY`
6. **Analos Airdrop Enhanced** - `J2D1LiSGxj9vTN7vc3CUD1LkrnqanAeAoAhE2nvvyXHC`
7. **Analos Vesting Enhanced** - `Ae3hXKsHzYPCPUKLtq2mdYZ3E2oKeKrF63ekceGxpHsY`
8. **Analos Token Lock Enhanced** - `3WmPLvyFpmQ8yPHh7nLxj6FLSATn2uVeD2ceNpuRKwZH`
9. **Analos Monitoring System** - `7PT1ubRGFWXFCmZTpsa9gtm9GZf8BaYTkSd7gE8VcXdG`

### Out of Scope

The following are considered out of scope:

- Issues in third-party dependencies (please report to the respective maintainers)
- Social engineering attacks
- Denial of Service attacks
- Issues requiring physical access to a user's device

### Disclosure Policy

- We practice coordinated disclosure
- We will work with you to understand and resolve the issue quickly
- We request that you do not publicly disclose the issue until we have addressed it
- Once fixed, we will publish a security advisory crediting you (if desired)

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service interruption
- Only interact with accounts you own or with explicit permission
- Do not exploit a security issue for malicious purposes
- Report the vulnerability promptly

We will not pursue legal action against security researchers who follow this policy.

## Security Measures

### Verified Builds

All our programs are verifiable through:
- [Solana Verify](https://github.com/Ellipsis-Labs/solana-verifiable-build)
- [OtterSec Verify API](https://verify.osec.io/)
- Source code in this repository

### Security.txt

Each program contains embedded security contact information following the [securitytxt.org](https://securitytxt.org/) standard.

You can query security.txt for any deployed program:

```bash
cargo install --git https://github.com/neodyme-labs/solana-security-txt query-security-txt
query-security-txt <PROGRAM_ID>
```

### Audits

**Current Status:** Not yet audited

We are in the process of arranging professional security audits. This section will be updated when audits are completed.

## Contact

- **Project:** Analos NFT Launchpad
- **Website:** https://analos.io
- **Twitter:** [@EWildn](https://twitter.com/EWildn)
- **Telegram:** [t.me/Dubie_420](https://t.me/Dubie_420)
- **Security Email:** security@analos.io

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-12 | Initial security policy |

---

**Last Updated:** October 12, 2025
