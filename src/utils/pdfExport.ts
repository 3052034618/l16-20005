import jsPDF from "jspdf";
import type { Report, SimulationTask } from "@/types";

export function generateReportPDF(report: Report, task: SimulationTask | undefined): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(0, 212, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PBF-Sim", margin + 5, 18);

  doc.setTextColor(230, 237, 243);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("熔池动力学模拟分析报告", margin + 40, 18);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(8);
  doc.text(`报告编号: ${report.id.slice(0, 8).toUpperCase()}`, pageWidth - margin - 40, 14, { align: "right" });
  doc.text(`生成时间: ${new Date(report.createdAt).toLocaleString("zh-CN")}`, pageWidth - margin - 40, 20, { align: "right" });

  y = 42;

  doc.setTextColor(22, 27, 34);
  doc.setFillColor(240, 245, 250);
  doc.rect(margin, y, contentWidth, 18, "F");

  doc.setTextColor(0, 165, 204);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("任务基本信息", margin + 5, y + 12);

  y += 24;

  const infoRows = [
    ["任务名称", task?.name ?? "未知任务"],
    ["材料类型", task?.materialType ?? "未知"],
    ["激光功率", `${task?.laserParams.power ?? 0} W`],
    ["扫描速度", `${task?.laserParams.scanSpeed ?? 0} mm/s`],
    ["扫描策略", task?.laserParams.scanStrategy ?? "条纹扫描"],
    ["基板温度", `${task?.substrateParams.temperature ?? 0} °C`],
    ["层厚", `${task?.powderParams.layerThickness ?? 0} μm`],
    ["粒径", `${task?.powderParams.particleSize ?? 0} μm`],
  ];

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const colWidth = contentWidth / 2 - 10;
  for (let i = 0; i < infoRows.length; i += 2) {
    const row1 = infoRows[i];
    const row2 = infoRows[i + 1];

    doc.text(row1[0], margin + 5, y + 3);
    doc.setTextColor(22, 27, 34);
    doc.setFont("helvetica", "bold");
    doc.text(row1[1], margin + 35, y + 3);

    if (row2) {
      doc.setTextColor(139, 148, 158);
      doc.setFont("helvetica", "normal");
      doc.text(row2[0], margin + 5 + colWidth + 20, y + 3);
      doc.setTextColor(22, 27, 34);
      doc.setFont("helvetica", "bold");
      doc.text(row2[1], margin + 35 + colWidth + 20, y + 3);
    }

    doc.setTextColor(139, 148, 158);
    doc.setFont("helvetica", "normal");
    y += 7;
  }

  y += 5;

  doc.setTextColor(0, 165, 204);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("熔池形貌", margin, y);

  y += 8;

  const poolW = report.meltPoolMorphology.width;
  const poolD = report.meltPoolMorphology.depth;
  const poolL = report.meltPoolMorphology.length;

  const poolDrawX = margin + 10;
  const poolDrawY = y + 5;
  const poolDrawW = 60;
  const poolDrawH = 25;

  for (let i = 0; i < 10; i++) {
    const ratio = i / 10;
    const r = Math.floor(255 - ratio * 200);
    const g = Math.floor(200 - ratio * 150);
    const b = Math.floor(0 + ratio * 50);
    doc.setFillColor(r, g, b);
    doc.ellipse(
      poolDrawX + poolDrawW / 2,
      poolDrawY + poolDrawH / 2,
      (poolDrawW / 2) * (1 - ratio * 0.3),
      (poolDrawH / 2) * (1 - ratio * 0.3),
      "F"
    );
  }

  const poolRightX = margin + 80;

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("熔池宽度", poolRightX, y + 5);
  doc.setTextColor(22, 27, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${poolW.toFixed(3)} mm`, poolRightX, y + 11);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("熔池深度", poolRightX + 40, y + 5);
  doc.setTextColor(22, 27, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${poolD.toFixed(3)} mm`, poolRightX + 40, y + 11);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("熔池长度", poolRightX, y + 22);
  doc.setTextColor(22, 27, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${poolL.toFixed(3)} mm`, poolRightX, y + 28);

  y += 40;

  doc.setTextColor(255, 107, 53);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("温度场", margin, y);

  y += 8;

  const tempDrawX = margin + 10;
  const tempDrawY = y + 5;
  const tempSize = 35;

  for (let i = 0; i < 12; i++) {
    const ratio = i / 12;
    const r = 255;
    const g = Math.floor(217 - ratio * 180);
    const b = Math.floor(61 - ratio * 50);
    doc.setFillColor(r, g, b);
    doc.circle(tempDrawX + tempSize / 2, tempDrawY + tempSize / 2, (tempSize / 2) * (1 - ratio * 0.05), "F");
  }

  const tempRightX = margin + 55;

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("最高温度", tempRightX, y + 5);
  doc.setTextColor(255, 71, 87);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${report.temperatureField.maxTemp.toFixed(0)} °C`, tempRightX, y + 11);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("平均温度", tempRightX, y + 22);
  doc.setTextColor(255, 107, 53);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${report.temperatureField.avgTemp.toFixed(0)} °C`, tempRightX, y + 27);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("温度梯度", tempRightX + 45, y + 22);
  doc.setTextColor(22, 27, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${(report.temperatureField.gradient / 1e6).toFixed(2)} ×10⁶`, tempRightX + 45, y + 27);

  y += 45;

  doc.setTextColor(0, 229, 160);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("残余应力分布", margin, y);

  y += 8;

  const barChartX = margin + 10;
  const barChartY = y + 5;
  const barChartW = contentWidth - 20;
  const barChartH = 30;
  const positions = ["起点", "1/4", "中点", "3/4", "终点"];
  const stressBase = report.residualStress.maxStress;
  const stressFactors = [0.65, 0.85, 1.0, 0.78, 0.55];
  const barW = barChartW / positions.length - 6;

  positions.forEach((_pos, i) => {
    const val = stressBase * stressFactors[i];
    const barH = (val / stressBase) * barChartH;
    const barX = barChartX + i * (barW + 6);
    const barY = barChartY + barChartH - barH;

    const ratio = val / stressBase;
    let r, g, b;
    if (ratio > 0.9) {
      r = 255; g = 71; b = 87;
    } else if (ratio > 0.7) {
      r = 255; g = 107; b = 53;
    } else {
      r = 0; g = 229; b = 160;
    }
    doc.setFillColor(r, g, b);
    doc.rect(barX, barY, barW, barH, "F");

    doc.setTextColor(139, 148, 158);
    doc.setFontSize(7);
    doc.text(positions[i], barX + barW / 2, barChartY + barChartH + 5, { align: "center" });
  });

  const stressRightX = margin + 5;
  const stressValY = barChartY + barChartH + 15;

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("最大应力", stressRightX, stressValY);
  doc.setTextColor(255, 71, 87);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${report.residualStress.maxStress.toFixed(0)} MPa`, stressRightX + 25, stressValY);

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("分布类型", stressRightX + 70, stressValY);
  doc.setTextColor(22, 27, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(report.residualStress.distribution, stressRightX + 95, stressValY);

  y += 55;

  const porosityPercent = report.porosityDeviation * 100;
  const isHigh = report.porosityDeviation >= 0.2;

  doc.setFillColor(isHigh ? 255 : 0, isHigh ? 107 : 229, isHigh ? 53 : 160);
  doc.setDrawColor(isHigh ? 255 : 0, isHigh ? 107 : 229, isHigh ? 53 : 160);
  doc.rect(margin, y, contentWidth, 22, "FD");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    isHigh ? "⚠ 孔隙率偏差超标" : "✓ 孔隙率偏差在可接受范围内",
    margin + 8,
    y + 14
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${porosityPercent.toFixed(2)}%`, pageWidth - margin - 10, y + 15, { align: "right" });

  y += 32;

  doc.setTextColor(139, 148, 158);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "本报告由 PBF-Sim 粉末床熔融模拟平台自动生成，数据仅供参考。",
    margin,
    pageHeight - 15
  );
  doc.text(
    "PBF-Sim v1.0 | 高精度熔池动力学模拟系统",
    pageWidth - margin,
    pageHeight - 15,
    { align: "right" }
  );

  const fileName = `PBF-Report-${report.id.slice(0, 8).toUpperCase()}.pdf`;
  doc.save(fileName);
}
