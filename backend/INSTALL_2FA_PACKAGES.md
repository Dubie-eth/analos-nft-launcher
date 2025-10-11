# 📦 **INSTALL 2FA PACKAGES FOR BACKEND**

To enable the Secure Keypair Rotation with 2FA, install these packages:

```bash
cd backend

# Install 2FA libraries
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode

# Rebuild
npm run build
```

These packages provide:
- `speakeasy` - TOTP (Time-based One-Time Password) generation
- `qrcode` - QR code generation for Google Authenticator setup

