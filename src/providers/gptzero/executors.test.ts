import { describe, expect, it } from "vitest";
import { gptzeroActionHandlers } from "./executors.ts";

describe("GPTZero executors", () => {
  it("preserves provider strings exactly in successful prediction output", async () => {
    const fetcher = async (): Promise<Response> =>
      Response.json({
        version: "  api-v2  ",
        scanId: "",
        documents: [
          {
            document_id: "  document-1  ",
            version: "",
            document_classification: "  MIXED  ",
            result_message: "  Review this result  ",
            average_generated_prob: 0.4,
            completely_generated_prob: 0.2,
            overall_burstiness: 3.5,
            class_probabilities: { ai: 0.4, human: 0.6 },
            confidence_category: "  medium  ",
            confidence_score: 0.7,
            confidence_scores_raw: {},
            writing_stats: {},
            paragraphs: [{ completely_generated_prob: 0.2, num_sentences: 1, start_sentence_index: 0 }],
            sentences: [
              {
                sentence: "  Leading and trailing whitespace matters.  ",
                generated_prob: 0.4,
                perplexity: 8,
                highlight_sentence_for_ai: false,
              },
            ],
          },
        ],
      });

    const result = await gptzeroActionHandlers.detect_text!(
      { document: "Document to inspect" },
      { apiKey: "gptzero-key", fetcher },
    );

    expect(result).toMatchObject({
      version: "  api-v2  ",
      scanId: "",
      documents: [
        {
          documentId: "  document-1  ",
          version: "",
          classification: "  MIXED  ",
          resultMessage: "  Review this result  ",
          confidenceCategory: "  medium  ",
          sentences: [{ sentence: "  Leading and trailing whitespace matters.  " }],
        },
      ],
    });
  });

  it("rejects provider probabilities outside the documented range", async () => {
    const fetcher = async (): Promise<Response> =>
      Response.json({
        documents: [{ average_generated_prob: 1.01 }],
      });

    await expect(
      gptzeroActionHandlers.detect_text!({ document: "Document to inspect" }, { apiKey: "gptzero-key", fetcher }),
    ).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining("outside the range from 0 to 1"),
    });
  });
});
