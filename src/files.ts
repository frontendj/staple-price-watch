type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<{
    createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
  }>;
  showOpenFilePicker?: (options: {
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<Array<{ getFile: () => Promise<File> }>>;
};

export async function saveTextFile(filename: string, contents: string, mime: string): Promise<void> {
  const picker = window as SavePickerWindow;
  if (picker.showSaveFilePicker) {
    const handle = await picker.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: filename, accept: { [mime]: [filename.slice(filename.lastIndexOf("."))] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function openTextFile(): Promise<string | undefined> {
  const picker = window as SavePickerWindow;
  if (picker.showOpenFilePicker) {
    const [handle] = await picker.showOpenFilePicker({
      types: [{ description: "JSON backup", accept: { "application/json": [".json"] } }],
    });
    if (!handle) {
      return undefined;
    }
    return (await handle.getFile()).text();
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(undefined);
        return;
      }
      void file.text().then(resolve);
    };
    input.click();
  });
}
