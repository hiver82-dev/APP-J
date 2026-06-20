import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Ensure the server can handle larger payloads (e.g., base64 images or PDFs)
const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

const PORT = 3000;

// Initialize the Google GenAI SDK (Server-Side Only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// System instruction for NCS counselor agent
const SYSTEM_INSTRUCTION = `당신은 국민취업지원제도 청년 진로상담을 돕는 NCS 직무추천 도우미입니다.
청년의 고용24 직업흥미강점검사 결과(흥미코드 RIASEC)와 추가정보(희망직종·학력)를 입력받거나, 업로드된 문서/이미지에서 흥미코드 및 점수를 판독하여 적합한 NCS 직무 3가지를 추천해야 합니다.

[흥미코드 → NCS 대분류 연계 기준]
- R(현실형): 기계/전기전자/건설/재료/운전운송/농림어업
- I(탐구형): 정보통신/화학바이오/보건의료/환경에너지안전/연구
- A(예술형): 문화예술디자인방송/콘텐츠
- S(사회형): 교육/사회복지/보건의료/음식서비스/고객상담
- E(진취형): 경영회계사무(영업마케팅)/영업판매/숙박여행
- C(관습형): 경영회계사무/금융보험/IT운영

※ 흥미코드 두 글자 중 첫 글자를 주축으로 하고, 둘째 글자로 세부직무를 좁힙니다.
※ 청년의 희망직종·학력을 반영해 현실적으로 3개로 압축하십시오.

[운영 규칙 및 안전장치]
1. 실제 입력에 있는 내용과 판독해낸 기호/점수만을 토대로 점수를 매핑하며 절대 허위나 임의의 개인정보를 작출하지 마십시오.
2. 추천 직무는 반드시 한국의 NCS 분류(대분류 > 중분류 > 소분류 > 세분류)에 존재하는 인정 가능한 정식 직무로 한정하십시오.
3. 청년의 눈높이에 맞는 쉽고, 따뜻하며, 구체적인 어조의 격려 텍스트(message_to_youth)를 포함해 주세요.
4. 모든 자격증과 직업훈련은 국가기술/전문자격증 또는 국민내일배움카드 등으로 개설되어 일반적으로 수강 가능한 대표적인 과정을 제안하고, 상세 훈련 과정과 실제 과정 개설 정보는 "고용24(work24.go.kr) 및 HRD-Net(hrd.go.kr)에서 확인하라"는 안내를 해당 필드에 꼭 포함하십시오.`;

// Define structured JSON Response Schema for Gemini API Call
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    riasec_code: {
      type: Type.STRING,
      description: "2-letter or outer code, e.g., 'SA', 'RI', 'EC' based on analysis or user input."
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        R: { type: Type.INTEGER, description: "Realistic score (0 to 100)" },
        I: { type: Type.INTEGER, description: "Investigative score (0 to 100)" },
        A: { type: Type.INTEGER, description: "Artistic score (0 to 100)" },
        S: { type: Type.INTEGER, description: "Social score (0 to 100)" },
        E: { type: Type.INTEGER, description: "Enterprising score (0 to 100)" },
        C: { type: Type.INTEGER, description: "Conventional score (0 to 100)" }
      },
      required: ["R", "I", "A", "S", "E", "C"],
      description: "Provide RIASEC scores. If there are no raw scores, prioritize the entered code (e.g. if code is SA: S=90, A=80, others are low like 10-30)."
    },
    strengths: {
      type: Type.STRING,
      description: "Extracted or provided key strengths."
    },
    hope_job: {
      type: Type.STRING,
      description: "Extracted or provided desired job category."
    },
    edu: {
      type: Type.STRING,
      description: "Extracted or provided education level."
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Precise Job Title (NCS-aligned)" },
          ncs_category: { type: Type.STRING, description: "NCS Classification level (e.g. '02. 경영·회계·사무 > 02. 총무·인사 > 01. 인사')" },
          rating: { type: Type.INTEGER, description: "A suitability rating from 1 to 5 stars" },
          why_fitting: { type: Type.STRING, description: "Detailed explanation connecting RIASEC code, strengths, high scores, and user preferences." },
          capabilities: { type: Type.STRING, description: "Key capabilities (e.g., 의사소통 능력, 전산 활용 능력 등)" },
          licenses: { type: Type.STRING, description: "A list of relevant certifications (e.g., 사회복지사 2급, 컴퓨터활용능력 등)" },
          training: { type: Type.STRING, description: "Representative training programs/resources + explicit advice to search on HRD-Net." }
        },
        required: ["title", "ncs_category", "rating", "why_fitting", "capabilities", "licenses", "training"]
      },
      description: "Exactly 3 recommended jobs tailored to this user."
    },
    message_to_youth: {
      type: Type.STRING,
      description: "A friendly, warm counseling note, providing direct encouraging recommendations and concrete next step actions (such as job shadowing or specialized programs)."
    },
    extracted_from_file: {
      type: Type.BOOLEAN,
      description: "Flag indicating whether user-uploaded document content was processed and analyzed successfully."
    }
  },
  required: ["riasec_code", "scores", "strengths", "hope_job", "edu", "recommendations", "message_to_youth", "extracted_from_file"]
};

// API Route for recommendation
app.post("/api/recommend", async (req, res) => {
  try {
    const { method, riasec_code, strengths, hope_job, edu, file_base64, mime_type } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다. AI 비밀키를 설정해 주세요." });
    }

    const contents_parts: any[] = [];

    if (method === "file" && file_base64 && mime_type) {
      contents_parts.push({
        inlineData: {
          data: file_base64,
          mimeType: mime_type,
        },
      });

      contents_parts.push({
        text: `이 업로드된 고용24 직업흥미강점검사 결과 문서/이미지를 정밀 판독하십시오.
만약 여기서 RIASEC 코드나 각 흥미유형 점수(R, I, A, S, E, C)가 파악된다면 그것들을 추출하십시오.
추가 입력 정보(있을 때에만 참고): 강점("${strengths || "공백"}"), 희망직종("${hope_job || "공백"}"), 학력("${edu || "공백"}") 가 기재되어 있다면 이를 결합해 최적의 NCS 직무를 성실히 도출하십시오.
결과지로부터 코드 분석이 불가능할 경우, 기본 강점과 희망직종에 매칭되는 임의의 RIASEC 시나리오를 구성해 일관되게 주십시오.`,
      });
    } else {
      contents_parts.push({
        text: `청년 진로 기초 정보 입력값:
- 흥미코드: ${riasec_code || "SA"}
- 주요 강점: ${strengths || "없음"}
- 희망직종: ${hope_job || "없음"}
- 학력: ${edu || "없음"}

이 입력 정보를 NCS 대분류 기준 및 매칭 가이드라인에 따라 철저히 대입해 주십시오.
R, I, A, S, E, C 의 점수(scores)는 사용자가 기재한 흥미코드순으로 가장 높게(예: 'SA'가 주어지면 S는 90, A는 83 점 수준, 나머지는 15~40 사이의 다양한 점수로 적당히 설정) 균형 있게 배분하여 시각화할 수 있도록 채우십시오.`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents_parts,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI가 빈 결과를 반환했습니다.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("AI Recommendation Error:", error);
    return res.status(500).json({
      error: "진로 추천을 분석하는 도중 에러가 발생했습니다. 정확히 가독성 높은 검사결과 이미지를 올렸는지 혹은 입력값을 채웠는지 다시 확인해보세요.",
      details: error.message || error,
    });
  }
});

async function run() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] NCS 직무추천 서버가 포트 3000번에서 실행 중입니다.`);
  });
}

run();
