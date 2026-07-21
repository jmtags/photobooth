function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, content] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

export async function shareOrSavePrintImage(dataUrl: string, fileName: string) {
  const file = dataUrlToFile(dataUrl, fileName);
  const shareData = {
    files: [file],
    title: "Photobooth print sheet",
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return "shared";
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return "saved";
}
