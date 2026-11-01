import { createWorker, OEM, PSM } from "tesseract.js";
import corePath from "tesseract.js-core/tesseract-core-simd-lstm.wasm.js?url";
import workerPath from "tesseract.js/dist/worker.min.js?url";

export async function recogniseTag(image: Blob): Promise<string> {
  try {
    const worker = await createWorker("eng", OEM.LSTM_ONLY, {
      workerPath,
      corePath,
      langPath: `${import.meta.env.BASE_URL}tessdata`,
      gzip: true,
    });
    // A wide gap between £ and the amount is still one price. One text block
    // drops the decimal (£ 12.5 becomes £ 125) or misses the pound sign.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const result = await worker.recognize(image);
    await worker.terminate();
    return result.data.text;
  } catch {
    return "";
  }
}
