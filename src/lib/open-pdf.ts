export function openPdfDataUrl(dataUrl: string, filename = "documento.pdf") {
  const [, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  const win = window.open(blobUrl, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
