import QRCode from 'qrcode';

/** PNG data URL suitable for `<img src>` and download links. */
export async function qrCodePngDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    width: 280,
    margin: 2,
    type: 'image/png',
  });
}
