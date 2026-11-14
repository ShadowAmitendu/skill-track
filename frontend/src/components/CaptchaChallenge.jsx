import { useEffect, useRef } from "react";
import { useTheme } from "../context/useTheme";
import { createSeededRng } from "./captcha-utils";

export function CaptchaChallenge({ code, width = 210, height = 44 }) {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rng = createSeededRng(code || "SKILL");

    ctx.fillStyle = isDark ? "#1c2127" : "#f6f7f9";
    ctx.fillRect(0, 0, width, height);

    const lineColors = isDark
      ? ["rgba(138, 187, 255, 0.24)", "rgba(171, 179, 191, 0.18)"]
      : ["rgba(33, 93, 176, 0.2)", "rgba(95, 107, 124, 0.22)"];

    for (let i = 0; i < 6; i += 1) {
      ctx.strokeStyle = lineColors[i % lineColors.length];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rng() * width, rng() * height);
      ctx.bezierCurveTo(
        rng() * width,
        rng() * height,
        rng() * width,
        rng() * height,
        rng() * width,
        rng() * height
      );
      ctx.stroke();
    }

    for (let i = 0; i < 32; i += 1) {
      ctx.fillStyle = lineColors[i % lineColors.length];
      ctx.beginPath();
      ctx.arc(rng() * width, rng() * height, 0.9 + rng() * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    const textColors = isDark
      ? ["#f6f7f9", "#8abbff", "#d3d8de", "#4c90f0"]
      : ["#182026", "#215db0", "#2f343c", "#1c4e91"];

    const chars = (code || "").split("");
    const step = (width - 28) / Math.max(chars.length, 1);

    chars.forEach((char, idx) => {
      const x = 18 + idx * step + (rng() - 0.5) * 4;
      const y = height / 2 + 7 + (rng() - 0.5) * 6;
      const angle = (rng() - 0.5) * 0.42;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = '700 21px "Inter Variable", ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillStyle = textColors[Math.floor(rng() * textColors.length)];
      ctx.textBaseline = "alphabetic";
      ctx.fillText(char, -6, 0);
      ctx.restore();
    });
  }, [code, width, height, isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      role="img"
      aria-label="Captcha challenge image"
      className="block rounded-[3px] border border-[rgba(17,20,24,0.18)] dark:border-[rgba(255,255,255,0.2)] select-none shrink-0"
    />
  );
}
