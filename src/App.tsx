import React, { useState, useRef } from "react";
import {
  Briefcase,
  FileText,
  Upload,
  User,
  GraduationCap,
  Star,
  Award,
  BookOpen,
  Download,
  Printer,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { NCSRecommendationResult, RIASECScores } from "./types";

// Helper functions to convert oklch(), oklab(), lab(), lch(), color() colors to rgb() or rgba() standard color space.
// This prevents missing backgrounds/colors and blank texts in screenshots with engines like html2canvas.
function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  if (isNaN(h)) h = 0;
  const r_h = (h * Math.PI) / 180;
  const a = c * Math.cos(r_h);
  const b_val = c * Math.sin(r_h);
  return oklabToRgb(l, a, b_val);
}

function oklabToRgb(l: number, a: number, b_val: number): { r: number; g: number; b: number } {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b_val;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b_val;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b_val;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_linear = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_linear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_linear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

  const toSRGB = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(toSRGB(r_linear) * 255),
    g: Math.round(toSRGB(g_linear) * 255),
    b: Math.round(toSRGB(b_linear) * 255)
  };
}

function labToRgb(l: number, a: number, b_val: number): { r: number; g: number; b: number } {
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b_val / 200;

  const finvt = (t: number) => {
    return t > 6/29 ? t * t * t : 3 * (6/29) * (6/29) * (t - 4/29);
  };

  x = 0.95047 * finvt(x);
  y = 1.00000 * finvt(y);
  z = 1.08883 * finvt(z);

  let r_linear = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g_linear = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b_linear = x * 0.0557 + y * -0.2040 + z * 1.0570;

  const toSRGB = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(toSRGB(r_linear) * 255),
    g: Math.round(toSRGB(g_linear) * 255),
    b: Math.round(toSRGB(b_linear) * 255)
  };
}

function lchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  const r_h = (h * Math.PI) / 180;
  const a = c * Math.cos(r_h);
  const b_val = c * Math.sin(r_h);
  return labToRgb(l, a, b_val);
}

function parseOklch(str: string): string {
  return str.replace(/oklch\(([^)]+)\)/gi, (match, inner) => {
    const parts = inner.trim().split(/[\s,+/]+/);
    if (parts.length < 3) return match;
    try {
      const lStr = parts[0];
      const cStr = parts[1];
      const hStr = parts[2];
      const aStr = parts[3];

      let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      let c = cStr.endsWith('%') ? parseFloat(cStr) / 100 : parseFloat(cStr);
      let h = parseFloat(hStr);
      let alpha = aStr ? (aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr)) : 1;

      if (isNaN(l) || isNaN(c) || isNaN(h)) return "rgb(128,128,128)";

      const { r, g, b } = oklchToRgb(l, c, h);
      return aStr ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
      return "rgb(128,128,128)";
    }
  });
}

function parseOklab(str: string): string {
  return str.replace(/oklab\(([^)]+)\)/gi, (match, inner) => {
    const parts = inner.trim().split(/[\s,+/]+/);
    if (parts.length < 3) return match;
    try {
      const lStr = parts[0];
      const aStrVal = parts[1];
      const bStrVal = parts[2];
      const alphaStr = parts[3];

      let l = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
      let a = aStrVal.endsWith('%') ? parseFloat(aStrVal) / 100 : parseFloat(aStrVal);
      let b_val = bStrVal.endsWith('%') ? parseFloat(bStrVal) / 100 : parseFloat(bStrVal);
      let alpha = alphaStr ? (alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr)) : 1;

      if (isNaN(l) || isNaN(a) || isNaN(b_val)) return "rgb(128,128,128)";

      const { r, g, b } = oklabToRgb(l, a, b_val);
      return alphaStr ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
      return "rgb(128,128,128)";
    }
  });
}

function parseLab(str: string): string {
  return str.replace(/lab\(([^)]+)\)/gi, (match, inner) => {
    const parts = inner.trim().split(/[\s,+/]+/);
    if (parts.length < 3) return match;
    try {
      const lStr = parts[0];
      const aStrVal = parts[1];
      const bStrVal = parts[2];
      const alphaStr = parts[3];

      let l = lStr.endsWith('%') ? parseFloat(lStr) : parseFloat(lStr);
      let a = aStrVal.endsWith('%') ? parseFloat(aStrVal) : parseFloat(aStrVal);
      let b_val = bStrVal.endsWith('%') ? parseFloat(bStrVal) : parseFloat(bStrVal);
      let alpha = alphaStr ? (alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr)) : 1;

      if (isNaN(l) || isNaN(a) || isNaN(b_val)) return "rgb(128,128,128)";

      const { r, g, b } = labToRgb(l, a, b_val);
      return alphaStr ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
      return "rgb(128,128,128)";
    }
  });
}

function parseLch(str: string): string {
  return str.replace(/lch\(([^)]+)\)/gi, (match, inner) => {
    const parts = inner.trim().split(/[\s,+/]+/);
    if (parts.length < 3) return match;
    try {
      const lStr = parts[0];
      const cStr = parts[1];
      const hStr = parts[2];
      const aStr = parts[3];

      let l = lStr.endsWith('%') ? parseFloat(lStr) : parseFloat(lStr);
      let c = cStr.endsWith('%') ? parseFloat(cStr) : parseFloat(cStr);
      let h = parseFloat(hStr);
      let alpha = aStr ? (aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr)) : 1;

      if (isNaN(l) || isNaN(c) || isNaN(h)) return "rgb(128,128,128)";

      const { r, g, b } = lchToRgb(l, c, h);
      return aStr ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
    } catch {
      return "rgb(128,128,128)";
    }
  });
}

function parseColorFunction(str: string): string {
  return str.replace(/color\(([^)]+)\)/gi, (match, inner) => {
    const parts = inner.trim().split(/[\s,+/]+/);
    if (parts.length < 4) return match;
    try {
      const rStr = parts[1];
      const gStr = parts[2];
      const bStr = parts[3];
      const aStr = parts[4];

      let r = rStr.endsWith('%') ? parseFloat(rStr) / 100 : parseFloat(rStr);
      let g = gStr.endsWith('%') ? parseFloat(gStr) / 100 : parseFloat(gStr);
      let b = bStr.endsWith('%') ? parseFloat(bStr) / 100 : parseFloat(bStr);
      let alpha = aStr ? (aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr)) : 1;

      const rNum = Math.round(Math.max(0, Math.min(1, r)) * 255);
      const gNum = Math.round(Math.max(0, Math.min(1, g)) * 255);
      const bNum = Math.round(Math.max(0, Math.min(1, b)) * 255);

      return aStr ? `rgba(${rNum}, ${gNum}, ${bNum}, ${alpha})` : `rgb(${rNum}, ${gNum}, ${bNum})`;
    } catch {
      return "rgb(128,128,128)";
    }
  });
}

function transformColorsInText(text: string): string {
  if (!text) return text;
  let resultText = text;
  const lowerText = resultText.toLowerCase();
  if (lowerText.includes("oklch")) {
    resultText = parseOklch(resultText);
  }
  if (lowerText.includes("oklab")) {
    resultText = parseOklab(resultText);
  }
  if (lowerText.includes("lch")) {
    resultText = parseLch(resultText);
  }
  if (lowerText.includes("lab(")) { // match "lab(" to avoid matching words ending in lab
    resultText = parseLab(resultText);
  }
  if (lowerText.includes("color(")) {
    resultText = parseColorFunction(resultText);
  }
  return resultText;
}

export default function App() {
  // Input Selection state
  const [activeTab, setActiveTab] = useState<"file" | "manual">("file");
  const [riasecCode, setRiasecCode] = useState<string>("");
  const [strengths, setStrengths] = useState<string>("");
  const [hopeJob, setHopeJob] = useState<string>("");
  const [edu, setEdu] = useState<string>("");

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileMime, setFileMime] = useState<string>("");

  // Loading, Errors, and Result states
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfSaving, setPdfSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<NCSRecommendationResult | null>(null);

  // Reference for capturing the dashboard container
  const dashboardRef = useRef<HTMLDivElement>(null);

  // File to base64 converter
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const resultString = reader.result as string;
        // Split base64 prefix (e.g. "data:image/png;base64,")
        const commaIndex = resultString.indexOf(",");
        if (commaIndex !== -1) {
          resolve(resultString.substring(commaIndex + 1));
        } else {
          resolve(resultString);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Drag-and-drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      alert("JPG, PNG 이미지 파일 또는 PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    
    // Check file size (max 8MB for processing safety)
    if (file.size > 8 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다 (최대 8MB 허용). 더 작은 파일을 업로드해주세요.");
      return;
    }

    try {
      setSelectedFile(file);
      const b64 = await convertToBase64(file);
      setFileBase64(b64);
      setFileMime(file.type);
      setErrorMsg(null);
    } catch (err) {
      console.error("파일 하위 변환 에러:", err);
      alert("파일 처리 과정에 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  // Run Recommendation Request
  const handleRecommend = async () => {
    setErrorMsg(null);

    // Validation
    if (activeTab === "manual") {
      const cleanCode = riasecCode.trim().toUpperCase();
      if (!cleanCode) {
        setErrorMsg("흥미코드를 입력해주세요 (예: SA, RI, EC 등).");
        return;
      }
      if (!/^[RIASEC]{1,6}$/i.test(cleanCode)) {
        setErrorMsg("올바른 RIASEC 흥미코드를 입력해주세요 (R, I, A, S, E, C 문자로 구성).");
        return;
      }
    } else {
      if (!selectedFile) {
        setErrorMsg("검사 결과를 업로드하거나, 흥미코드를 수동으로 입력해주세요.");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: activeTab,
          riasec_code: riasecCode.toUpperCase().trim(),
          strengths: strengths.trim(),
          hope_job: hopeJob.trim(),
          edu: edu.trim(),
          file_base64: activeTab === "file" ? fileBase64 : "",
          mime_type: activeTab === "file" ? fileMime : "",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        let errorMsg = `AI 추천 통신 실패 (상태 코드: ${response.status})`;
        if (isJson) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorData.details || errorMsg;
            if (errorData.details && typeof errorData.details === "string") {
              errorMsg += ` (상세: ${errorData.details})`;
            }
          } catch (e) {
            // parsing error fallback
          }
        } else {
          const textMsg = await response.text();
          errorMsg = `AI 호출 실패 (상태 ${response.status}): ${textMsg.slice(0, 300)}`;
        }
        throw new Error(errorMsg);
      }

      if (!isJson) {
        const textMsg = await response.text();
        throw new Error(`분석 서버의 응답 형식이 올바르지 않습니다 (JSON 아님). 응답 원본 (상태 200): ${textMsg.slice(0, 300)}`);
      }

      const rawText = await response.text();
      let recommendationData: NCSRecommendationResult;
      try {
        const extractJson = (text: string): string => {
          let cleaned = text.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?/i, "");
          }
          if (cleaned.endsWith("```")) {
            cleaned = cleaned.replace(/```$/, "");
          }
          cleaned = cleaned.trim();
          const startIdx = cleaned.indexOf("{");
          const endIdx = cleaned.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            cleaned = cleaned.substring(startIdx, endIdx + 1);
          }
          return cleaned;
        };

        const cleanedJson = extractJson(rawText);
        recommendationData = JSON.parse(cleanedJson);
      } catch (parseErr: any) {
        throw new Error(`AI 응답 JSON 파싱 실패: ${parseErr.message}. 응답 원본: ${rawText.slice(0, 300)}`);
      }

      setResult(recommendationData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "직무 분석 과정에 오류가 발생했습니다. 잠시 후 상단 비밀키 설정을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Download logic 1: Export Standalone self-contained HTML
  const downloadHTML = () => {
    if (!result || !dashboardRef.current) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const dashboardHtml = dashboardRef.current.innerHTML;

    // Create a complete styled HTML standalone template with embedded styles and charts
    const fullHtmlPage = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NCS 직무추천 결과보고서 - ${result.riasec_code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700&display=swap');
    
    body {
      font-family: 'Noto Sans KR', 'Inter', sans-serif;
      background-color: #fcfbf7;
      margin: 0;
      padding: 0;
      color: #1c1917;
    }
    
    .print-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 24px;
      background-color: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    /* Embedded subset of Tailwind rules for safe offline rendering */
    .grid { display: grid; }
    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .gap-4 { gap: 16px; }
    .gap-6 { gap: 24px; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .rounded-xl { border-radius: 12px; }
    .rounded-2xl { border-radius: 16px; }
    .p-4 { padding: 16px; }
    .p-6 { padding: 24px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    
    /* Elegant theme variables mapping */
    .card-light { background-color: #fafaf9; border: 1px solid #f5f5f4; }
    .badge-primary { background-color: #fef3c7; color: #92400e; }
    .highlight-text { color: #d97706; }

    @media (min-width: 768px) {
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .flex-row { flex-direction: row; }
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #f5f5f4; padding-bottom: 20px;">
      <span style="background-color: #f7fee7; color: #3f6212; padding: 4px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600;">국민취업지원제도 청년 진로 도우미</span>
      <h1 style="color: #44403c; margin: 10px 0 4px 0; font-size: 32px; letter-spacing: -0.05em;">NCS 직무추천 결과 리포트</h1>
      <p style="color: #78716c; font-size: 15px; margin: 0;">발행일자: ${todayStr} | 진로 상담 기초 데이터 반영</p>
    </div>
    
    ${dashboardHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtmlPage], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `직무추천_결과_${todayStr}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download logic 2: Generate PDF using html2canvas and jsPDF (A4 responsive pagination)
  const downloadPDF = async () => {
    if (!result || !dashboardRef.current) return;

    setPdfSaving(true);
    const todayStr = new Date().toISOString().split("T")[0];

    // Backup to easily restore stylesheets after the capture
    const originalStylesheets: { element: HTMLElement; href?: string; text?: string; parent: Node; nextSibling: Node | null }[] = [];
    let tempContainer: HTMLDivElement | null = null;

    try {
      // 1. Temporarily fetch and sanitize ALL linked and inline stylesheets in the main document.
      // This is necessary because html2canvas parses document.styleSheets directly, crashing on oklch/oklab.
      const styleElements = Array.from(document.querySelectorAll("style"));
      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

      // Clean inline style tags
      styleElements.forEach(tag => {
        const text = tag.textContent || "";
        originalStylesheets.push({
          element: tag,
          text: text,
          parent: tag.parentNode!,
          nextSibling: tag.nextSibling
        });
        tag.textContent = transformColorsInText(text);
      });

      // Fetch, clean, and inline external linked stylesheets
      const fetchAndSanitizePromises = linkElements.map(async (link) => {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const originalCss = await response.text();
            const sanitizedCss = transformColorsInText(originalCss);

            // Create temporary style element to hold sanitized rules
            const tempStyle = document.createElement("style");
            tempStyle.textContent = sanitizedCss;
            tempStyle.setAttribute("data-temp-sanitized-style", "true");

            // Backup link
            originalStylesheets.push({
              element: link,
              href: link.href,
              parent: link.parentNode!,
              nextSibling: link.nextSibling
            });

            // Replace link on DOM
            link.parentNode!.insertBefore(tempStyle, link);
            link.disabled = true;
          }
        } catch (err) {
          console.error(`Failed to fetch/clean linked stylesheet: ${link.href}`, err);
        }
      });

      // Wait for all stylesheet transformations
      await Promise.all(fetchAndSanitizePromises);

      // Give browser a split second to paint the style changes
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 100)));

      // 2. Clone the target element, attach to an off-screen container, and inline ALL computed colors
      const originalElement = dashboardRef.current;
      tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.top = "-9999px";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = originalElement.offsetWidth + "px";
      tempContainer.style.background = "#ffffff";
      document.body.appendChild(tempContainer);

      const clonedElement = originalElement.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedElement);

      const originalNodes = originalElement.getElementsByTagName("*");
      const clonedNodes = clonedElement.getElementsByTagName("*");

      const pairs = [{ orig: originalElement, clone: clonedElement }];
      for (let i = 0; i < originalNodes.length; i++) {
        pairs.push({
          orig: originalNodes[i] as HTMLElement,
          clone: clonedNodes[i] as HTMLElement
        });
      }

      // Explicitly map computed modern colors to safe RGB/RGBA standard colors on the clone
      pairs.forEach(({ orig, clone }) => {
        if (!orig || !clone) return;
        const computed = window.getComputedStyle(orig);

        const colorProperties = [
          "color",
          "background-color",
          "border-color",
          "border-top-color",
          "border-bottom-color",
          "border-left-color",
          "border-right-color",
          "fill",
          "stroke"
        ];

        colorProperties.forEach(prop => {
          const rawVal = computed.getPropertyValue(prop);
          if (rawVal) {
            const lowerVal = rawVal.toLowerCase();
            if (lowerVal.includes("oklch") || 
                lowerVal.includes("oklab") || 
                lowerVal.includes("lch") || 
                lowerVal.includes("lab") || 
                lowerVal.includes("color")) {
              clone.style.setProperty(prop, transformColorsInText(rawVal), "important");
            } else {
              // Standard rgb()/rgba() or basic values evaluated by the browser are copied directly to guarantee matching rendering in html2canvas
              clone.style.setProperty(prop, rawVal, "important");
            }
          }
        });

        // Convert any custom style variables in the inline styles of cloned elements
        if (clone.style) {
          for (let j = 0; j < clone.style.length; j++) {
            const propName = clone.style[j];
            const val = clone.style.getPropertyValue(propName);
            if (val) {
              const lowerVal = val.toLowerCase();
              if (lowerVal.includes("oklch") || 
                  lowerVal.includes("oklab") || 
                  lowerVal.includes("lch") || 
                  lowerVal.includes("lab") || 
                  lowerVal.includes("color")) {
                clone.style.setProperty(propName, transformColorsInText(val), "important");
              }
            }
          }
        }
      });

      // Wait slightly for layout stabilization on clone
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Render html2canvas of the perfectly sanitized cloned node
      const canvas = await html2canvas(clonedElement, {
        useCORS: true,
        scale: 2, // High resolution scaling
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Double safety inside onclone callback
          const clonedAll = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < clonedAll.length; i++) {
            const el = clonedAll[i] as HTMLElement;

            // Clean inline style tags or extra elements
            if (el.style) {
              for (let j = 0; j < el.style.length; j++) {
                const prop = el.style[j];
                const val = el.style.getPropertyValue(prop);
                if (val) {
                  const lowerVal = val.toLowerCase();
                  if (lowerVal.includes("oklch") || 
                      lowerVal.includes("oklab") || 
                      lowerVal.includes("lch") || 
                      lowerVal.includes("lab") || 
                      lowerVal.includes("color")) {
                    try {
                      el.style.setProperty(prop, transformColorsInText(val), el.style.getPropertyPriority(prop));
                    } catch (e) {}
                  }
                }
              }
            }

            // Clean attributes
            const fillAttr = el.getAttribute("fill");
            if (fillAttr && (fillAttr.toLowerCase().includes("oklch") || fillAttr.toLowerCase().includes("oklab"))) {
              el.setAttribute("fill", transformColorsInText(fillAttr));
            }
            const strokeAttr = el.getAttribute("stroke");
            if (strokeAttr && (strokeAttr.toLowerCase().includes("oklch") || strokeAttr.toLowerCase().includes("oklab"))) {
              el.setAttribute("stroke", transformColorsInText(strokeAttr));
            }
          }
        }
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Multi-page splitting logic
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`직무추천_결과_${todayStr}.pdf`);
    } catch (err) {
      console.error("PDF 생성 오류:", err);
      alert("PDF 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      // CLEANUP STAGE: Restore all original styles and nodes!
      const styleElements = Array.from(document.querySelectorAll("style"));
      styleElements.forEach(tag => {
        const backup = originalStylesheets.find(b => b.element === tag);
        if (backup && backup.text !== undefined) {
          tag.textContent = backup.text;
        }
      });

      const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      linkElements.forEach(link => {
        link.disabled = false;
      });

      // Remove temporary styles and offscreen clone container
      document.querySelectorAll('style[data-temp-sanitized-style="true"]').forEach(el => el.remove());
      if (tempContainer) {
        tempContainer.remove();
      }

      setPdfSaving(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setRiasecCode("");
    setStrengths("");
    setHopeJob("");
    setEdu("");
    setSelectedFile(null);
    setFileBase64("");
    setFileMime("");
    setErrorMsg(null);
  };

  // Radial points rendering helper for our hexagonal RIASEC Radar Chart
  const renderRadarChart = (scores: RIASECScores) => {
    const cx = 150;
    const cy = 150;
    const maxVal = 100;
    const rMax = 95; // Max radius for 100 score

    const categories: { key: keyof RIASECScores; label: string; fullLabel: string; color: string }[] = [
      { key: "R", label: "현실형 (R)", fullLabel: "현실형 (Realistic)", color: "#ef4444" },
      { key: "I", label: "탐구형 (I)", fullLabel: "탐구형 (Investigative)", color: "#3b82f6" },
      { key: "A", label: "예술형 (A)", fullLabel: "예술형 (Artistic)", color: "#f59e0b" },
      { key: "S", label: "사회형 (S)", fullLabel: "사회형 (Social)", color: "#10b981" },
      { key: "E", label: "진취형 (E)", fullLabel: "진취형 (Enterprising)", color: "#8b5cf6" },
      { key: "C", label: "관습형 (C)", fullLabel: "관습형 (Conventional)", color: "#ec4899" },
    ];

    // Compute coordinate algorithm: start top (-90 degrees)
    const getCoordinates = (index: number, score: number) => {
      const angle = -90 + index * 60;
      const rad = (angle * Math.PI) / 180;
      const currentRadius = (score / maxVal) * rMax;
      const x = cx + currentRadius * Math.cos(rad);
      const y = cy + currentRadius * Math.sin(rad);
      return { x, y };
    };

    // concentric background hexes coordinates (25%, 50%, 75%, 100%)
    const ringPercentages = [25, 50, 75, 100];
    const ringGridPaths = ringPercentages.map((percentage) => {
      const points = categories.map((_, i) => {
        const { x, y } = getCoordinates(i, percentage);
        return `${x},${y}`;
      });
      return points.join(" ");
    });

    // Compute exact response path polygon
    const responsePolygonPoints = categories.map((cat, i) => {
      const score = Math.max(5, Math.min(100, scores[cat.key] || 0));
      const { x, y } = getCoordinates(i, score);
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-stone-200 shadow-sm relative overflow-visible">
        <h4 className="font-bold text-stone-800 text-sm mb-4 flex items-center gap-1.5 self-start">
          <span className="w-1.5 h-3.5 bg-amber-500 rounded-full inline-block"></span>
          RIASEC 6가지 유형 흥미특성표
        </h4>
        
        <svg viewBox="0 0 300 300" className="w-full max-w-[270px] h-auto overflow-visible">
          {/* Radial concentric rings */}
          {ringGridPaths.map((points, idx) => (
            <polygon
              key={`ring-${idx}`}
              points={points}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="1"
              strokeDasharray={idx < 3 ? "2 2" : "none"}
            />
          ))}

          {/* Core axes lines */}
          {categories.map((_, idx) => {
            const { x: endX, y: endY } = getCoordinates(idx, 100);
            return (
              <line
                key={`axis-${idx}`}
                x1={cx}
                y1={cy}
                x2={endX}
                y2={endY}
                stroke="#e7e5e4"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Reference concentric text labels */}
          {ringPercentages.map((percent, idx) => {
            const { x, y } = getCoordinates(3, percent); // alignment at 6 o'clock
            return (
              <text
                key={`label-pct-${idx}`}
                x={x}
                y={y - 2}
                fontSize="7"
                fill="#a8a29e"
                textAnchor="middle"
                className="font-mono text-[7px]"
              >
                {percent}
              </text>
            );
          })}

          {/* Actual score filled translucent polygon path */}
          <polygon
            points={responsePolygonPoints}
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Colored interactive outer nodes */}
          {categories.map((cat, idx) => {
            const score = Math.max(5, Math.min(100, scores[cat.key] || 0));
            const { x, y } = getCoordinates(idx, score);
            const { x: lblX, y: lblY } = getCoordinates(idx, 100);
            
            // Offset text labels slightly outward so they are read easily
            const offset = 18;
            const angle = -90 + idx * 60;
            const rad = (angle * Math.PI) / 180;
            const textX = cx + (rMax + offset) * Math.cos(rad);
            const textY = cy + (rMax + offset) * Math.sin(rad) + 2;

            return (
              <g key={`node-${idx}`}>
                {/* Score point circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill={cat.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="shadow-sm"
                />
                
                {/* Label text */}
                <text
                  x={textX}
                  y={textY}
                  fontSize="8.5"
                  className="font-bold text-[9px]"
                  fill="#44403c"
                  textAnchor="middle"
                >
                  {cat.label}
                </text>

                {/* Score display on tooltip circle */}
                <text
                  x={textX}
                  y={textY + 10}
                  fontSize="8"
                  className="font-mono font-medium text-[8px]"
                  fill={cat.color}
                  textAnchor="middle"
                >
                  {score}점
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-4 grid grid-cols-3 gap-1.5 w-full text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl">
          {categories.map((cat) => (
            <div key={`legend-${cat.key}`} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
              <span className="font-medium">{cat.key}: {scores[cat.key] || 0}점</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-slate-800 selection:bg-orange-100 selection:text-orange-900 pb-12 font-sans">
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <Briefcase size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 id="main-title" className="font-bold text-slate-800 text-base sm:text-lg tracking-tight leading-none">
                청년 진로 NCS 직무추천 <span className="text-orange-500 font-normal">대시보드</span>
              </h1>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">국민취업지원제도 진로 탐색 도우미</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs bg-orange-100/70 text-orange-800 px-3 py-1.5 rounded-full font-semibold border border-orange-200/50">
              ● 고용24 & NCS 연계형
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-12 translate-y-12">
            <Sparkles size={250} />
          </div>
          <div className="space-y-2 relative z-10 text-center sm:text-left">
            <span className="text-[11px] font-bold tracking-wider uppercase bg-slate-900 text-orange-400 px-2.5 py-1 rounded-full">
              국직용 진로 설계 키트
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none pt-1">
              나의 강점과 흥미로 여는 커리어 지도
            </h2>
            <p className="text-xs sm:text-sm font-medium text-orange-50 max-w-xl leading-relaxed">
              고용24 흥미강점검사 및 RIASEC 유형과 본인의 학력 및 역량을 토대로, 한국 국가직무능력표준(NCS) 분류 체계의 최적화된 유망 직무 3가지를 매칭해 드립니다.
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-md text-slate-800 border border-orange-200 p-4 rounded-xl shadow-xs text-xs space-y-1 max-w-[280px]">
            <p className="font-bold text-orange-600 flex items-center gap-1">
              <AlertCircle size={14} className="text-orange-500" />
              진로상담 서비스 탑재 내용
            </p>
            <p className="leading-relaxed text-slate-600 font-medium">
              RIASEC 유형 두 글자를 기반으로 핵심 역량 및 훈련과정을 꼼꼼하게 설계하여 제공합니다.
            </p>
          </div>
        </div>

        {/* Input Form & Dashboard Section */}
        {!result ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileText size={18} className="text-orange-500" />
                기초 진로 정보 기재
              </h3>
              <div className="text-xs text-slate-400 font-mono">STEP 1 - INPUT</div>
            </div>

            {/* Input Mode Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl mb-6">
              <button
                onClick={() => {
                  setActiveTab("file");
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "file"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload size={14} />
                [방식 A] 검사 결과지 업로드
              </button>
              <button
                onClick={() => {
                  setActiveTab("manual");
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "manual"
                    ? "bg-white text-orange-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Briefcase size={14} />
                [방식 B] 직접 정보 입력
              </button>
            </div>

            {/* Safety/Privacy Notification Message */}
            <div className="bg-orange-50/60 border border-orange-100 text-orange-950 rounded-xl p-3.5 text-xs mb-6 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-850">개인정보보호 및 업로드 주의사항</p>
                <p className="text-[11px] leading-relaxed text-orange-900/80 mt-0.5">
                  주민번호·연락처 등 민감한 개인정보가 담긴 전체 서류는 일체 올리지 마십시오. 결과지의 흥미코드 및 점수가 나타난 부분만 일부 캡쳐하여 올려주시기 바랍니다.
                </p>
              </div>
            </div>

            {/* TAB CONTENT: A (FILE UPLOAD) */}
            {activeTab === "file" && (
              <div className="space-y-5">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${
                    dragActive
                      ? "border-orange-500 bg-orange-50/50"
                      : "border-slate-300 bg-slate-50/50 hover:bg-slate-100/50"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleFileChange}
                  />
                  <div className="w-11 h-11 bg-white rounded-full border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs mb-3">
                    <Upload size={20} className={dragActive ? "text-orange-500" : "text-slate-400"} />
                  </div>
                  
                  <p className="text-xs font-bold text-slate-700 text-center">
                    {selectedFile ? selectedFile.name : "결과 결과지 파일 드롭 또는 외부 선택"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    {selectedFile 
                      ? `업로드 완료 • ${(selectedFile.size / 1024).toFixed(1)} KB` 
                      : "이미지 (PNG, JPG, JPEG) 또는 PDF 파일 (최대 8MB)"}
                  </p>

                  <button
                    onClick={() => document.getElementById("file-upload-input")?.click()}
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
                  >
                    파일 찾아 선택하기
                  </button>
                </div>

                {selectedFile && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5 text-emerald-950 text-xs text-left">
                    <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">준비 완료!</span> 이미지 파일이 정상 로드되어 추천 로직 시점의 문자 해독 및 AI 진단이 즉각 가능합니다.
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-600 text-xs text-left">선택 입력 사항 (검사지와 함께 반영하면 더욱 정확합니다)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-600">주요 강점</label>
                      <input
                        type="text"
                        value={strengths}
                        onChange={(e) => setStrengths(e.target.value)}
                        placeholder="예: 공감 능력 우수, 철저함"
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-slate-600">희망직종 및 학력</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                           value={hopeJob}
                           onChange={(e) => setHopeJob(e.target.value)}
                           placeholder="희망 직종"
                           className="w-1/2 text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                        <input
                          type="text"
                          value={edu}
                          onChange={(e) => setEdu(e.target.value)}
                          placeholder="예: 대학교 졸"
                          className="w-1/2 text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: B (MANUAL ENTRY) */}
            {activeTab === "manual" && (
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      흥미코드 <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={riasecCode}
                      onChange={(e) => setRiasecCode(e.target.value)}
                      placeholder="예: SA, RIC, A (최대 6자리)"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white font-bold tracking-widest placeholder-slate-400 capitalize"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">학력 정보</label>
                    <input
                      type="text"
                      value={edu}
                      onChange={(e) => setEdu(e.target.value)}
                      placeholder="예: 고졸, 대졸, 석사"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">주요 강점</label>
                  <input
                    type="text"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="예: 경청 및 문제해결 능력, 기획력, 신속성 등"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">희망 직무/직종</label>
                  <input
                    type="text"
                    value={hopeJob}
                    onChange={(e) => setHopeJob(e.target.value)}
                    placeholder="예: 웹개발자, 마케팅 기획자, 직업상담사 등"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Error Message Display */}
            {errorMsg && (
              <div className="bg-orange-50 border border-orange-100 text-orange-950 rounded-xl p-3.5 text-xs text-left mt-6 flex items-start gap-2 animate-pulse">
                <AlertCircle size={15} className="text-orange-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Dispatch Action Button */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleRecommend}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>분석 중입니다... 최선의 직무를 도출하는 중</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-white" />
                    <span>직무 추천받기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* RESULT DASHBOARD INTERFACE */
          <div className="space-y-8 animate-fade-in">
            {/* Command Area - Excluded from Capture */}
            <div className="bg-white border border-orange-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-700">고용24 NCS 매칭 완료</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={downloadHTML}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>HTML로 저장하기</span>
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={pdfSaving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm disabled:shadow-none cursor-pointer"
                >
                  {pdfSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>PDF 만드는 중...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={14} className="text-white" />
                      <span>PDF로 저장하기</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw size={14} className="text-orange-500" />
                  <span>다시 입력</span>
                </button>
              </div>
            </div>

            {/* Core printable content wrapper */}
            <div
              ref={dashboardRef}
              id="recommendation-results-container"
              className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-9 shadow-sm space-y-10"
            >
              {/* Header Title in PDF */}
              <div className="border-b-2 border-orange-50 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-xs bg-orange-50 text-orange-800 font-bold px-3 py-1 rounded-full border border-orange-100 inline-block">
                    국민취업지원제도 진로컨설팅 리포트
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none">
                    고용24 NCS 직무 역량 제안서
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">한국산업인력공단 정규 직무 기준 매칭 완료</p>
                </div>
                <div className="text-left md:text-right font-mono text-[11px] text-slate-400 space-y-0.5">
                  <p className="font-bold text-slate-500 flex items-center gap-1">
                    <Calendar size={12} className="text-orange-500" />
                    컨설팅 일시: {new Date().toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p>이메일: m.naver.com</p>
                </div>
              </div>

              {/* SECTION 1: Bento Cards (Summary) */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-xs flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1 h-3.5 bg-orange-500 rounded-full inline-block"></span>
                  흥미코드 및 강점 정보
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Interest Code highlight */}
                  <div className="bg-[#FFFBF7] border border-orange-100 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">흥미코드</span>
                    <div className="my-1">
                      <div className="text-4xl font-black text-orange-600 block">
                        {result.riasec_code || "SA"}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500 block mt-1">
                      {result.riasec_code.toUpperCase().includes("S") ? "사회형 " : ""}
                      {result.riasec_code.toUpperCase().includes("A") ? "예술형 " : ""}
                      {result.riasec_code.toUpperCase().includes("R") ? "현실형 " : ""}
                      {result.riasec_code.toUpperCase().includes("I") ? "탐구형 " : ""}
                      {result.riasec_code.toUpperCase().includes("E") ? "진취형 " : ""}
                      {result.riasec_code.toUpperCase().includes("C") ? "관습형" : ""}
                      유형 조화
                    </span>
                  </div>

                  {/* Card 2: Personal Strengths */}
                  <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-xs">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">주요 강점</span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {result.strengths ? (
                        result.strengths.split(/[,·\n]/).map((st, sidx) => {
                          const clean = st.trim();
                          if (!clean) return null;
                          return (
                            <span key={sidx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                              {clean}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-sm text-slate-500">진단된 주요 강점 분석 중</span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Hope job and Education */}
                  <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-xs">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">희망직종 · 학력</span>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-700">
                        {result.hope_job || "상담 후 연계"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {result.edu || "미입력 (기본 고려)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Hexagonal Chart and Details */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 gap-y-8">
                {/* SVG Radar Chart block */}
                <div className="lg:col-span-2">
                  {renderRadarChart(result.scores)}
                </div>

                {/* Helpful Type Explanations */}
                <div className="lg:col-span-3 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5">
                      <Award size={16} className="text-orange-500" />
                      성향 유형별 진단을 통한 진로설계
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed space-y-3">
                      고용24 유형 분석에 따르면 6요소 중 <span className="font-bold text-orange-600">{result.riasec_code}</span> 가 주요 축으로 나타납니다.
                      이것은 개인의 일상적 흥미와 열의가 지향하는 현실적인 직무 범주를 명확히 가리키고 있습니다.
                    </p>
                    
                    <div className="space-y-2.5 mt-4">
                      {result.riasec_code.toUpperCase().split("").map((letter, idx) => {
                        let desc = "";
                        let title = "";
                        let colorBg = "";
                        let colorText = "";
                        
                        if (letter === "S") {
                          title = "사회형 (Social) : 타인의 치유와 교육을 돕는 영역";
                          desc = "교육, 상담, 보건의료, 사회복지 등 사람과의 정서적 교류와 유대를 필수적으로 요하는 NCS 사회서비스 군과 연계성이 매우 높음.";
                          colorBg = "bg-emerald-50";
                          colorText = "text-emerald-950";
                        } else if (letter === "A") {
                          title = "예술형 (Artistic) : 무유형에서 유를 창출하는 콘텐츠 특화";
                          desc = "문화예술디자인방송, 광고 기획, 미디어 등 자유롭고 창조 성향이 발현되는 직종이 주된 성과로 나타납니다.";
                          colorBg = "bg-orange-50";
                          colorText = "text-orange-950";
                        } else if (letter === "R") {
                          title = "현실형 (Realistic) : 분석적 도구 및 장비 제어";
                          desc = "기계, 전기전자, 건설공학, 제어 등 실제 사물이나 하드웨어를 다루며 가치를 창출하는 직무와 일치합니다.";
                          colorBg = "bg-rose-50";
                          colorText = "text-rose-950";
                        } else if (letter === "I") {
                          title = "탐구형 (Investigative) : 학구적 논리와 분석 해결사";
                          desc = "정보통신 연구개발, 바이오 화학, 환경에너지안전 등 수치와 패턴을 증명하는 과학적 영역에 능합니다.";
                          colorBg = "bg-blue-50";
                          colorText = "text-blue-950";
                        } else if (letter === "E") {
                          title = "진취형 (Enterprising) : 목표 조율 및 고부가가치 경영가";
                          desc = "일반 경영 마케팅, 신규 비즈니스 제안, 영업관리 등 조직의 성장을 이끄는 리더십 직무에서 크게 활약합니다.";
                          colorBg = "bg-purple-50";
                          colorText = "text-purple-950";
                        } else if (letter === "C") {
                          title = "관습형 (Conventional) : 시스템적 정확성과 인프라 운영 보증";
                          desc = "금융보험, 인사회계, IT기초운영 등 원칙과 기준에 근거한 무결점 보증 직무수행에서 높은 효능감을 느낍니다.";
                          colorBg = "bg-pink-50";
                          colorText = "text-pink-950";
                        } else {
                          return null;
                        }

                        return (
                          <div key={idx} className={`${colorBg} ${colorText} p-3 rounded-xl border border-slate-200/40 text-[11px]`}>
                            <p className="font-bold mb-0.5">{title}</p>
                            <p className="opacity-90 leading-relaxed">{desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 mt-4 leading-normal">
                    * 위 결과는 가독성 확보용 캡쳐 이미지 자료 분석 또는 기재 데이터를 기반으로 즉석 매칭되었으므로 정식 결과 리포트와 상응하는 방향성을 가집니다.
                  </div>
                </div>
              </div>

              {/* SECTION 3: Recommended Careers Dashboard (TOP 3) */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block"></span>
                  추천 직무 TOP 3
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  {result.recommendations && result.recommendations.map((job, idx) => (
                    <div
                      key={`job-${idx}`}
                      className="bg-white border border-slate-200 hover:border-orange-400 rounded-2xl p-6 transition-all duration-300 shadow-xs relative overflow-hidden"
                    >
                      {/* Rating star block */}
                      <div className="absolute right-6 top-6 flex items-center gap-0.5 bg-orange-50/60 border border-orange-100/30 px-3 py-1.5 rounded-full">
                        <span className="text-[10px] font-bold text-orange-850 mr-1.5">추천 적합도</span>
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            size={14}
                            className={
                              starIdx < job.rating
                                ? "fill-orange-500 text-orange-500"
                                : "text-slate-300"
                            }
                          />
                        ))}
                      </div>

                      {/* Header content */}
                      <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2.5 py-1 rounded-md border border-orange-100/40 inline-block mb-3">
                        추천 순위 #0{idx + 1}
                      </span>
                      
                      <div className="space-y-1">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                          {job.title}
                        </h4>
                        <p className="text-xs text-orange-600 font-semibold font-mono tracking-tight">
                          {job.ncs_category}
                        </p>
                      </div>

                      {/* Details with elegant subdivisions */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5 pt-5 border-t border-slate-100">
                        {/* Why fitting column (8 cols wide on large screens) */}
                        <div className="md:col-span-8 space-y-4">
                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span className="w-1 h-3 bg-orange-400 rounded-full inline-block"></span>
                              왜 적합한가
                            </h5>
                            <p className="text-xs leading-relaxed text-slate-600">
                              {job.why_fitting}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span className="w-1 h-3 bg-orange-400 rounded-full inline-block"></span>
                              필요 역량 & 지식
                            </h5>
                            <p className="text-xs leading-relaxed text-slate-600">
                              {job.capabilities}
                            </p>
                          </div>
                        </div>

                        {/* Practical Certifications & Training resources (4 cols wide) */}
                        <div className="md:col-span-4 bg-[#FFFBF7] border border-orange-100 rounded-xl p-4 space-y-4 text-xs">
                          <div className="space-y-1">
                            <h5 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Award size={13} className="text-orange-500" />
                              도움되는 자격증
                            </h5>
                            <p className="text-[11px] leading-relaxed text-slate-600 font-medium text-left">
                              {job.licenses}
                            </p>
                          </div>

                          <div className="space-y-1 pt-3.5 border-t border-orange-100">
                            <h5 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <BookOpen size={13} className="text-orange-500" />
                              훈련과정 (내일배움카드)
                            </h5>
                            <p className="text-[11px] leading-relaxed text-slate-500 mb-1.5 font-medium text-left">
                              {job.training}
                            </p>
                            <span className="text-[10px] font-bold bg-orange-50 text-orange-900 border border-orange-100/40 px-2 py-0.5 rounded inline-block text-left">
                              ※ hrd.go.kr에서 세부 명세 조회
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Personalized coaching section */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 sm:p-7 shadow-xs">
                <h3 className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                  <span className="w-1.5 h-3.5 bg-orange-500 rounded-full inline-block"></span>
                  청년에게 한마디
                </h3>
                
                <div className="flex gap-4 items-start text-left">
                  <div className="w-10 h-10 bg-orange-100 text-orange-900 border border-orange-200 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                     <User size={18} />
                  </div>
                  <div className="space-y-4 w-full">
                    <p className="text-xs leading-relaxed text-slate-600 font-bold whitespace-pre-wrap italic">
                      "{result.message_to_youth}"
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-2xs">
                        <span className="font-bold text-slate-700 block mb-1">진로체험 프로그램</span>
                        <p className="text-[11px] text-slate-400">실제 현업과 직무 현장을 방문하는 온/오프라인 직무 체험</p>
                      </div>
                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-2xs">
                        <span className="font-bold text-slate-700 block mb-1">현직자 실무 인터뷰</span>
                        <p className="text-[11px] text-slate-400">그 직업을 가진 종사자와의 미팅을 통한 정확한 실무 조사</p>
                      </div>
                      <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-2xs">
                        <span className="font-bold text-slate-700 block mb-1">국직 종합상담 지원</span>
                        <p className="text-[11px] text-slate-400">전담 컨설턴트와의 매칭을 통한 이력서 세분화 클리닉</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Disclaimers */}
              <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-1 text-center font-medium">
                <p>본 추천 보고서는 진로 탐색을 돕기 위해 인공지능이 제공하는 정밀 상담용 보조 수치입니다.</p>
                <p className="text-orange-600 font-bold">
                  "본 추천은 진로탐색을 돕기 위한 참고자료이며, 정확한 직무·훈련 정보는 상담사 및 고용24·HRD-Net을 통해 확인하세요."
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

