import { createWorker, OEM } from "tesseract.js";
import corePath from "tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url";
import workerPath from "tesseract.js/dist/worker.min.js?url";
import { readShelfTag, type TagRead } from "./read-shelf-tag";

export async function recogniseTag(image: Blob): Promise<TagRead> {
  try {
    const worker = await createWorker("eng", OEM.LSTM_ONLY, {
      workerPath,
      corePath,
      langPath: `${import.meta.env.BASE_URL}tessdata`,
      gzip: true,
    });
    const result = await worker.recognize(image);
    await worker.terminate();
    return readShelfTag(result.data.text);
  } catch {
    return {};
  }
}
